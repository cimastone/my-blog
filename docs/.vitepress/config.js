export default {
  title: "CimaStone's Blog",
  description: "基于 Docker 的个人博客",
  markdown: {
    mermaid: true
  },
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
}
