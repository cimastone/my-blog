import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    base: "/blog/",
    title: "CimaStone's Blog",
    description: "基于 Docker 的个人博客",
    themeConfig: {
      nav: [
        { text: '首页', link: '/guide/' },
        { text: '搭建个人博客（vitePress）', link: '/guide/vitePress_blog' },
        { text: '高并发查询场景下基于Zookeeper+Redis的分布式一致性缓存设计方案', link: '/guide/zk_redisson_distributed_lock' },
        { text: '团队研发流程管理 - scrum', link: '/guide/scrum_running' },
        { text: 'Redisson分布式锁+本地缓存', link: '/guide/redisson-distributed-lock' }
      ],
      sidebar: [
        { text: '首页', link: '/guide/' },
        { text: '搭建个人博客（vitePress）', link: '/guide/vitePress_blog' },
        { text: '高并发查询场景下基于Zookeeper+Redis的分布式一致性缓存设计方案', link: '/guide/zk_redisson_distributed_lock' },
        { text: '团队研发流程管理 - scrum', link: '/guide/scrum_running' },
        { text: 'Redisson分布式锁+本地缓存', link: '/guide/redisson-distributed-lock' }
      ]
    }
    // 这里不用再写 markdown: { mermaid: true }，由插件接管
    // 如需自定义 Mermaid 选项，可在下方添加（可选）：
    // mermaid: { theme: "dark", ... }
  })
)
