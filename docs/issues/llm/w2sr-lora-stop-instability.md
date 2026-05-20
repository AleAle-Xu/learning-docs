# W2SR 复现中 LoRA 微调导致模型无法停止

## 场景描述

在复现 [《Incentivizing Strong Reasoning from Weak Supervision》](https://arxiv.org/abs/2505.20072) 这篇论文的实验时，使用小模型生成数学题 CoT 数据，再对 Qwen2.5-7B student 做 SFT。

实验中的主要模型：

- teacher：[hkust-nlp/Qwen-2.5-0.5B-SimpleRL-Zoo](https://huggingface.co/hkust-nlp/Qwen-2.5-0.5B-SimpleRL-Zoo)、[hkust-nlp/Qwen-2.5-1.5B-SimpleRL-Zoo](https://huggingface.co/hkust-nlp/Qwen-2.5-1.5B-SimpleRL-Zoo)
- student：[Qwen/Qwen2.5-7B](https://huggingface.co/Qwen/Qwen2.5-7B)
- 数据集：MATH-lighteval 训练集、MATH500 评估集
- 微调方式：LLaMAFactory + LoRA
- 推理方式：vLLM + LoRA adapter

最初的训练配置大致为：

```yaml
finetuning_type: lora
lora_rank: 32
lora_alpha: 64
lora_target: all
learning_rate: 1e-5
num_train_epochs: 5
```

后来为了排查问题，也测试过 `2 epoch`、`rank=16/alpha=32`、`rank=8/alpha=16` 等配置。

## 问题现象

未微调的 Qwen2.5-7B 在 MATH500 上偶尔会出现长输出或复读，但频率较低，整体 pass@1 正常。

使用弱 teacher 数据微调后，模型经常出现如下问题：

1. 先正常解题，并且已经给出正确的 `\boxed{...}` 答案
2. 但模型没有停止，继续生成大量无关内容
3. 后续输出中出现伪造的聊天边界，例如 `user`、`assistant`
4. 有时还会复制原题，像是在自己开启下一轮问答
5. 最终由于打满 `max_tokens`，`finish_reason=length`
6. 评估脚本默认取最后一个 boxed answer，导致本来答对的题被后续错误答案覆盖

典型输出结构类似：

```text
The final answer is \(\boxed{2220}\).
user
What is the least positive integer multiple of 30 ...
Please reason step by step, and put your final answer within \boxed{}.
assistant
To find the least positive integer multiple ...
...
```

这说明模型的数学能力并没有完全崩坏，真正的问题是：**模型在答完后没有及时输出停止 token，而是继续补全聊天模板或题目上下文**。


## 已排查的可能原因

### 1. 训练数据显式污染

检查 SFT 数据后，未发现训练集中直接包含 `saturn`、`usern`、`فلسطين`、`猶` 等异常字符串。

也就是说，这些奇怪 token 不是从数据里原样学来的，更像是模型停止失败后，在开放式续写状态下采样出的异常分隔符或低概率 token。


### 2. teacher CoT 质量

0.5B / 1.5B teacher 的 CoT 质量有限。即使答案正确，也可能存在啰嗦、模板化、不稳定等问题。

弱 teacher 的长 CoT 数据会让 student 学到两类东西：

- 希望学到的：数学推理模式
- 不希望学到的：长篇续写风格、弱终止习惯、重复解释模式

修改了数据清理逻辑，清理掉一些明显过长的样本。

### 3. LoRA 配置

LoRA rank 和训练 epoch 对这个问题影响很大。

在相同数据下：

```text
rank=32, alpha=64, 2 epoch:
  很快出现大量 length stop 和伪 user/assistant

rank=16, alpha=32, 2 epoch:
  基本没有复现该问题，明显更稳定

rank=16, alpha=32, 5 epoch:
  又开始出现模型不知道何时停止的问题
```

这说明问题不是单纯的数据污染，而是 **LoRA 总训练强度过大，破坏了原始 chat model 的停止行为**。

lora rank越大，模型可学习的容量就越大，就可以更强的改写模型行为。epoch越多，模型会更深地拟合训练分布。

原始 Qwen2.5-7B Chat 已经有较稳定的聊天习惯，但弱 teacher 的训练数据是长 CoT。SFT loss 会反复奖励模型复现这些长答案中的每一个 token。对于长 CoT 来说，正文 token 很多，真正的停止 token 每条样本只有一次，而且在最后。如果 LoRA 配置过强，模型不只是学到“如何推理”，还会学到“继续长篇生成”的倾向。结果就会导致模型无法正确停止。

论文使用的是 full fine-tuning，而这里使用的是 LoRA。两者虽然都在做 SFT，但参数更新方式不同。全量微调的改动可以更均匀地分散到全模型中，模型可能仍然保留比较稳定的 chat boundary 和 `<|im_end|>` 终止分布；而 LoRA 的改动集中在 adapter 上，尤其当 `rank` 较大、`lora_target=all` 时，可能更尖锐地改变中间层表示，从而把“长 CoT 续写风格”放大，却没有同等稳定地校准停止行为。
*（此点仅为推断，未经实验证实）*



## 最终采用的临时方案

1. 采用较保守的 LoRA 配置，适当降低lora rank，修改lora target，减少训练的epoch数。

2. 在训练数据的最后手动添加一个`[end]`，让其也参与损失计算，进一步诱导模型输出结束符。vllm推理时候在提示词中让模型回答完成后输出`[end]`，将`[end]`也作为一个停止符。

## 经验总结

> LoRA 复现 full fine-tuning 论文时，不能直接照搬论文训练轮数和直觉上的“大 rank 更强”。
>
> 对于几千条长 CoT 数学数据，`rank=32, alpha=64, target=all` 已经足够强，可能破坏原始 chat model 的终止分布。表现不是简单的答案错误，而是答完后继续补全 prompt、伪造 user/assistant、最终 length stop。
>
> 更稳妥的做法是先用较小 rank 和较少 epoch，优先保证模型能正常停止，再逐步增加训练强度。
