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

普通 `upload` 命令会在一次 commit 中提交所有文件，文件过多时容易超时。对于 60GB+ 的数据集，推荐使用 `upload-large-folder`，它会自动分批提交，且支持��点续传：

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
