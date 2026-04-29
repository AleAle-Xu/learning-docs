# Git 修改已经提交的 commit

## 场景：提交后发现 commit 需要调整

代码已经 `commit` 之后，仍然可以修改这个提交。常见场景包括：

- commit message 写错了
- 漏提交了某个文件
- 提交中包含了不应该提交的文件
- commit 的作者信息错误
- 最近几个 commit 需要逐个调整

这类操作本质上是在重写提交历史。只要修改了已经存在的 commit，就会生成新的 commit SHA。

---

## 一、修改最近一个 commit

如果只需要修改最近一次提交，使用 `git commit --amend`。

### 1. 修改 commit message

```bash
git commit --amend
```

执行后会打开编辑器，可以修改最近一次提交的 message。

如果只想直接指定新的 message：

```bash
git commit --amend -m "新的提交信息"
```

### 2. 补充漏提交的文件

先把遗漏的文件加入暂存区，再 amend：

```bash
git add missing-file.md
git commit --amend --no-edit
```

**参数说明：**

- `--amend`：修改最近一次提交
- `--no-edit`：不修改原来的 commit message

### 3. 从最近一次提交中移除文件

如果某个文件不应该出现在最近一次提交里，可以先从暂存区移除，再 amend：

```bash
git rm --cached secret.txt
git commit --amend --no-edit
```

如果文件已经被提交，但希望本地也删除：

```bash
git rm secret.txt
git commit --amend --no-edit
```

### 4. 修改最近一次提交的作者信息

先配置正确的 Git 用户信息：

```bash
git config user.name "Your Name"
git config user.email "your.email@company.com"
```

然后重置最近一次提交的作者：

```bash
git commit --amend --reset-author --no-edit
```

**参数说明：**

- `--reset-author`：使用当前 Git 配置重新设置作者信息
- `--no-edit`：不修改原来的 commit message

---

## 二、修改最近多个 commit：交互式 rebase

如果要修改的不是最近一次提交，或者需要修改最近多个提交，可以使用交互式 rebase。

例如修改最近 2 个提交：

```bash
git rebase -i HEAD~2
```

### 1. 命令参数说明

`git rebase -i HEAD~2` 可以拆成三部分理解：

- `git rebase`：重新整理一段提交历史
- `-i`：`--interactive` 的缩写，表示交互模式，可以手动决定每个 commit 如何处理
- `HEAD~2`：表示当前分支的 `HEAD` 往前数 2 个提交的位置

`HEAD` 表示当前分支最新的提交。

`HEAD~2` 表示“从当前提交往前退 2 个提交”。因此：

```bash
git rebase -i HEAD~2
```

表示对 `HEAD~2` 之后的 2 个提交进行交互式修改，也就是最近 2 个提交。

注意：如果只修改最近 1 个提交，通常直接使用 `git commit --amend` 更简单。

### 2. 执行后会打开什么内容

执行 `git rebase -i HEAD~2` 后，Git 会打开默认编辑器，显示一份 rebase todo 列表：

```text
pick abc1234 commit message 1
pick def5678 commit message 2
```

每一行代表一个待处理的 commit，格式通常是：

```text
操作 commit哈希 commit信息
```

列表中的提交顺序通常是从旧到新排列。也就是说，第一行是这段范围里最早的提交，最后一行是最新的提交。

### 3. 常用操作指令

- `pick`：保留该提交
- `reword`：只修改 commit message
- `edit`：停在该提交，可以修改内容、作者、message 等信息
- `squash`：把该提交合并到上一个提交，并保留 message 编辑机会
- `fixup`：把该提交合并到上一个提交，丢弃当前提交的 message
- `drop`：删除该提交

修改 todo 列表并保存退出后，Git 会按照列表中的指令逐个处理 commit。

### 4. 常见操作：修改多个 commit message

把需要修改 message 的提交前面的 `pick` 改成 `reword`：

```text
reword abc1234 commit message 1
reword def5678 commit message 2
```

保存退出后，Git 会依次打开编辑器，让你修改每个提交的 message。

### 5. 常见操作：修改多个 commit 的内容

把需要修改的提交前面的 `pick` 改成 `edit`：

```text
edit abc1234 commit message 1
edit def5678 commit message 2
```

Git 会停在第一个 `edit` 提交。此时可以修改文件，然后执行：

```bash
git add .
git commit --amend --no-edit
git rebase --continue
```

如果后面还有 `edit` 提交，Git 会继续停下，重复修改、amend、continue 即可。

### 6. 常见操作：修改多个 commit 的作者信息

先配置正确身份：

```bash
git config user.name "Your Name"
git config user.email "your.email@company.com"
```

然后开启交互式 rebase：

```bash
git rebase -i HEAD~2
```

把需要修改作者的提交前面的 `pick` 改成 `edit`。

每停在一个提交上，执行：

```bash
git commit --amend --reset-author --no-edit
git rebase --continue
```

直到 rebase 完成。

### 7. 常见操作：合并多个 commit

例如要把最近 3 个提交合并为 1 个：

```bash
git rebase -i HEAD~3
```

保留第一个提交为 `pick`，后面的提交改成 `squash` 或 `fixup`：

```text
pick abc1234 commit message 1
squash def5678 commit message 2
fixup 1112223 commit message 3
```

区别：

- `squash`：合并提交，并保留 message 编辑机会
- `fixup`：合并提交，但丢弃当前提交的 message

---

## 三、推送到远程仓库

如果修改的 commit 还没有推送到远程仓库，正常推送即可：

```bash
git push
```

如果这些 commit 已经推送过，由于历史被重写，需要强制推送：

```bash
git push --force-with-lease
```

推荐使用 `--force-with-lease`，而不是直接使用 `--force`。

**区别：**

- `--force`：直接覆盖远程分支，可能覆盖别人已经推送的提交
- `--force-with-lease`：只有在远程分支没有被别人更新时才会覆盖，相对更安全

---

## 四、查看和验证提交信息

查看最近几次提交：

```bash
git log --oneline -n 5
```

查看完整作者、提交者和时间信息：

```bash
git log --format=fuller -n 5
```

重点关注：

- `Author`：代码作者
- `Commit`：执行提交的人
- `AuthorDate`：作者时间
- `CommitDate`：提交时间

查看当前 Git 配置来源：

```bash
git config --list --show-origin
```

---

## 五、注意事项

### 1. 修改 commit 会改变 SHA

只要执行 `commit --amend` 或 `rebase` 修改了历史提交，就会生成新的 commit SHA。

### 2. 已推送的公共分支要谨慎操作

如果分支已经被其他人拉取或基于它继续开发，强制推送可能影响协作者。操作前最好先确认：

```bash
git fetch
git status
```

如果是多人协作分支，需要提前通知相关成员。

### 3. 修改前保持工作区干净

建议先确认没有未提交的修改：

```bash
git status
```

如果工作区不干净，可以先提交、暂存或 stash：

```bash
git stash
```

### 4. rebase 过程中出错可以中止

如果 rebase 过程中发现操作不对，可以中止并回到 rebase 前的状态：

```bash
git rebase --abort
```


