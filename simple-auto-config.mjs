import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'fs'
import path from 'path'

// 自动生成侧边栏的函数
function generateSidebar(dir) {
  const sidebar = []
  const basePath = path.resolve(process.cwd(), 'docs', dir)
  
  if (!fs.existsSync(basePath)) {
    return sidebar
  }
  
  const files = fs.readdirSync(basePath)
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .sort()
  
  files.forEach(file => {
    const fileName = file.replace('.md', '')
    const filePath = path.join(basePath, file)
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      // 提取标题（从frontmatter或第一个#标题）
      const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/title:\s*['"]?([^'"]+)['"]?/m)
      const title = titleMatch ? titleMatch[1] : fileName
      
      sidebar.push({
        text: title,
        link: `/${dir}/${fileName}`
      })
    } catch (error) {
      // 如果读取失败，使用文件名
      sidebar.push({
        text: fileName,
        link: `/${dir}/${fileName}`
      })
    }
  })
  
  return sidebar
}

export default withMermaid(
  defineConfig({
    base: "/blog/",
    title: "CimaStone's Blog",
    description: "基于 Docker 的个人博客",
    
    themeConfig: {
      // 自动生成侧边栏
      sidebar: {
        '/guide/': [
          {
            text: '指南',
            items: generateSidebar('guide')
          }
        ],
        '/posts/': [
          {
            text: '文章',
            items: generateSidebar('posts')
          }
        ]
      },
      
      // 简单的导航栏
      nav: [
        { text: '首页', link: '/guide/' },
        { text: '文章', link: '/posts/' },
        { text: 'Redis分布式锁', link: '/guide/redisson-distributed-lock' }
      ]
    }
  })
)