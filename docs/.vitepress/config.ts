import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '学习笔记',
  description: '个人学习笔记站点',
  base: '/learning-docs/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'Linux', link: '/linux/basics' },
      { text: 'Docker', link: '/docker/proxy' },
      { text: '实践问题', link: '/issues/llm/fastsafetensors-oom' },
    ],
    sidebar: [
      {
        text: 'Linux',
        items: [
          {
            text: '基础命令',
            collapsed: false,
            items: [
              { text: '基础指令手册', link: '/linux/basics' },
            ],
          },
          {
            text: '网络',
            collapsed: false,
            items: [
              { text: 'SSH 端口转发', link: '/linux/network/ssh-port-forwarding' },
            ],
          },
        ],
      },
      {
        text: 'Shell 脚本',
        items: [
          { text: 'Shell 是什么', link: '/shell/intro' },
          { text: '特殊内置变量', link: '/shell/special-variables' },
          { text: '参数解析模板', link: '/shell/arg-parsing' },
          { text: '退出清理（trap）', link: '/shell/trap-cleanup' },
        ],
      },
      {
        text: 'Docker',
        items: [
          { text: '代理配置', link: '/docker/proxy' },
        ],
      },
      {
        text: '实践问题',
        items: [
          {
            text: '大语言模型部署',
            collapsed: false,
            items: [
              { text: 'fastsafetensors 导致内存溢出', link: '/issues/llm/fastsafetensors-oom' },
            ],
          },
          {
            text: '数据管理',
            collapsed: false,
            items: [
              { text: '大数据集迁移到 Hugging Face', link: '/issues/data/hf-dataset-upload' },
            ],
          },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/aleale-xu/learning-docs' },
    ],
  },
})
