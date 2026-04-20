# Git 代理配置

## 原理：Git 的两套传输协议

Git 支持两种远程传输协议，它们完全独立，代理配置互不影响：

| 协议 | 典型远程地址 | 代理配置方式 |
|------|------------|------------|
| **SSH** | `git@github.com:user/repo.git` | `~/.ssh/config` 中配置 `ProxyCommand` |
| **HTTP / HTTPS** | `https://github.com/user/repo.git` | `git config http.proxy` |

因此，当系统已开启全局代理时，Git 不一定能自动走代理——取决于远程地址用的是哪种协议，以及该协议的代理是否已配置。

---

## 一、SSH 协议代理

SSH 本身没有内置代理支持，需要借助 `nc`（netcat）或 `connect` 等工具作为跳板，在 `~/.ssh/config` 中通过 `ProxyCommand` 指令指定。

### SOCKS5 代理（Clash 等工具的默认类型）

```
# ~/.ssh/config

Host github.com
    HostName github.com
    User git
    ProxyCommand nc -x 127.0.0.1:7891 %h %p
```

**参数说明：**
- `nc -x`：使用 SOCKS5 代理（`-x` 指定代理地址）
- `127.0.0.1:7891`：本地代理监听地址，按实际端口修改
- `%h %p`：SSH 自动展开为目标主机名和端口，固定写法

### HTTP 代理

```
Host github.com
    HostName github.com
    User git
    ProxyCommand nc --proxy-type http --proxy 127.0.0.1:7890 %h %p
```

### 验证 SSH 代理是否生效

```bash
# 测试 SSH 连接，-T 不分配终端，-v 显示详细连接过程
ssh -T git@github.com
```

成功时输出：`Hi username! You've successfully authenticated...`

---

## 二、HTTP / HTTPS 协议代理

通过 `git config` 配置，Git 发起 HTTP 请求时会自动走该代理。

### 全局配置（推荐）

```bash
# 设置 SOCKS5 代理
git config --global http.proxy socks5://127.0.0.1:7891
git config --global https.proxy socks5://127.0.0.1:7891

# 或者设置 HTTP 代理
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

### 查看当前配置

```bash
git config --global --get http.proxy
git config --global --get https.proxy
```

### 取消代理

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 只对特定域名生效

```bash
# 只对 github.com 生效，不影响公司内网等其他仓库
git config --global http.https://github.com.proxy socks5://127.0.0.1:7891
```

---

## 三、Git LFS 的代理

Git LFS（Large File Storage）是一个需要特别注意的场景。

**关键点：即使远程仓库使用 SSH 协议，LFS 的数据传输走的是 HTTPS，而不是 SSH。**

原因：Git LFS 的工作机制是先通过 Git（SSH 或 HTTPS）获取 LFS 指针文件，然后再单独向 LFS 存储服务器发起 HTTPS 请求来上传或下载实际的大文件内容。这两个阶段是独立的。

```
git push（SSH）   →  推送提交和 LFS 指针    →  走 SSH 代理
LFS upload（HTTPS）→  上传真实的大文件内容  →  走 HTTP 代理（与 SSH 无关）
```

因此，**如果使用了 Git LFS，必须同时配置 HTTP/HTTPS 代理**，仅配置 SSH 代理不够：

```bash
git config --global http.proxy socks5://127.0.0.1:7891
git config --global https.proxy socks5://127.0.0.1:7891
```

---

## 四、常见场景速查

### 场景 1：使用 SSH 远程地址 + 无 LFS

只需配置 `~/.ssh/config`，添加 `ProxyCommand`。

### 场景 2：使用 HTTPS 远程地址

只需配置 `git config http.proxy` / `https.proxy`。

### 场景 3：使用 SSH 远程地址 + 有 LFS

两者都需要配置：

```bash
# 1. SSH 代理：~/.ssh/config
Host github.com
    HostName github.com
    User git
    ProxyCommand nc -x 127.0.0.1:7891 %h %p

# 2. HTTP 代理（LFS 使用）
git config --global http.proxy socks5://127.0.0.1:7891
git config --global https.proxy socks5://127.0.0.1:7891
```

### 场景 4：临时使用代理（不修改全局配置）

```bash
# 使用环境变量，只对当前命令有效
https_proxy=socks5://127.0.0.1:7891 git push
```
