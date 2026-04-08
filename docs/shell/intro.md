# Shell 是什么

## Shell 的本质

Shell 是操作系统提供的**命令解释器**，它的职责很简单：读取你输入的文本命令，把它翻译成操作系统能理解的系统调用，然后把结果展示给你。

可以把它理解成一个"翻译官"，站在你和操作系统内核之间。你不需要懂 C 语言或系统调用，只需要用 Shell 脚本语言写出你想做的事，Shell 来帮你执行。

```
你（人）
  ↓  输入命令
Shell（解释器）
  ↓  解析并转换
操作系统内核
  ↓  执行并返回结果
Shell
  ↓  格式化输出
你（看到结果）
```

---

## 常见的 Shell 类型

Linux 下有很多种 Shell，它们语法大体相同，但在细节上有差异：

| Shell | 说明 |
|-------|------|
| `bash` | Bourne Again Shell，Linux 最常见的默认 Shell，功能丰富 |
| `sh` | 最原始的 Bourne Shell，功能少但可移植性最好，很多系统脚本用它 |
| `zsh` | 功能最强大，macOS 默认，支持插件和主题（如 Oh My Zsh） |
| `fish` | 语法更友好，但与 bash 不兼容，不适合写系统脚本 |
| `dash` | 轻量版 sh，Ubuntu 上 `/bin/sh` 实际指向它，启动更快 |

**写脚本时的建议：** 如果要在多数 Linux 服务器运行，首选 `bash`；如果需要极致兼容性（嵌入式、容器），用 `sh`。

---

## 交互模式 vs 脚本模式

Shell 有两种使用方式：

**交互模式**：打开终端，直接输入命令，立刻看到结果。适合临时操作。

**脚本模式**：把一系列命令写进 `.sh` 文件，一次性执行。适合自动化、重复性任务。

---

## 脚本的基本结构

```bash
#!/bin/bash
# ↑ 这一行叫 shebang，告诉系统用哪个解释器来运行这个脚本
# 注意：必须是文件的第一行，前面不能有任何空行

# 这是注释，# 开头的行会被忽略

# 定义变量（等号两边不能有空格）
NAME="Alice"

# 使用变量（用 $ 引用）
echo "Hello, $NAME"

# 执行命令
echo "当前目录: $(pwd)"
```

运行脚本前需要先给它加上执行权限：

```bash
chmod +x my_script.sh   # 添加执行权限
./my_script.sh          # 执行
```

也可以不加权限，直接用解释器运行：

```bash
bash my_script.sh
```

---

## 脚本中的关键行为

### set 命令：控制错误处理

默认情况下，脚本某行出错后会**继续往下执行**，这很容易导致意外的连锁错误。建议在脚本开头加上：

```bash
#!/bin/bash
set -euo pipefail
```

| 选项 | 含义 |
|------|------|
| `-e` | 任意命令返回非零退出码时，脚本立即终止 |
| `-u` | 引用未定义的变量时报错，而不是静默地当成空字符串 |
| `-o pipefail` | 管道中任意命令失败，整个管道视为失败（默认只看最后一条命令） |

### 退出码

每个命令执行完都会返回一个**退出码**（exit code）：

- `0` 表示成功
- 非 `0` 表示失败（具体含义由命令自己定义）

可以用 `$?` 查看上一条命令的退出码：

```bash
ls /nonexistent
echo "退出码: $?"   # 输出: 退出码: 2
```

主动退出脚本：

```bash
exit 0    # 正常退出
exit 1    # 带错误退出（可以自定义数字，约定非 0 为失败）
```

---

## 变量

### 定义与使用

```bash
# 定义变量（等号两边不能加空格）
MY_VAR="hello"

# 使用变量
echo $MY_VAR
echo "${MY_VAR}"   # 推荐写法，花括号让变量边界更清晰

# 变量名拼接时花括号是必须的
echo "${MY_VAR}_world"   # 输出: hello_world
echo "$MY_VAR_world"     # 错误：会把 MY_VAR_world 当成一个变量名
```

### 引号规则

```bash
NAME="Alice"

echo "$NAME"     # 双引号：变量会被展开，输出 Alice
echo '$NAME'     # 单引号：完全当成字面量，输出 $NAME
echo "${NAME}"   # 推荐，明确边界
```

### 命令替换

把命令的输出结果赋值给变量：

```bash
# 推荐写法（可嵌套）
CURRENT_DATE=$(date "+%Y-%m-%d")
echo "今天是: $CURRENT_DATE"

# 旧写法（反引号），不推荐，可读性差且不支持嵌套
CURRENT_DATE=`date "+%Y-%m-%d"`
```

---

## 条件判断

```bash
# if 基本结构
if [ 条件 ]; then
    # 条件为真时执行
elif [ 其他条件 ]; then
    # 其他情况
else
    # 都不满足时执行
fi

# 常用条件
[ -f file ]      # 文件存在且是普通文件
[ -d dir ]       # 目录存在
[ -z "$var" ]    # 变量为空字符串
[ -n "$var" ]    # 变量不为空
[ "$a" = "$b" ]  # 字符串相等
[ $n -gt 10 ]    # 数字比较：大于（-lt 小于，-eq 等于，-ne 不等于）
```

**`[` 和 `[[` 的区别：**
- `[` 是 POSIX 标准，兼容性最好
- `[[` 是 bash 扩展，支持 `&&`、`||`、`=~`（正则匹配），不需要引号保护变量，**推荐在 bash 脚本中使用 `[[`**

```bash
# [[ 的优势示例
if [[ "$NAME" == "Alice" && "$AGE" -gt 18 ]]; then
    echo "成年的 Alice"
fi

# 正则匹配（仅 [[ 支持）
if [[ "$INPUT" =~ ^[0-9]+$ ]]; then
    echo "是纯数字"
fi
```

---

## 循环

```bash
# for 循环遍历列表
for item in apple banana cherry; do
    echo "水果: $item"
done

# for 循环遍历文件
for file in /var/log/*.log; do
    echo "处理: $file"
done

# C 风格的数字循环
for ((i = 1; i <= 5; i++)); do
    echo "第 $i 次"
done

# while 循环
count=0
while [ $count -lt 5 ]; do
    echo "count = $count"
    ((count++))
done
```

---

## 函数

```bash
# 定义函数
say_hello() {
    local name="$1"    # local 限定变量只在函数内有效
    echo "Hello, $name!"
}

# 调用函数（不用括号，直接写函数名）
say_hello "Alice"

# 函数返回值：Shell 函数只能 return 数字（作为退出码）
# 要返回字符串，用 echo + 命令替换
get_date() {
    echo "$(date '+%Y-%m-%d')"
}

today=$(get_date)
echo "今天: $today"
```
