# 大数据集迁移：上传到 Hugging Face Dataset

## 问题背景

在深度学习项目中遇到需要迁移大型数据集的场景：
- 数据集总大小 60+ GB
- 主要由 `.jpg` 等已压缩格式组成，无法进一步压缩
- 服务器即将到期，需要快速备份迁移
- 传统方式（如 `scp`、网盘）速度慢或容量受限

## 解决方案

使用 [Hugging Face Datasets](https://huggingface.co/docs/datasets) 作为云端存储，通过 `huggingface_hub` 提供的 `hf` CLI 工具上传。

**优势：**
- 免费存储（公开数据集）
- 支持大文件、断点续传、并行上传
- 方便后续在其他机器直接通过 `datasets` 库加载
- 版本管理和分享便捷

---

## 操作流程

### 1. 安装

```bash
pip install huggingface_hub
```

安装完成后会提供 `hf` 命令。可通过以下命令确认安装成功：

```bash
hf version
```

---

### 2. 登录认证

使用 Hugging Face 账号的 Access Token 进行认证。

**获取 Token：**
1. 登录 [Hugging Face](https://huggingface.co/)
2. 进入 [Settings → Access Tokens](https://huggingface.co/settings/tokens)
3. 点击 **New token**，权限选择 `write`，生成后复制

**交互式登录（推荐）：**

```bash
hf auth login
```

执行后会提示粘贴 Token，确认后 Token 保存至 `~/.cache/huggingface/token`，后续操作无需重复登录。

**直接传入 Token（适合脚本/CI 环境）：**

```bash
hf auth login --token YOUR_TOKEN_HERE
```

**查看当前登录状态：**

```bash
hf auth whoami
```

---

### 3. 创建 Dataset 仓库

```bash
hf repo create my-large-dataset --repo-type dataset
```

**参数说明：**
- `my-large-dataset`：仓库名称，创建后完整 ID 为 `your-username/my-large-dataset`
- `--repo-type dataset`：指定为 Dataset 类型（默认是 model，必须显式指定）
- `--private`：可选，创建为私有仓库

执行成功后会返回仓库 URL：
```
https://huggingface.co/datasets/your-username/my-large-dataset
```

---

### 4. 上传数据集

#### 4.1 上传单个文件

```bash
hf upload your-username/my-large-dataset ./data.zip data.zip --repo-type dataset
```

**参数说明：**
- `your-username/my-large-dataset`：目标仓库 ID
- `./data.zip`：本地文件路径
- `data.zip`：上传后在仓库中保存的路径（可省略，默认与本地文件同名）
- `--repo-type dataset`：指定仓库类型，上传时同样需要指定

---

#### 4.2 上传整个文件夹

```bash
hf upload your-username/my-large-dataset ./my_dataset_folder/ . --repo-type dataset
```

**参数说明：**
- `./my_dataset_folder/`：本地文件夹路径
- `.`：上传到仓库根目录（也可指定子目录，如 `images/`）

**示例：上传到仓库的 `train/` 子目录：**

```bash
hf upload your-username/my-large-dataset ./local_train_images/ train/ --repo-type dataset
```

**附加选项：**

```bash
# 指定 commit 信息
hf upload your-username/my-large-dataset ./data/ . \
  --repo-type dataset \
  --commit-message "Add training images"

# 只上传部分文件（glob 过滤）
hf upload your-username/my-large-dataset ./data/ . \
  --repo-type dataset \
  --include "*.jpg" "*.png"

# 排除某些文件
hf upload your-username/my-large-dataset ./data/ . \
  --repo-type dataset \
  --exclude "*.tmp" "__pycache__/*"
```

---

#### 4.3 上传超大文件夹（推荐，60GB+ 场景）

普通 `upload` 命令会在一次 commit 中提交所有文件，文件过多时容易超时。对于 60GB+ 的数据集，推荐使用 `upload-large-folder`，它会自动分批提交，且支持断点续传：

```bash
hf upload-large-folder your-username/my-large-dataset ./large_folder/ --repo-type dataset
```

**额外选项：**

```bash
# 指定并行上传的 worker 数量（加速上传，按网络带宽调整）
hf upload-large-folder your-username/my-large-dataset ./large_folder/ \
  --repo-type dataset \
  --num-workers 8

# 只上传部分文件（glob 过滤）
hf upload-large-folder your-username/my-large-dataset ./large_folder/ \
  --repo-type dataset \
  --include "*.jpg"
```

**与普通 `upload` 的区别：**

| | `hf upload` | `hf upload-large-folder` |
|---|---|---|
| 适用场景 | 文件数量少、体积小 | 文件数量多、总体积大 |
| 提交方式 | 一次性 commit | 自动分批 commit |
| 断点续传 | ❌ | ✅ |
| 并行上传 | ❌ | ✅（`--num-workers`） |

> 网络不稳定时建议在 `tmux` 或 `screen` 中运行，避免终端断开导致中断。

---

#### 4.4 ⚡ 海量小文件场景：先打包再上传

**问题现象**

用 `upload-large-folder` 上传一个含有数万张图片的目录，跑了一整晚却只提交了 20GB，速度远低于带宽上限。

**根本原因：Git 的文件数量瓶颈**

Hugging Face 底层使用 Git 做版本管理。Git 对"文件数量"非常敏感，每上传一个文件都要经历以下开销：

1. **哈希计算**：对每个文件计算 SHA256，文件数量越多，总 CPU 时间越长。
2. **Git Tree 构建**：Git 需要在内存中构建包含所有文件路径和哈希的目录树对象。10 万张图片意味着 10 万条记录，树对象本身就很庞大。
3. **逐文件 HTTP 请求**：即使 `upload-large-folder` 会分批 commit，每个文件依然要单独经过"计算哈希 → 检查是否已存在 → 上传数据块"的流程，产生大量网络往返（RTT）。
4. **分批 commit 次数多**：工具每积累一批文件才触发一次 commit，文件越多、批次越多，每次 commit 的元数据写入开销也随之累积。

简单说：**Git 适合管理"少量大文件"，而非"海量小文件"**。带宽其实闲置着，瓶颈在于每个文件的固定处理成本。

**解决方案：打包成单个归档文件再上传**

将目录打包成一个 `.tar` 文件，Git 只需处理 **1 个文件**，所有开销从"文件数 × 单文件成本"降为"1 × 单文件成本"，速度可以从一整晚缩短到几小时。

```bash
# 只打包，不压缩（推荐用于 jpg/png 等已压缩格式）
# -c 创建归档，-f 指定文件名，不加 -z/-j 就不压缩
tar -cf images.tar ./images/

# 上传打包后的单个文件
hf upload your-username/my-large-dataset ./images.tar images.tar --repo-type dataset
```

> **为什么不需要压缩？**
> `.jpg`、`.png` 等图片格式本身已经过压缩，再用 gzip/bzip2 压缩几乎不会减小体积，却会白白消耗大量 CPU 时间。`tar -cf`（不加 `-z`/`-j`）只做"打包"不做"压缩"，速度快很多。

**下载后解包：**

```bash
hf download your-username/my-large-dataset images.tar --repo-type dataset
tar -xf images.tar -C ./images/
```

**效果对比：**

| 方式 | 文件数量（Git 视角） | 实际速度 |
|------|-------------------|----|
| 直接上传文件夹（10 万张图） | 10 万个文件 | 极慢，瓶颈在文件数量 |
| 打包成 `.tar` 再上传 | 1 个文件 | 接近带宽上限 |

---

### 5. 验证上传结果

上传完成后，访问仓库页面确认文件：
```
https://huggingface.co/datasets/your-username/my-large-dataset/tree/main
```

---

## 后续：在其他机器使用数据集

### 方式 1：使用 `datasets` 库加载（推荐）

```python
from datasets import load_dataset

dataset = load_dataset("your-username/my-large-dataset")
```

### 方式 2：使用 `hf download` 下载到本地

```bash
# 下载整个仓库到本地目录
hf download your-username/my-large-dataset \
  --repo-type dataset \
  --local-dir ./downloaded_data

# 只下载某个文件
hf download your-username/my-large-dataset data.zip \
  --repo-type dataset
```

---

## 常见问题

### Token 权限不足

确保 Token 具有 `write` 权限。可在 [Access Tokens](https://huggingface.co/settings/tokens) 页面重新生成，或切换 Token：

```bash
hf auth switch
```

### 上传中断后如何续传

使用 `upload-large-folder` 时，直接重新执行相同命令即可自动跳过已上传的文件，从中断处继续。

### 查看本地缓存

```bash
hf cache
```

---

## 参考资料

- [hf CLI 完整文档](https://huggingface.co/docs/huggingface_hub/guides/cli)
- [上传大文件夹指南](https://huggingface.co/docs/huggingface_hub/guides/upload#upload-a-large-folder)
- [datasets 库文档](https://huggingface.co/docs/datasets)
