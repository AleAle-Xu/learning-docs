# Git 忽略已追踪的文件

## 问题：`.gitignore` 不生效

在 `.gitignore` 中添加了某个文件或目录后，发现 Git 仍然在追踪它的变化，`git status` 依然显示该文件被修改，`push` / `pull` 依然很慢。

**根本原因：`.gitignore` 只对未追踪（untracked）的文件生效，对已经被 Git 追踪（tracked）的文件无效。**

一旦文件被 `git add` 加入暂存区并提交过，Git 就会持续追踪它的变化，即使后来把它加入 `.gitignore`，Git 也不会自动停止追踪。

---

## 排查：确认文件是否已被追踪

### 方法 1：检查 `git ls-files`

```bash
# 列出所有被 Git 追踪的文件
git ls-files

# 检查特定目录是否被追踪
git ls-files | grep "large_data/"
```

如果输出中包含该文件或目录，说明它已被追踪。

### 方法 2：查看 `git status`

```bash
git status
```

如果文件显示为 `modified` 或 `deleted`，说明它仍在被追踪。

### 方法 3：查看历史提交

```bash
# 查看某个文件的提交历史
git log --all --full-history -- large_data/

# 查看仓库中所有大文件（超过 10MB）
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {print substr($0,6)}' | \
  sort -n -k2 | \
  tail -20
```

---

## 解决方案

### 步骤 1：从 Git 索引中移除文件

使用 `git rm --cached` 将文件从 Git 的追踪列表中移除，但保留本地文件不删除。

```bash
# 移除单个文件
git rm --cached large_file.bin

# 移除整个目录（-r 递归）
git rm -r --cached large_data/
```

**参数说明：**
- `--cached`：只从 Git 索引（暂存区）中删除，不删除工作目录中的实际文件
- `-r`：递归处理目录

### 步骤 2：确认 `.gitignore` 已添加

```bash
# 编辑 .gitignore
echo "large_data/" >> .gitignore
```

### 步骤 3：提交变更

```bash
git add .gitignore
git commit -m "Stop tracking large_data/ and add to .gitignore"
```

此时，`large_data/` 已从 Git 的追踪列表中移除，后续修改不会再被 Git 检测到。

### 步骤 4：推送到远程

```bash
git push
```

---

## 进阶：清理历史记录中的大文件

即使执行了上述步骤，**历史提交中依然保留着这些大文件**，导致 `.git` 目录体积庞大，`clone` / `pull` 依然很慢。

要彻底清理，需要重写 Git 历史，删除所有提交中的该文件。

### 方法 1：使用 `git filter-repo`（推荐）

`git filter-repo` 是官方推荐的历史重写工具，比 `filter-branch` 更快更安全。

**安装：**

```bash
pip install git-filter-repo
```

**⚠️ 操作前必须提交所有修改：**

```bash
# 确保工作区干净，否则 filter-repo 可能会使改动丢失
git status
git add .
git commit -m "Save work before filter-repo"
```

**删除指定文件或目录：**

```bash
# 从所有历史提交中删除 large_data/ 目录
git filter-repo --path large_data/ --invert-paths
```

**参数说明：**
- `--path large_data/`：指定要处理的路径
- `--invert-paths`：反转匹配，即删除该路径（不加则是只保留该路径）

**删除所有大于 10MB 的文件：**

```bash
git filter-repo --strip-blobs-bigger-than 10M
```

**重新添加远程仓库：**

`git filter-repo` 执行后会自动删除所有远程仓库配置（防止误推送），需要手动重新添加：

```bash
# 查看当前远程仓库（应该为空）
git remote -v

# 重新添加远程仓库
git remote add origin git@github.com:username/repo.git
```

### 方法 2：使用 BFG Repo-Cleaner

BFG 是另一个流行的历史清理工具，速度更快但功能相对简单。

**下载：**

```bash
# 需要 Java 环境
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
```

**删除大文件：**

```bash
# 删除所有大于 10MB 的文件
java -jar bfg-1.14.0.jar --strip-blobs-bigger-than 10M .git

# 删除指定目录
java -jar bfg-1.14.0.jar --delete-folders large_data .git
```

**清理引用：**

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### ⚠️ 注意事项

**重写历史是危险操作，会改变所有提交的 SHA 值，导致：**
1. 所有协作者需要重新 `clone` 仓库
2. 已有的 Pull Request 会失效
3. 无法与旧的远程分支合并

**操作前务必：**
- 通知所有协作者
- 备份仓库：`git clone --mirror`
- 在测试分支上先验证

**强制推送到远程：**

由于历史已被重写，所有提交的 SHA 值都已改变，必须使用 `--force` 强制覆盖远程仓库：

```bash
# 强制推送所有分支
git push origin --force --all

# 强制推送所有标签
git push origin --force --tags
```

> **警告**：`--force` 会覆盖远程仓库的历史，所有协作者的本地仓库都会与远程不兼容，必须重新 `clone`。务必提前通知团队成员。

---

## 验证清理效果

### 查看仓库体积

```bash
# 查看 .git 目录大小
du -sh .git

# 查看所有对象的总大小
git count-objects -vH
```

### 确认文件已从历史中删除

```bash
# 搜索历史中是否还有该文件
git log --all --full-history -- large_data/

# 应该没有任何输出
```

---

## 预防：避免误提交大文件

### 1. 使用 `.gitignore` 模板

在项目初期就配置好 `.gitignore`，常见模板：

```
# 数据文件
*.csv
*.h5
*.pkl
data/
datasets/

# 模型文件
*.pth
*.ckpt
*.safetensors
models/

# 日志和缓存
*.log
__pycache__/
.cache/
```

### 2. 使用 Git LFS 管理大文件

对于必须纳入版本管理的大文件（如模型权重），使用 Git LFS：

```bash
# 安装 Git LFS
git lfs install

# 追踪特定类型的大文件
git lfs track "*.pth"
git lfs track "*.safetensors"

# 提交 .gitattributes
git add .gitattributes
git commit -m "Track large model files with Git LFS"
```

### 3. 配置 pre-commit hook 拦截大文件

在 `.git/hooks/pre-commit` 中添加检查脚本：

```bash
#!/bin/bash
# 拦截大于 10MB 的文件
MAX_SIZE=10485760  # 10MB in bytes

for file in $(git diff --cached --name-only); do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$size" -gt "$MAX_SIZE" ]; then
            echo "Error: $file is larger than 10MB ($size bytes)"
            echo "Consider using Git LFS or adding it to .gitignore"
            exit 1
        fi
    fi
done
```

---

## 参考资料

- [git-filter-repo 官方文档](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git LFS 文档](https://git-lfs.github.com/)
