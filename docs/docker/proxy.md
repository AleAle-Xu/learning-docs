# Docker 代理配置

在国内环境下，`docker pull` 拉取镜像或容器内访问外网经常受阻。Docker 有两个独立的代理配置位置，分别解决不同场景的问题。

## 两个代理配置的区别

| 配置位置 | 作用 | 影响范围 |
|---|---|---|
| Docker Daemon 代理 | `docker pull` 拉取镜像 | 宿主机 Docker 服务 |
| 容器内代理 | 容器内程序访问外网 | 所有新建容器 |

## 1. Docker Daemon 代理（用于 `docker pull`）

这个代理配置在宿主机的 systemd 服务中，让 Docker 守护进程通过代理拉取镜像。

### 配置步骤

创建 systemd 配置目录和文件：

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo nano /etc/systemd/system/docker.service.d/http-proxy.conf
```

写入以下内容（替换为你的代理地址）：

```ini
[Service]
Environment="HTTP_PROXY=http://127.0.0.1:7890"
Environment="HTTPS_PROXY=http://127.0.0.1:7890"
Environment="NO_PROXY=localhost,127.0.0.1"
```

重载配置并重启 Docker：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

验证配置生效：

```bash
sudo systemctl show --property=Environment docker
```

## 2. 容器内代理（用于容器内程序访问外网）

这个代理配置在 Docker 客户端的 `~/.docker/config.json`，Docker 会自动将代理环境变量注入到新建的容器中。

### 配置步骤

编辑（或创建）`~/.docker/config.json`：

```bash
nano ~/.docker/config.json
```

写入以下内容：

```json
{
  "proxies": {
    "default": {
      "httpProxy": "http://127.0.0.1:7890",
      "httpsProxy": "http://127.0.0.1:7890",
      "noProxy": "localhost,127.0.0.1"
    }
  }
}
```

配置后，新建的容器会自动获得 `HTTP_PROXY`、`HTTPS_PROXY` 等环境变量，容器内的 `curl`、`apt`、`pip` 等工具无需额外配置即可走代理。

### 验证

```bash
docker run --rm alpine env | grep -i proxy
```

## 注意事项

- 两个配置相互独立，通常需要同时配置
- 代理地址 `127.0.0.1` 在容器内无法访问宿主机，需改为宿主机的局域网 IP（如 `192.168.1.x`）或使用 `host.docker.internal`（Docker Desktop 支持）
- 修改 Daemon 代理后必须重启 Docker 服务才能生效
