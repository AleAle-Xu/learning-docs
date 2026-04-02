# 学习笔记

个人技术学习笔记站点，基于 [VitePress](https://vitepress.dev/) 构建，涵盖 Docker、Linux、LLM 等技术领域。

## 本地开发

**安装依赖**

```bash
npm install
```

**启动开发服务器**

```bash
npm run docs:dev
```

启动后访问 [http://localhost:5173/learning-docs/](http://localhost:5173/learning-docs/)。

**停止服务器**

在终端中按 `Ctrl + C` 即可停止。

## 构建与预览

```bash
npm run docs:build    # 构建静态文件到 docs/.vitepress/dist/
npm run docs:preview  # 本地预览生产构建（默认端口 4173）
```

## 添加新内容

1. 在 `docs/` 下对应目录新建 `.md` 文件。
2. 在 `docs/.vitepress/config.ts` 的 `sidebar` 中注册该页面的链接。
