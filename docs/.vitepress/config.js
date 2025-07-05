import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: "CimaStone's Blog",
    description: "基于 Docker 的个人博客",
    themeConfig: {
      nav: [
        { text: '首页', link: '/guide/' },
        { text: 'Redisson分布式锁+本地缓存', link: '/guide/redisson-distributed-lock' }
      ],
      sidebar: [
          { text: '首页', link: '/guide/' },
          { text: 'Redisson分布式锁+本地缓存', link: '/guide/redisson-distributed-lock' }
        ]
    }
  })
)
