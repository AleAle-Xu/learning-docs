# 参数解析模板

## 为什么需要参数解析

脚本中如果把路径、配置值直接写死，每次改动都要编辑源码，既麻烦又容易出错。通过命令行参数，可以在调用时灵活指定配置：

```bash
# 不用参数：每次改配置都要改脚本
bash train.sh

# 使用参数：调用时按需覆盖，脚本本身不用动
bash train.sh --model /data/Qwen2.5-72B --n_gpus 4 --save_path exp_v2
```

---

## 模板结构

Shell 参数解析的推荐做法是：**先定义默认值，再用 `while` + `case` 循环覆盖**。

```bash
#!/bin/bash
set -euo pipefail

# ── 默认值 ────────────────────────────────────────────────────────────────────
# 在这里为每个参数设置合理的默认值，让脚本在不传任何参数时也能直接运行
MODEL_PATH="/data/pretrained_models/Llama-3-8B"
OUTPUT_DIR="./output/default_run"
NUM_GPUS=1
BATCH_SIZE=8
MAX_EPOCHS=10
LEARNING_RATE=1e-4

# ── 参数解析 ──────────────────────────────────────────────────────────────────
# $# 是参数总数；[[ $# -gt 0 ]] 表示"还有未处理的参数"
# 每次循环处理一个 --key value 对，处理完后 shift 2（跳过已处理的两个词）
while [[ $# -gt 0 ]]; do
    case "$1" in
        --model)       MODEL_PATH="$2";    shift 2 ;;
        --output)      OUTPUT_DIR="$2";    shift 2 ;;
        --n_gpus)      NUM_GPUS="$2";      shift 2 ;;
        --batch_size)  BATCH_SIZE="$2";    shift 2 ;;
        --epochs)      MAX_EPOCHS="$2";    shift 2 ;;
        --lr)          LEARNING_RATE="$2"; shift 2 ;;
        *)
            # 遇到未知参数时报错并退出，避免参数写错了悄悄被忽略
            echo "错误：未知参数 '$1'"
            echo "用法: $0 [--model 路径] [--output 路径] [--n_gpus N] [--batch_size N] [--epochs N] [--lr 值]"
            exit 1 ;;
    esac
done

# ── 打印最终配置（便于日志追溯）────────────────────────────────────────────
echo "========== 运行配置 =========="
echo "  模型路径:  $MODEL_PATH"
echo "  输出目录:  $OUTPUT_DIR"
echo "  GPU 数量:  $NUM_GPUS"
echo "  批大小:    $BATCH_SIZE"
echo "  训练轮数:  $MAX_EPOCHS"
echo "  学习率:    $LEARNING_RATE"
echo "=============================="

# ── 主体逻辑 ──────────────────────────────────────────────────────────────────
# 在这里写脚本的实际功能
```

---

## 逐步拆解

### `while [[ $# -gt 0 ]]`

`$#` 是当前剩余参数的数量。每执行一次 `shift N`，参数列表就向前移动 N 位，`$#` 减少 N。循环一直持续到所有参数都被处理完为止。

```
初始调用: bash train.sh --model /data/Qwen --epochs 5
$# = 4，$1 = --model，$2 = /data/Qwen，$3 = --epochs，$4 = 5

处理 --model，shift 2 →
$# = 2，$1 = --epochs，$2 = 5

处理 --epochs，shift 2 →
$# = 0，循环结束
```

### `case "$1" in ... esac`

`case` 对 `$1` 进行模式匹配，找到匹配的 `--key` 后，用 `$2` 赋值，然后 `shift 2` 跳到下一对参数。

```bash
case "$1" in
    --model)  MODEL_PATH="$2"; shift 2 ;;  # $2 是紧跟的值，shift 2 消费键+值
    --epochs) MAX_EPOCHS="$2"; shift 2 ;;  # ;; 表示分支结束，类似其他语言的 break
    ...
esac
```

### `*)` 捕获未知参数

`*` 是通配符，匹配所有未被前面分支处理的情况。遇到未知参数时，立刻打印用法并退出，避免参数拼写错误被静默忽略。

---

## 调用示例

```bash
# 使用全部默认值直接运行
bash train.sh

# 只覆盖部分参数，其余使用默认值
bash train.sh --model /data/Qwen2.5-72B --n_gpus 8

# 覆盖所有参数
bash train.sh \
    --model      /data/pretrained_models/Llama-3-70B \
    --output     /results/exp_001 \
    --n_gpus     8 \
    --batch_size 16 \
    --epochs     3 \
    --lr         2e-5

# 写错参数名会立刻报错（* 分支捕获）
bash train.sh --modl /data/Qwen   # 报错: 未知参数 '--modl'
```

---

## 加入布尔开关（Flag）

有些参数不需要值，只是一个开关（如 `--debug`、`--dry-run`）：

```bash
# 默认值
DEBUG=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --debug)    DEBUG=true;            shift 1 ;;  # 开关类参数只有 $1，shift 1 即可
        --dry-run)  DRY_RUN=true;          shift 1 ;;
        --output)   OUTPUT_DIR="$2";       shift 2 ;;
        *)          echo "未知参数: $1"; exit 1 ;;
    esac
done

# 使用开关
if [[ "$DEBUG" == "true" ]]; then
    set -x    # 开启 bash 调试模式，打印每条执行的命令
fi

if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY RUN] 不会实际执行，只打印命令"
fi
```

调用方式：

```bash
bash train.sh --debug --dry-run --output /tmp/test
```
