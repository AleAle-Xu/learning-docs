# 大数据集迁移：上传到 Hugging Face Dataset

## 问题背景

在深度学习项目中遇到需要迁移大型数据集的场景：
- 数据集总大小 60+ GB
- 主要由 `.jpg` 等已压缩格式组成，无法进一步压缩
- 服务器即将到期，需要快速备份迁移
- 传统方式（如 `scp`、网盘）速度慢或容量受限

## 解决方案

使用 [Hugging Face Datasets](https://huggingface.co/docs/datasets) 作为云端存储，通过 `huggingface_hub` CLI 工具上传。

**优势：**
- 免费存储（公开数据集）
- 支持大文件和断点续传
- 方便后续在其他机器直接通过 `datasets` 库加载
- 版本管理和分享便捷

---

## 操作流程

### 1. 安装 Hugging Face CLI

```bash
pip install huggingface_hub
```

---

### 2. 登录认证

使用 Hugging Face 账号的 Access Token 进行认证。

**获取 Token：**
1. 登录 [Hugging Face](https://huggingface.co/)
2. 进入 [Settings → Access Tokens](https://huggingface.co/settings/tokens)
3. 点击 **New token**，选择 `write` 权限，生成 Token

**登录命令：**

```bash
huggingface-cli login
```

执行后会提示输入 Token，粘贴后回车即可。Token 会保存在 `~/.cache/huggingface/token`，后续操作无需重复登录。

**或者直接传入 Token：**

```bash
huggingface-cli login --token YOUR_TOKEN_HERE
```

---

### 3. 创建 Dataset 仓库

在 Hugging Face 上创建一个新的 Dataset 仓库用于存储数据。

```bash
huggingface-cli repo create my-large-dataset --type dataset
```

**参数说明：**
- `my-large-dataset`：仓库名称（会创建为 `your-username/my-large-dataset`）
- `--type dataset`：指定类型为 Dataset（默认是 model）

执行成功后会返回仓库 URL，例如：
```
https://huggingface.co/datasets/your-username/my-large-dataset
```

---

### 4. 上传数据集

#### 4.1 上传单个文件

```bash
huggingface-cli upload your-username/my-large-dataset ./data.zip data.zip
```

**参数说明：**
- `your-username/my-large-dataset`：目标仓库
- `./data.zip`：本地文件路径
- `data.zip`：上传后在仓库中的路径（可选，默认与本地文件名相同）

---

#### 4.2 上传整个文件夹

```bash
huggingface-cli upload your-username/my-large-dataset ./my_dataset_folder/ .
```

**参数说明：**
- `./my_dataset_folder/`：本地文件夹路径
- `.`：上传到仓库根目录（也可以指定子目录，如 `data/`）

**示例：上传到仓库的 `images/` 子目录**

```bash
huggingface-cli upload your-username/my-large-dataset ./local_images/ images/
```

---

#### 4.3 上传超大文件夹（推荐）

对于 60GB+ 的大数据集，建议使用 `--commit-message` 和分批上传策略：

```bash
# 方式 1：直接上传整个文件夹（自动处理大文件）
huggingface-cli upload your-username/my-large-dataset ./large_folder/ . \
  --commit-message "Upload large dataset"

# 方式 2：分批上传（如按子目录）
huggingface-cli upload your-username/my-large-dataset ./large_folder/part1/ part1/
huggingface-cli upload your-username/my-large-dataset ./large_folder/part2/ part2/
```

**注意事项：**
- Hugging Face 会自动使用 Git LFS 处理大文件（>10MB）
- 上传过程支持断点续传，中断后重新执行相同命令即可继续
- 网络不稳定时建议使用 `tmux` 或 `screen` 保持会话

---

### 5. 验证上传结果

访问仓库页面查看文件：
```
https://huggingface.co/datasets/your-username/my-large-dataset/tree/main
```

或使用命令行列出文件：

```bash
huggingface-cli scan-cache
```

---

## 后续使用

### 在其他机器加载数据集

**方式 1：使用 `datasets` 库（推荐）**

```python
from datasets import load_dataset

dataset = load_dataset("your-username/my-large-dataset")
```

**方式 2：使用 `huggingface_hub` 下载**

```bash
# 下载整个仓库
huggingface-cli download your-username/my-large-dataset --repo-type dataset --local-dir ./downloaded_data

# 下载单个文件
huggingface-cli download your-username/my-large-dataset data.zip --repo-type dataset
```

---

## 常见问题

### 1. 上传速度慢

- 检查网络连接，考虑使用代理
- 尝试分批上传，减小单次传输体积
- 使用 `--num-workers` 参数（实验性功能）

### 2. Token 权限不足

确保 Token 具有 `write` 权限，在 [Access Tokens](https://huggingface.co/settings/tokens) 页面重新生成。

### 3. 文件已存在冲突

默认会覆盖同名文件，如需保留历史版本，可通过 Git 操作管理：

```bash
git clone https://huggingface.co/datasets/your-username/my-large-dataset
cd my-large-dataset
# 手动管理文件后提交
git add .
git commit -m "Update dataset"
git push
```

---

## 参考资料

- [Hugging Face Hub CLI 文档](https://huggingface.co/docs/huggingface_hub/guides/cli)
- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets)
- [Git LFS 说明](https://git-lfs.github.com/)
