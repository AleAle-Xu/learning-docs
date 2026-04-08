# 脚本退出与进程清理（trap）

## 问题场景

写脚本时经常遇到这种情况：脚本在后台启动了一个服务进程，然后继续做其他事情。如果脚本中途崩溃、被 `Ctrl+C` 终止，或者正常结束，那个后台进程就会**变成孤儿进程**，继续占用端口和 GPU 显存，下次运行时冲突报错。

```bash
# 典型场景：先启动推理服务，再运行训练/评估
python vllm_server.py --port 8000 &   # 后台启动
# ... 脚本出错或被终止 ...
# vllm_server.py 还在跑，没人管它
```

`trap` 命令就是解决这个问题的：它让你在脚本退出时**注册一个清理函数**，无论何种原因退出都会自动执行。

---

## `trap` 基础语法

```bash
trap '要执行的命令或函数' 信号名
```

常用信号：

| 信号 | 触发时机 |
|------|----------|
| `EXIT` | 脚本以任何方式退出时（最常用，涵盖正常退出和错误退出） |
| `INT` | 用户按下 `Ctrl+C` |
| `TERM` | 收到 `kill` 命令发出的终止信号 |
| `ERR` | 任意命令返回非零退出码时（需配合 `set -e` 使用） |

**推荐用 `EXIT`**，它是最保险的选择——不管脚本怎么结束（正常 `exit`、错误退出、`Ctrl+C`），都会触发。

---

## 完整模板

```bash
#!/bin/bash
set -euo pipefail

# ── 用于存放后台进程 PID 的变量（先置空，避免 cleanup 中引用未定义变量）
SERVER_PID=""
WORKER_PID=""

# ── 清理函数 ─────────────────────────────────────────────────────────────────
cleanup() {
    echo ""
    echo "脚本即将退出，正在清理后台进程..."

    # 用 -n 检查变量是否非空，避免 PID 为空时 kill 报错
    if [[ -n "$SERVER_PID" ]]; then
        # 2>/dev/null：如果进程已经自行退出，kill 会报错，把错误静默掉
        kill "$SERVER_PID" 2>/dev/null
        echo "  已关闭推理服务 (PID: $SERVER_PID)"
    fi

    if [[ -n "$WORKER_PID" ]]; then
        kill "$WORKER_PID" 2>/dev/null
        echo "  已关闭 Worker 进程 (PID: $WORKER_PID)"
    fi

    echo "清理完成。"
}

# ── 注册 trap：脚本退出时自动调用 cleanup ────────────────────────────────────
# 必须在启动任何后台进程之前注册，否则如果启动过程中出错，trap 不会生效
trap cleanup EXIT

# ── 主体逻辑 ──────────────────────────────────────────────────────────────────

echo "正在启动推理服务..."
python inference_server.py --port 8000 --model /data/models/Qwen2.5-7B &
SERVER_PID=$!   # 立刻保存 PID，$! 是最近一个后台进程的 PID
echo "推理服务已启动 (PID: $SERVER_PID)"

echo "正在启动 Worker..."
python worker.py --server-url http://localhost:8000 &
WORKER_PID=$!
echo "Worker 已启动 (PID: $WORKER_PID)"

# 等待服务就绪（生产脚本里可以换成 curl 轮询检查）
echo "等待服务初始化..."
sleep 10

# 主任务
echo "开始运行主任务..."
python run_evaluation.py --server http://localhost:8000

echo "主任务完成，脚本正常退出。"
# 脚本执行到这里结束，触发 EXIT 信号，cleanup 自动被调用
```

---

## 逐步拆解

### 为什么要先把 PID 变量置空

```bash
SERVER_PID=""
WORKER_PID=""
```

如果脚本在启动后台进程**之前**就因为某个错误退出了，`SERVER_PID` 变量就没有被赋值。此时 `cleanup` 被调用，`[[ -n "$SERVER_PID" ]]` 为 false，`kill` 不会被执行，避免了 `kill: usage error` 这类无意义的错误。

### `$!` 和立刻保存

```bash
python inference_server.py &
SERVER_PID=$!   # 必须紧接在 & 后面
```

`$!` 只保存**最近一个**后台进程的 PID。如果在保存之前又启动了另一个后台进程，`$!` 就被覆盖了。所以每次 `&` 之后，都要立刻用一个变量保存 `$!`。

### `kill ... 2>/dev/null` 的含义

```bash
kill "$SERVER_PID" 2>/dev/null
```

- `kill PID`：向该 PID 发送 SIGTERM 信号，请求进程优雅退出
- `2>/dev/null`：把 stderr（标准错误，文件描述符 2）重定向到 `/dev/null`（丢弃），这样当进程已经自行退出时，`kill` 的报错信息不会显示出来

### `trap cleanup EXIT` 的注册时机

`trap` 的注册应该放在**启动任何后台进程之前**。如果放在后面，某步骤出错时 `trap` 还没注册，脚本就退出了，cleanup 不会运行。

---

## 等待子进程结束（`wait`）

如果主任务也是后台运行的，可以用 `wait` 阻塞脚本直到指定进程结束：

```bash
python main_task.py &
MAIN_PID=$!

# 等待主任务完成，并获取其退出码
wait "$MAIN_PID"
MAIN_EXIT=$?

if [[ $MAIN_EXIT -ne 0 ]]; then
    echo "主任务失败，退出码: $MAIN_EXIT"
    exit $MAIN_EXIT
fi
```

---

## 强制杀死进程（SIGKILL）

有些进程不响应 SIGTERM（如陷入死锁的进程），这时需要发送 SIGKILL 强制终止：

```bash
cleanup() {
    if [[ -n "$SERVER_PID" ]]; then
        echo "发送 SIGTERM..."
        kill "$SERVER_PID" 2>/dev/null

        # 等待最多 5 秒，进程还没退出就强制杀死
        local timeout=5
        while kill -0 "$SERVER_PID" 2>/dev/null && [[ $timeout -gt 0 ]]; do
            sleep 1
            ((timeout--))
        done

        # kill -0 检查进程是否还存在（不发送实际信号，只检测）
        if kill -0 "$SERVER_PID" 2>/dev/null; then
            echo "进程未响应，发送 SIGKILL..."
            kill -9 "$SERVER_PID" 2>/dev/null
        fi

        echo "已关闭服务 (PID: $SERVER_PID)"
    fi
}
```

---

## 清理临时文件

`trap` 同样适合清理脚本运行中产生的临时文件：

```bash
#!/bin/bash
# 用 $$ (当前进程 PID) 生成唯一的临时文件名，避免多实例冲突
TMP_DIR="/tmp/my_script_$$"
mkdir -p "$TMP_DIR"

cleanup() {
    echo "清理临时目录: $TMP_DIR"
    rm -rf "$TMP_DIR"
}

trap cleanup EXIT

# 正常使用临时目录
some_command > "$TMP_DIR/output.txt"
process "$TMP_DIR/output.txt"
```
