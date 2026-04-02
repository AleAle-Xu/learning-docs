# Linux 基础指令手册

Linux 常用命令速查手册，按功能分类整理，便于快速查阅。

---

## 1. 文件与目录操作

### 1.1 ls - 列出目录内容

列出指定目录下的文件和子目录信息。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-l` | 长格式显示（权限、所有者、大小、时间等） |
| `-a` | 显示所有文件，包括隐藏文件（以 `.` 开头） |
| `-h` | 人类可读格式显示文件大小（如 1K、2M） |
| `-R` | 递归列出子目录内容 |
| `-t` | 按修改时间排序（最新在前） |
| `-S` | 按文件大小排序（最大在前） |

**示例：**

```bash
# 列出当前目录所有文件（含隐藏），长格式，人类可读
ls -lah

# 按修改时间排序，显示详细信息
ls -lt
```

---

### 1.2 cd - 切换目录

改变当前工作目录。

**常用用法：**

| 命令 | 说明 |
|------|------|
| `cd /path` | 切换到绝对路径 |
| `cd dir` | 切换到相对路径 |
| `cd ..` | 返回上级目录 |
| `cd ~` 或 `cd` | 返回用户主目录 |
| `cd -` | 返回上一次所在目录 |

**示例：**

```bash
# 进入 /var/log 目录
cd /var/log

# 返回上级目录
cd ..

# 返回上次所在目录
cd -
```

---

### 1.3 pwd - 显示当前路径

打印当前工作目录的完整路径。

**示例：**

```bash
pwd
# 输出: /home/username/projects
```

---

### 1.4 mkdir - 创建目录

创建新目录。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-p` | 递归创建目录（父目录不存在时自动创建） |
| `-m` | 设置目录权限 |

**示例：**

```bash
# 递归创建多级目录
mkdir -p project/src/components

# 创建目录并设置权限为 755
mkdir -m 755 mydir
```

---

### 1.5 rm - 删除文件或目录

删除文件或目录。**⚠️ 慎用，删除后无法恢复！**

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-r` | 递归删除目录及其内容 |
| `-f` | 强制删除，不提示确认 |
| `-i` | 删除前逐一确认 |

**示例：**

```bash
# 删除文件
rm file.txt

# 递归删除目录（危险操作，请确认路径正确）
rm -rf old_project/

# 删除前确认
rm -i important.txt
```

---

### 1.6 cp - 复制文件或目录

复制文件或目录到指定位置。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-r` | 递归复制目录 |
| `-i` | 覆盖前提示确认 |
| `-p` | 保留文件属性（权限、时间戳等） |
| `-v` | 显示复制过程 |

**示例：**

```bash
# 复制文件
cp config.yaml config.yaml.bak

# 递归复制目录
cp -r src/ backup/

# 保留属性复制
cp -rp /data /backup/data
```

---

### 1.7 mv - 移动或重命名

移动文件/目录，或重命名。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-i` | 覆盖前提示确认 |
| `-f` | 强制覆盖，不提示 |
| `-v` | 显示移动过程 |

**示例：**

```bash
# 重命名文件
mv old_name.txt new_name.txt

# 移动文件到目录
mv file.txt /home/user/documents/

# 移动并重命名
mv report.pdf /backup/report_2024.pdf
```

---

### 1.8 touch - 创建空文件或更新时间戳

创建空文件，或更新已有文件的访问/修改时间。

**示例：**

```bash
# 创建空文件
touch newfile.txt

# 批量创建多个文件
touch file1.txt file2.txt file3.txt
```

---

### 1.9 find - 查找文件

在目录树中搜索文件。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-name` | 按文件名查找（支持通配符） |
| `-type` | 按类型查找（`f` 普通文件，`d` 目录） |
| `-size` | 按大小查找（`+100M` 大于100M，`-10k` 小于10KB） |
| `-mtime N` | 按修改时间：`-7` 表示7天以内，`+7` 表示7天以前 |
| `-exec` | 对找到的文件执行命令，`{}` 是当前文件路径的占位符，`\;` 表示命令结束 |

**示例：**

```bash
# 在当前目录查找所有 .log 文件
find . -name "*.log"

# 查找大于 100M 的文件
find /var -size +100M

# 查找 7 天前修改的日志并删除
# {} 会被替换为每个找到的文件路径，\; 表示 -exec 命令到此结束
find /var/log -name "*.log" -mtime +7 -exec rm {} \;

# 只查找目录（-type d）
find /home -type d -name "config"

# 找到后列出详细信息（-exec 配合 ls）
find /tmp -type f -size +10M -exec ls -lh {} \;
```

---

### 1.10 ln - 创建链接

创建硬链接或符号链接（软链接）。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-s` | 创建符号链接（软链接） |
| `-f` | 强制覆盖已存在的链接 |

**示例：**

```bash
# 创建软链接（常用）
ln -s /usr/local/bin/python3 /usr/bin/python

# 创建硬链接
ln original.txt hardlink.txt
```

---

## 2. 文件内容查看与处理

### 2.1 cat - 查看文件内容

连接并显示文件内容。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-n` | 显示行号 |
| `-b` | 非空行显示行号 |
| `-s` | 压缩连续空行为一行 |

**示例：**

```bash
# 查看文件内容
cat config.yaml

# 显示行号
cat -n script.sh

# 合并多个文件
cat file1.txt file2.txt > merged.txt
```

---

### 2.2 less / more - 分页查看

分页查看大文件内容。`less` 功能更强大，推荐使用。

**less 常用操作：**

| 按键 | 说明 |
|------|------|
| `空格` | 下一页 |
| `b` | 上一页 |
| `/keyword` | 向下搜索 |
| `?keyword` | 向上搜索 |
| `n` | 下一个匹配 |
| `N` | 上一个匹配 |
| `g` | 跳到文件开头 |
| `G` | 跳到文件末尾 |
| `q` | 退出 |

**示例：**

```bash
# 分页查看大文件
less /var/log/syslog

# 查看并显示行号
less -N largefile.txt
```

---

### 2.3 head / tail - 查看文件头部/尾部

查看文件的开头或结尾部分。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-n N` | 显示前/后 N 行 |
| `-f` | （tail）实时追踪文件更新 |
| `-c N` | 显示前/后 N 字节 |

**示例：**

```bash
# 查看文件前 20 行
head -n 20 file.txt

# 查看文件最后 50 行
tail -n 50 file.txt

# 实时追踪日志（常用于调试）
tail -f /var/log/nginx/access.log

# 同时追踪多个日志
tail -f /var/log/*.log
```

---

### 2.4 grep - 文本搜索

在文件中搜索匹配的文本行，支持正则表达式。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-i` | 忽略大小写 |
| `-r` | 递归搜索目录下所有文件 |
| `-n` | 显示匹配行的行号 |
| `-v` | 反向匹配：只输出**不**包含关键词的行 |
| `-c` | 只输出匹配的行数，不显示具体内容 |
| `-l` | 只显示包含匹配内容的文件名 |
| `-A N` | 同时显示匹配行之后的 N 行（After） |
| `-B N` | 同时显示匹配行之前的 N 行（Before） |
| `-E` | 启用扩展正则表达式（ERE），支持 `+` `?` `|` 等语法 |

**示例：**

```bash
# 在文件中搜索关键词
grep "error" /var/log/syslog

# 递归搜索目录，显示行号，忽略大小写
# -r 遍历 ./src/ 下所有文件，-n 显示行号，-i 不区分大小写
grep -rni "todo" ./src/

# 显示匹配行及其前后各 3 行（适合看上下文，比如查看报错的完整堆栈）
grep -A 3 -B 3 "Exception" app.log

# 反向匹配：排除注释行（^ 匹配行首，# 是注释符号）
grep -v "^#" config.conf

# 使用扩展正则匹配 IP 地址格式
grep -E "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" access.log

# 只列出哪些文件包含 "password"（不显示内容）
grep -rl "password" ./config/
```

---

### 2.5 wc - 统计字数

统计文件的行数、单词数、字节数。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-l` | 只统计行数 |
| `-w` | 只统计单词数 |
| `-c` | 只统计字节数 |

**示例：**

```bash
# 统计文件行数
wc -l file.txt

# 统计代码行数
find . -name "*.py" | xargs wc -l
```

---

### 2.6 sort - 排序

对文件内容按行排序，默认按字母顺序升序。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-r` | 逆序（从大到小） |
| `-n` | 按数值大小排序（不��则按字符串排，9 会排在 10 前面） |
| `-k N` | 以第 N 列作为排序依据 |
| `-u` | 去除完全重复的行（等同于排序后执行 uniq） |
| `-t` | 指定列分隔符（默认以空白分隔） |

**示例：**

```bash
# 按数值升序排序（-n 很重要，否则 10 会排在 9 前面）
sort -n numbers.txt

# 按 CSV 第 2 列的数值逆序排序
# -t',' 指定逗号为分隔符，-k2 按第2列，-n 数值，-r 逆序
sort -t',' -k2 -nr data.csv

# 排序并去除重复行
sort -u names.txt
```

---

### 2.7 uniq - 去重

去除**相邻**的重复行，因此通常先用 `sort` 排序再使用。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-c` | 在每行前显示该行重复出现的次数 |
| `-d` | 只显示重复出现的行 |
| `-u` | 只显示没有重复的行 |

**示例：**

```bash
# 统计访问日志中各 IP 的出现次数，并按次数从高到低排列，取前 10
# 流程：sort 将相同 IP 聚合到一起 → uniq -c 统计次数 → sort -rn 按次数降序 → head -10 取前10
sort access.log | uniq -c | sort -rn | head -10

# 只看重复出现的行
sort names.txt | uniq -d
```

---

### 2.8 awk - 文本处理

强大的文本处理工具，默认以空白字符分隔每行，`$1`、`$2`... 代表各列，`$0` 代表整行，`NR` 代表当前行号。

**常用语法：**

```
awk '条件 {动作}' 文件
```

不写条件则对每行都执行动作；`BEGIN {}` 在处理任何行之前执行，`END {}` 在全部行处理完之后执行。

**示例：**

```bash
# 打印第 1 列和第 3 列（$1 $3 以空格分隔）
awk '{print $1, $3}' file.txt

# 用 -F 指定分隔符为冒号，打印 /etc/passwd 每行的第 1 列（用户名）
awk -F':' '{print $1}' /etc/passwd

# 累加第 2 列，END 块在读完所有行后执行一次，打印总和
awk '{sum += $2} END {print "总和:", sum}' data.txt

# 条件过滤：只打印第 3 列大于 100 的行（$0 表示整行）
awk '$3 > 100 {print $0}' data.txt

# 打印行号和内容（NR 是内置变量，表示当前行号）
awk '{print NR, $0}' file.txt

# 处理 CSV：以逗号分隔，打印第1列和第3列
awk -F',' '{print $1, $3}' scores.csv
```

---

### 2.9 sed - 流编辑器

逐行读取文件，对文本进行替换、删除、插入等操作，默认只打印结果，不修改原文件。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-i` | 直���修改源文件（原地编辑），不加则只打印结果到终端 |
| `-n` | 静默模式，默认不输出任何内容，需配合 `p` 命令主动打印 |
| `-e` | 在同一条命令里执行多个编辑操作 |

**核心语法：**

```
s/要替换的内容/替换成什么/标志
```

- `s` 是 substitute（替换）
- `/` 是分隔符（也可换成 `|` 或 `,` 避免路径中的斜杠转义）
- 标志：`g` 替换所有匹配（默认只替换每行第一个），`I` 忽略大小写

**示例：**

```bash
# 替换每行第一个 old → new，结果打印到终端，不改动文件
sed 's/old/new/' file.txt

# 加 g 标志：替换每行所有匹配
sed 's/old/new/g' file.txt

# -i：直接修改文件本身（无备份）
sed -i 's/foo/bar/g' config.conf

# macOS 上 -i 需要加备份后缀（留空字符串表示不备份）
sed -i '' 's/foo/bar/g' config.conf

# 删除空行（^$ 匹配空行，d 是 delete 命令）
sed '/^$/d' file.txt

# 删除第 5 到 10 行
sed '5,10d' file.txt

# 删除包含 "debug" 的行
sed '/debug/d' app.log

# 只打印第 3 行（-n 静默，p 打印当前行）
sed -n '3p' file.txt

# 打印第 5 到 10 行
sed -n '5,10p' file.txt

# 在第 3 行后面插入新内容（a 是 append 追加）
sed '3a\新的一行内容' file.txt

# 一次执行多个操作（先删空行，再替换 foo → bar）
sed -e '/^$/d' -e 's/foo/bar/g' file.txt

# 路径中含有斜杠时，换用 | 作分隔符，避免转义
sed 's|/old/path|/new/path|g' file.txt
```

---

## 3. 用户与权限管理

### 3.1 whoami / id - 查看当前用户

显示当前登录用户信息。

**示例：**

```bash
# 显示当前用户名
whoami

# 显示用户 ID、组 ID 等详细信息
id

# 查看指定用户信息
id username
```

---

### 3.2 useradd / userdel - 用户管理

创建或删除用户。

**useradd 常用参数：**

| 参数 | 说明 |
|------|------|
| `-m` | 创建用户主目录 |
| `-s` | 指定登录 shell |
| `-g` | 指定主组 |
| `-G` | 指定附加组 |

**示例：**

```bash
# 创建用户并创建主目录
sudo useradd -m newuser

# 创建用户，指定 shell 和组
sudo useradd -m -s /bin/bash -G docker,sudo devuser

# 删除用户及其主目录
sudo userdel -r olduser
```

---

### 3.3 passwd - 修改密码

修改用户密码。

**示例：**

```bash
# 修改当前用户密码
passwd

# 修改指定用户密码（需 root 权限）
sudo passwd username
```

---

### 3.4 chmod - 修改文件权限

修改文件或目录的访问权限。

**权限说明：**

| 数字 | 权限 | 说明 |
|------|------|------|
| 4 | r | 读 |
| 2 | w | 写 |
| 1 | x | 执行 |

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-R` | 递归修改目录及其内容 |

**示例：**

```bash
# 设置权限为 rwxr-xr-x (755)
chmod 755 script.sh

# 设置权限为 rw-r--r-- (644)
chmod 644 config.yaml

# 递归修改目录权限
chmod -R 755 /var/www/html

# 符号方式：给所有用户添加执行权限
chmod +x script.sh

# 符号方式：移除其他用户的写权限
chmod o-w file.txt
```

---

### 3.5 chown - 修改所有者

修改文件或目录的所有者和所属组。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-R` | 递归修改 |

**示例：**

```bash
# 修改所有者
sudo chown newowner file.txt

# 修改所有者和组
sudo chown user:group file.txt

# 递归修改目录
sudo chown -R www-data:www-data /var/www/
```

---

### 3.6 sudo - 以管理员身份执行

以超级用户（root）权限执行命令。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-i` | 切换到 root shell |
| `-u user` | 以指定用户身份执行 |
| `-s` | 启动一个 shell |

**示例：**

```bash
# 以 root 权限执行命令
sudo apt update

# 切换到 root shell
sudo -i

# 以其他用户身份执行
sudo -u postgres psql
```

---

### 3.7 su - 切换用户

切换到其他用户。

**示例：**

```bash
# 切换到 root 用户
su -

# 切换到指定用户
su - username
```

---

## 4. 进程与服务管理

### 4.1 ps - 查看进程

显示当前运行的进程信息。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `aux` | 显示所有用户的所有进程 |
| `-ef` | 显示完整格式的进程列表 |
| `-p PID` | 显示指定 PID 的进程 |

**示例：**

```bash
# 查看所有进程
ps aux

# 查找特定进程
ps aux | grep nginx

# 显示进程树
ps auxf
```

---

### 4.2 top / htop - 实时监控进程

实时显示系统资源使用情况和进程信息。`htop` 界面更友好（需安装）。

**top 常用操作：**

| 按键 | 说明 |
|------|------|
| `q` | 退出 |
| `k` | 杀死进程 |
| `M` | 按内存排序 |
| `P` | 按 CPU 排序 |
| `1` | 显示各 CPU 核心 |

**示例：**

```bash
# 启动 top
top

# 只显示指定用户的进程
top -u username
```

---

### 4.3 kill / killall - 终止进程

发送信号终止进程。

**常用信号：**

| 信号 | 说明 |
|------|------|
| `-15` (SIGTERM) | 优雅终止（默认） |
| `-9` (SIGKILL) | 强制终止 |
| `-1` (SIGHUP) | 重新加载配置 |

**示例：**

```bash
# 优雅终止进程
kill 1234

# 强制终止进程
kill -9 1234

# 按名称终止所有匹配进程
killall nginx

# 按名称强制终止
pkill -9 -f "python app.py"
```

---

### 4.4 systemctl - 服务管理

管理 systemd 服务（启动、停止、重启、状态查看等）。

**常用命令：**

| 命令 | 说明 |
|------|------|
| `start` | 启动服务 |
| `stop` | 停止服务 |
| `restart` | 重启服务 |
| `reload` | 重新加载配置 |
| `status` | 查看服务状态 |
| `enable` | 设置开机自启 |
| `disable` | 取消开机自启 |
| `is-active` | 检查是否运行 |
| `list-units` | 列出所有服务 |

**示例：**

```bash
# 启动 nginx
sudo systemctl start nginx

# 查看状态
sudo systemctl status nginx

# 重启服务
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx

# 查看所有运行中的服务
systemctl list-units --type=service --state=running
```

---

### 4.5 journalctl - 查看系统日志

查看 systemd 管理的服务日志。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-u service` | 查看指定服务日志 |
| `-f` | 实时追踪日志 |
| `-n N` | 显示最近 N 行 |
| `--since` | 指定起始时间 |
| `-p` | 按优先级过滤 |

**示例：**

```bash
# 查看 nginx 日志
journalctl -u nginx

# 实时追踪日志
journalctl -u nginx -f

# 查看最近 100 行
journalctl -u nginx -n 100

# 查看今天的日志
journalctl -u nginx --since today

# 查看错误级别日志
journalctl -p err
```

---

### 4.6 nohup / & - 后台运行

让程序在后台运行，不受终端关闭影响。

**示例：**

```bash
# 后台运行并忽略挂断信号
nohup python app.py &

# 输出重定向到文件
nohup ./script.sh > output.log 2>&1 &

# 查看后台任务
jobs

# 将后台任务调到前台
fg %1
```

---

## 5. 网络相关

### 5.1 ping - 测试网络连通性

测试与目标主机的网络连接。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-c N` | 发送 N 个包后停止 |
| `-i N` | 每 N 秒发送一个包 |
| `-W N` | 超时时间（秒） |

**示例：**

```bash
# 测试连通性
ping google.com

# 发送 5 个包
ping -c 5 192.168.1.1
```

---

### 5.2 curl - HTTP 请求工具

发送 HTTP 请求，常用于测试 API。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-X` | 指定请求方法 |
| `-H` | 添加请求头 |
| `-d` | 发送数据 |
| `-o` | 输出到文件 |
| `-O` | 保存为远程文件名 |
| `-L` | 跟随重定向 |
| `-s` | 静默模式 |
| `-I` | 只显示响应头 |

**示例：**

```bash
# GET 请求
curl https://api.example.com/users

# POST 请求，发送 JSON
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"test"}' https://api.example.com/users

# 下载文件
curl -O https://example.com/file.zip

# 只查看响应头
curl -I https://example.com
```

---

### 5.3 wget - 下载文件

从网络下载文件。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-O` | 指定保存文件名 |
| `-c` | 断点续传 |
| `-q` | 静默模式 |
| `-r` | 递归下载 |
| `-P` | 指定保存目录 |

**示例：**

```bash
# 下载文件
wget https://example.com/file.tar.gz

# 指定文件名
wget -O myfile.tar.gz https://example.com/file.tar.gz

# 断点续传
wget -c https://example.com/large-file.iso
```

---

### 5.4 netstat / ss - 查看网络连接

查看网络连接、端口监听状态。`ss` 是 `netstat` 的现代替代。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-t` | 显示 TCP 连接 |
| `-u` | 显示 UDP 连接 |
| `-l` | 只显示监听状态 |
| `-n` | 显示数字地址（不解析域名） |
| `-p` | 显示进程信息 |

**示例：**

```bash
# 查看所有监听端口
ss -tlnp

# 查看所有 TCP 连接
ss -tn

# 查看指定端口
ss -tlnp | grep :80

# 使用 netstat（旧版）
netstat -tlnp
```

---

### 5.5 ip / ifconfig - 网络接口配置

查看和配置网络接口。`ip` 是现代命令，推荐使用。

**示例：**

```bash
# 查看所有网络接口
ip addr

# 查看路由表
ip route

# 查看指定接口
ip addr show eth0

# 旧版命令
ifconfig
```

---

### 5.6 scp - 远程复制

通过 SSH 在本地和远程主机间复制文件。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-r` | 递归复制目录 |
| `-P` | 指定端口 |
| `-i` | 指定私钥文件 |

**示例：**

```bash
# 上传文件到远程
scp file.txt user@host:/path/to/dest/

# 从远程下载文件
scp user@host:/path/to/file.txt ./

# 递归复制目录
scp -r ./project user@host:/home/user/

# 指定端口
scp -P 2222 file.txt user@host:/path/
```

---

### 5.7 ssh - 远程登录

通过 SSH 协议安全登录远程主机。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-p` | 指定端口 |
| `-i` | 指定私钥文件 |
| `-L` | 本地端口转发 |
| `-R` | 远程端口转发 |
| `-D` | 动态端口转发（SOCKS 代理） |
| `-N` | 不执行远程命令（用于端口转发） |
| `-f` | 后台运行 |

**示例：**

```bash
# 登录远程主机
ssh user@hostname

# 指定端口
ssh -p 2222 user@hostname

# 使用私钥登录
ssh -i ~/.ssh/mykey.pem user@hostname

# 本地端口转发（访问本地 8080 转发到远程 80）
ssh -NL 8080:localhost:80 user@hostname
```

> 端口转发功能（`-L` / `-R` / `-D`）详见：[SSH 端口转发详解](/linux/network/ssh-port-forwarding)

---

## 6. 压缩与解压

### 6.1 tar - 打包与解包

打包和解包文件（常与 gzip/bzip2 结合使用）。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-c` | 创建归档 |
| `-x` | 解包 |
| `-v` | 显示过程 |
| `-f` | 指定文件名 |
| `-z` | 使用 gzip 压缩/解压 |
| `-j` | 使用 bzip2 压缩/解压 |
| `-C` | 指定解压目录 |

**示例：**

```bash
# 打包并压缩（.tar.gz）
tar -czvf archive.tar.gz ./folder/

# 解压 .tar.gz
tar -xzvf archive.tar.gz

# 解压到指定目录
tar -xzvf archive.tar.gz -C /path/to/dest/

# 查看归档内容（不解压）
tar -tzvf archive.tar.gz
```

---

### 6.2 zip / unzip - ZIP 格式压缩

处理 ZIP 格式压缩文件。

**示例：**

```bash
# 压缩文件
zip archive.zip file1.txt file2.txt

# 压缩目录
zip -r archive.zip ./folder/

# 解压
unzip archive.zip

# 解压到指定目录
unzip archive.zip -d /path/to/dest/

# 查看内容（不解压）
unzip -l archive.zip
```

---

### 6.3 gzip / gunzip - GZIP 压缩

压缩和解压单个文件。

**示例：**

```bash
# 压缩文件（原文件被替换为 .gz）
gzip file.txt

# 解压
gunzip file.txt.gz

# 保留原文件
gzip -k file.txt
```

---

## 7. 磁盘与系统信息

### 7.1 df - 查看磁盘空间

显示文件系统磁盘空间使用情况。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-h` | 人类可读格式 |
| `-T` | 显示文件系统类型 |

**示例：**

```bash
# 查看磁盘使用情况
df -h

# 显示文件系统类型
df -Th
```

---

### 7.2 du - 查看目录大小

显示目录或文件的磁盘使用量。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-h` | 人类可读格式 |
| `-s` | 只显示总计 |
| `-d N` | 显示 N 层深度 |
| `--max-depth=N` | 同 `-d N` |

**示例：**

```bash
# 查看当前目录大小
du -sh

# 查看子目录大小（1 层）
du -h --max-depth=1

# 查看并排序
du -h --max-depth=1 | sort -hr
```

---

### 7.3 free - 查看内存使用

显示系统内存使用情况。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-h` | 人类可读格式 |
| `-m` | 以 MB 显示 |
| `-g` | 以 GB 显示 |

**示例：**

```bash
# 查看内存使用
free -h
```

---

### 7.4 uname - 系统信息

显示系统信息。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-a` | 显示所有信息 |
| `-r` | 显示内核版本 |
| `-m` | 显示硬件架构 |

**示例：**

```bash
# 显示所有系统信息
uname -a

# 查看内核版本
uname -r
```

---

### 7.5 uptime - 系统运行时间

显示系统运行时间和负载。

**示例：**

```bash
uptime
# 输出: 10:30:45 up 5 days, 3:22, 2 users, load average: 0.15, 0.10, 0.05
```

---

### 7.6 date - 日期时间

显示或设置系统日期时间。

**示例：**

```bash
# 显示当前时间
date

# 格式化输出
date "+%Y-%m-%d %H:%M:%S"

# 显示时间戳
date +%s
```

---

### 7.7 history - 命令历史

显示命令历史记录。

**示例：**

```bash
# 显示历史命令
history

# 显示最近 20 条
history 20

# 执行历史命令（第 100 条）
!100

# 执行上一条命令
!!

# 搜索历史（Ctrl+R）
```

---

## 8. 其他常用命令

### 8.1 echo - 输出文本

输出文本或变量值。

**示例：**

```bash
# 输出文本
echo "Hello World"

# 输出变量
echo $HOME

# 输出到文件
echo "content" > file.txt

# 追加到文件
echo "more content" >> file.txt
```

---

### 8.2 export - 设置环境变量

设置或导出环境变量。

**示例：**

```bash
# 设置环境变量
export PATH=$PATH:/usr/local/bin

# 设置并导出
export MY_VAR="value"

# 查看所有环境变量
env
```

---

### 8.3 alias - 命令别名

创建命令别名。

**示例：**

```bash
# 创建别名
alias ll='ls -la'
alias gs='git status'

# 查看所有别名
alias

# 删除别名
unalias ll
```

---

### 8.4 xargs - 参数传递

将标准输入的内容转换为后续命令的参数。许多命令不能直接接收管道输入（如 `rm`、`cp`），`xargs` 就是把管道输出转成参数的桥梁。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-I {}` | 用 `{}` 作为占位符，把每个输入项替换到命令中 |
| `-P N` | 并行执行，最多同时运行 N 个进程 |
| `-0` | 以 `\0`（null 字节）作为分隔符，配合 `find -print0` 处理含空格的文件名 |
| `-n N` | 每次传递 N 个参数给命令 |

**示例：**

```bash
# 删除所有 .log 文件
# find 输出一批文件名，xargs 把它们作为参数传给 rm
find . -name "*.log" | xargs rm

# -I {} 指定占位符：每个文件名替换 {} 的位置，然后执行 gzip
# -P 4 表示最多同时运行 4 个 gzip 进程
find . -name "*.txt" | xargs -P 4 -I {} gzip {}

# 文件名含空格时，直接用默认分隔方式会出错
# find -print0 用 null 字节分隔，xargs -0 按 null 字节解析
find . -name "*.txt" -print0 | xargs -0 rm

# 每次只传 1 个参数，便于调试或兼容某些命令
find . -name "*.conf" | xargs -n 1 cat
```

---

### 8.5 tee - 同时输出到屏幕和文件

将输出同时写入文件和标准输出。

**示例：**

```bash
# 输出到屏幕并保存到文件
echo "hello" | tee output.txt

# 追加模式
echo "world" | tee -a output.txt

# 同时写入多个文件
echo "data" | tee file1.txt file2.txt
```

---

### 8.6 watch - 定时执行命令

定时重复执行命令并显示结果。

**常用参数：**

| 参数 | 说明 |
|------|------|
| `-n N` | 每 N 秒执行一次 |
| `-d` | 高亮显示变化 |

**示例：**

```bash
# 每 2 秒查看磁盘使用
watch -n 2 df -h

# 监控进程
watch -n 1 'ps aux | grep nginx'
```
