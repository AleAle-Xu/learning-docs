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
    ],
    sidebar: [
      {
        text: 'Linux',
        items: [
          { text: '基础指令手册', link: '/linux/basics' },
        ],
      },
      {
        text: 'Docker',
        items: [
          { text: '代理配置', link: '/docker/proxy' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/aleale-xu/learning-docs' },
    ],
  },
})
