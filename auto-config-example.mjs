import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { generateSidebar } from 'vitepress-sidebar'

export default withMermaid(
  defineConfig({
    base: "/blog/",
    title: "CimaStone's Blog",
    description: "基于 Docker 的个人博客",
    
    themeConfig: {
      // 使用自动生成的侧边栏
      sidebar: generateSidebar([
        {
          documentRootPath: '/docs',
          scanStartPath: 'guide',
          basePath: '/guide/',
          resolvePath: '/guide/',
          useTitleFromFileHeading: true,
          hyphenToSpace: true,
          underscoreToSpace: true,
          capitalizeFirst: true,
          capitalizeEachWords: true,
          excludeFiles: ['index.md'],
          sortMenusByName: true,
          sortMenusOrderByDescending: false,
          sortMenusOrderNumericallyFromTitle: true,
          frontmatterTitleFieldName: 'title'
        }
      ]),
      
      // 导航栏可以保持简单
      nav: [
        { text: '首页', link: '/guide/' },
        { text: '文章', link: '/posts/' },
        { text: '关于', link: '/about/' }
      ]
    }
  })
)