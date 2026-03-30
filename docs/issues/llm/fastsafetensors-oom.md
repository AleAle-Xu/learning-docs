# fastsafetensors 导致宿主机内存溢出

## 场景描述

在 NVIDIA DGX Spark（GB10，统一内存 120GB）上，尝试部署 **Qwen3.5-122B-A10B-NVFP4** 模型（vLLM 推理服务）。

注意该机器为统一内存，内存就是显存，显存就是内存。一共120GB可用。

- 模型来源：[Sehyo/Qwen3.5-122B-A10B-NVFP4](https://huggingface.co/Sehyo/Qwen3.5-122B-A10B-NVFP4)
- 部署参考：[NVIDIA 开发者社区帖子](https://forums.developer.nvidia.com/t/50-improvement-on-spark/363493/18)（主要参考 3 月 16 日那条评论），对应 [GitHub 仓库](https://github.com/RobTand/spark-vllm-docker/tree/flashinfer-pr-patching)，clone 后按 README 完成部署

社区案例已验证该设备完全可以跑这个模型。启动命令中设置了 `--gpu-memory-utilization 0.7`，预计显存占用约 80GB，在机器承受范围内。

但实际运行时，**GPU 显存占用符合预期，却在权重加载阶段宿主机内存被打满，系统卡死**。

问题启动命令关键参数：

```bash
vllm serve /data/pretrained_models/Qwen3.5-122B-A10B-NVFP4-Sehyo \
  --gpu-memory-utilization 0.7 \
  --load-format fastsafetensors \   # ← 问题所在
  ...
```

## 根本原因：fastsafetensors 的工作原理

### 普通加载方式（`auto`）

`auto` 模式的加载节奏是"读一批、搬一批"：

1. 从磁盘顺序读取一批权重到 CPU 内存
2. 立即将这批数据搬运到 GPU
3. CPU 内存中的中间数据随即释放，继续读下一批

CPU 内存里同时存在的"中间数据"始终只有当前正在处理的那一小批，不会大量积压。

```
磁盘 ──(读一批)──▶ CPU内存(少量中转) ──(搬走)──▶ GPU
                       ↑ 随读随搬，占用始终较低
```

### fastsafetensors 的加载方式

`fastsafetensors` 的优化目标是**消除磁盘 IO 等待**：GPU 搬运数据的速度往往比磁盘读取快，直接顺序读会让 GPU 频繁等待磁盘，浪费吞吐量。

它的解法是**在磁盘→CPU 这段做多线程并发 IO**，提前多读几批压在 CPU 内存里，让 GPU 搬运时始终有数据可取，不用等磁盘：

```
磁盘 ──(多线程并发)──▶ CPU内存(大量积压) ──▶ GPU
         ↑ 并发在这段              ↑ 积压在这里
```

**副作用**：CPU 内存里同时囤积着"已读完但还没搬到 GPU"的权重。对于 Qwen3.5-122B 这样权重文件数十 GB 的超大模型，积压量可能远超剩余物理内存，导致 OOM 卡死。

### 为什么显存占用正常但内存炸了？

`--gpu-memory-utilization` 只控制 **vLLM 运行时的显存分配上限**（KV Cache + 模型权重占用），与**加载阶段 CPU 内存的中间数据积压量无关**，两者完全独立：

| 参数 | 控制对象 | 何时生效 |
|------|---------|---------|
| `--gpu-memory-utilization` | GPU 显存（运行时） | 模型加载完成后 |
| `--load-format` | 权重读取策略（加载时） | 模型启动阶段 |

显存设置得再保守，也管不住加载器在 CPU 内存里囤了多少中间数据。

## 解决方案

将 `--load-format fastsafetensors` 改为 `--load-format auto`：

```bash
vllm serve /data/pretrained_models/Qwen3.5-122B-A10B-NVFP4-Sehyo \
  --port 8000 --host 0.0.0.0 \
  --gpu-memory-utilization 0.65 \
  --served-model-name Qwen3.5-122B-A10B-NVFP4 \
  --max-model-len 32000 \
  --enable-prefix-caching \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder \
  --reasoning-parser qwen3 \
  --max-num-batched-tokens 4096 \
  --load-format auto              # ← 改为 auto，随读随搬，不囤积
```

改为 `auto` 后，模型正常启动。

## 经验总结

> `fastsafetensors` 通过多线程并发磁盘 IO 提升加载速度，代价是 CPU 内存中会积压大量"已读但未搬运"的权重中间数据。在 DGX Spark 这类统一内存架构设备上，物理内存本身是瓶颈，这种积压很容易触发 OOM。
>
> 遇到"显存正常、内存卡死"的现象，优先检查 `--load-format` 参数，改为 `auto` 可有效规避。
