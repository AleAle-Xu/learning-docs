# Shell 特殊内置变量

Shell 内置了一批以 `$` 开头的特殊变量，用来获取脚本运行时的各类上下文信息，如脚本路径、传入参数、上一条命令的状态等。这些变量**不需要声明**，随时可以直接使用。

---

## 脚本自身信息

### `$0` — 脚本名称 / 当前 Shell 名称

`$0` 的值取决于脚本的调用方式：

```bash
#!/bin/bash
echo "$0"
```

| 调用方式 | `$0` 的值 |
|----------|-----------|
| `bash script.sh` | `script.sh` |
| `./script.sh` | `./script.sh` |
| `/abs/path/script.sh` | `/abs/path/script.sh` |
| 在交互终端直接输入 | `-bash` 或 `bash` |

**实际用法：** 取脚本所在目录或文件名：

```bash
#!/bin/bash
# 获取脚本所在的绝对目录（常用于让脚本定位同目录的配置文件）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

echo "脚本目录: $SCRIPT_DIR"
echo "脚本名称: $SCRIPT_NAME"
```

---

## 位置参数

调用脚本时传入的参数，按顺序存放在 `$1`、`$2`、`$3`……

```bash
./deploy.sh production v2.1.0 --verbose
#            $1          $2     $3
```

### `$1` ~ `$9` / `${10}`、`${11}`… — 第 N 个参数

```bash
#!/bin/bash
ENV="$1"       # 第 1 个参数
VERSION="$2"   # 第 2 个参数

echo "部署环境: $ENV"
echo "版本号:   $VERSION"
```

> **注意：** 第 10 个及以后的参数必须用花括号 `${10}`，直接写 `$10` 会被解析为 `$1` 后面拼上字符 `0`。

---

### `$#` — 参数个数

`$#` 是传入参数的**数量**，不包含脚本名本身（`$0`）。

```bash
#!/bin/bash
if [[ $# -lt 2 ]]; then
    echo "用法: $0 <环境> <版本号>"
    echo "示例: $0 production v2.1.0"
    exit 1
fi

echo "共传入 $# 个参数"
```

---

### `$@` 和 `$*` — 所有参数

两者都代表"所有参数"，区别在于加引号时的行为：

| 写法 | 行为 |
|------|------|
| `$@` | 等同于 `"$1" "$2" "$3"` …每个参数独立保留，含空格也不会拆分 |
| `$*` | 等同于 `"$1 $2 $3"` …所有参数合并成一个字符串 |

**几乎总是应该用 `"$@"`**，它能正确处理含有空格的参数：

```bash
#!/bin/bash
# 把所有参数原样转发给另一个命令
run_with_all_args() {
    python train.py "$@"   # 正确：每个参数独立传递
    # python train.py "$*" # 错误：含空格的参数会被拆开
}

run_with_all_args --model "Qwen 2.5" --epochs 10
# 正确传递: python train.py --model "Qwen 2.5" --epochs 10
```

---

## 进程与退出相关

### `$?` — 上一条命令的退出码

`0` 表示成功，非 `0` 表示失败。**每次执行新命令后 `$?` 都会被覆盖**，需要立刻保存。

```bash
#!/bin/bash
# 检查命令是否成功
cp source.txt /backup/
if [[ $? -ne 0 ]]; then
    echo "备份失败，请检查目标目录是否存在"
    exit 1
fi

# 更简洁的写法：直接在 if 中执行命令
if ! cp source.txt /backup/; then
    echo "备份失败"
    exit 1
fi

# 保存退出码以便多次使用
rsync -av ./data/ remote:/data/
RSYNC_EXIT=$?
echo "rsync 退出码: $RSYNC_EXIT"
if [[ $RSYNC_EXIT -ne 0 ]]; then
    echo "同步失败"
fi
```

---

### `$$` — 当前脚本的进程 ID（PID）

`$$` 是脚本自身的 PID，常用于创建**不会冲突的临时文件**，避免多个脚本实例同时运��时相互干扰：

```bash
#!/bin/bash
# 用 PID 创建唯一的临时文件
TMP_FILE="/tmp/my_script_$$.tmp"

# 脚本退出时自动清理
trap "rm -f $TMP_FILE" EXIT

# 正常使用临时文件
some_command > "$TMP_FILE"
process "$TMP_FILE"
```

---

### `$!` — 最近一个后台进程的 PID

执行 `命令 &` 后，`$!` 保存该后台进程的 PID。这是在脚本中管理后台进程的核心方式：

```bash
#!/bin/bash
# 启动后台服务，立刻保存其 PID
python api_server.py --port 8080 &
SERVER_PID=$!   # 必须在下一条命令之前保存，否则 $! 会被覆盖

echo "API 服务已启动，PID: $SERVER_PID"

# 等待一段时间后检查进程是否还活着
sleep 5
if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "服务运行正常"
else
    echo "服务已意外退出"
    exit 1
fi

# 用完后手动终止
kill "$SERVER_PID"
```

> `kill -0 PID` 不会杀死进程，只是检查进程是否存在（如果进程不存在，返回非 0）。

---

### `$-` — 当前 Shell 的选项标志

显示当前 Shell 启用了哪些选项（如 `set -e`、`set -x` 等）：

```bash
echo $-
# 示例输出: himBHs（每个字母代表一个选项）
# h = hashall，i = interactive，m = monitor 等
```

---

## 快速参考表

| 变量 | 含义 | 典型用途 |
|------|------|----------|
| `$0` | 脚本名称 | 打印用法提示、定位脚本目录 |
| `$1` ~ `$N` | 第 N 个位置参数 | 接收命令行参数 |
| `$#` | 参数个数 | 检查参数是否足够 |
| `"$@"` | 所有参数（各自独立） | 原样转发参数给其他命令 |
| `"$*"` | 所有参数（合为一串） | 很少单独使用 |
| `$?` | 上一条命令的退出码 | 判断命令是否成功 |
| `$$` | 当前进程 PID | 创建唯一临时文件 |
| `$!` | 最近后台进程的 PID | 管理、监控后台进程 |
| `$-` | 当前 Shell 选项 | 调试时查看已启用的选项 |
