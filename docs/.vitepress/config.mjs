import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// 动态生成导航和侧边栏的函数
function generateConfig() {
  // 使用 __dirname 的父目录来确保正确的路径
  const guideDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../guide')
  const files = fs.readdirSync(guideDir).filter(file => 
    file.endsWith('.md') && file !== 'index.md'
  )
  
  const articles = files.map(file => {
    const fullPath = path.join(guideDir, file)
    const content = fs.readFileSync(fullPath, 'utf-8')
    const { data: frontmatter } = matter(content)
    
    // 从文件名生成链接
    const link = `/guide/${file.replace('.md', '')}`
    
    return {
      text: frontmatter.title || file.replace('.md', '').replace(/_/g, ' '),
      link: link,
      date: frontmatter.date || '1970-01-01',
      tags: frontmatter.tags || [],
      category: frontmatter.category || '默认分类'
    }
  }).sort((a, b) => new Date(b.date) - new Date(a.date)) // 按日期降序排列

  // 生成导航栏（只显示最新的几篇文章）
  const nav = [
    { text: '首页', link: '/guide/' },
    ...articles.slice(0, 4).map(article => ({ text: article.text, link: article.link }))
  ]

  // 生成分组侧边栏（支持二级分类）
  const groupedArticles = {}
  
  articles.forEach(article => {
    const categoryPath = article.category.split('/') // 支持 "技术架构/分布式系统" 格式
    const mainCategory = categoryPath[0]
    const subCategory = categoryPath[1] || null
    
    if (!groupedArticles[mainCategory]) {
      groupedArticles[mainCategory] = {
        items: [],
        subGroups: {}
      }
    }
    
    if (subCategory) {
      // 有二级分类
      if (!groupedArticles[mainCategory].subGroups[subCategory]) {
        groupedArticles[mainCategory].subGroups[subCategory] = []
      }
      groupedArticles[mainCategory].subGroups[subCategory].push({
        text: article.text,
        link: article.link
      })
    } else {
      // 没有二级分类，直接放在主分类下
      groupedArticles[mainCategory].items.push({
        text: article.text,
        link: article.link
      })
    }
  })

  // 构建sidebar结构
  const sidebarGroups = Object.entries(groupedArticles).map(([mainCategory, data]) => {
    const hasSubGroups = Object.keys(data.subGroups).length > 0
    
    if (hasSubGroups) {
      // 有二级分类的情况
      const subGroupItems = Object.entries(data.subGroups).map(([subCategory, items]) => ({
        text: subCategory,
        collapsed: false,
        items: items
      }))
      
      // 如果主分类下还有直接的文章，也要包含进去
      const allItems = data.items.length > 0 
        ? [...data.items, ...subGroupItems]
        : subGroupItems
      
      return {
        text: mainCategory,
        collapsed: false,
        items: allItems
      }
    } else {
      // 没有二级分类的情况
      return {
        text: mainCategory,
        collapsed: false,
        items: data.items
      }
    }
  })

  const sidebar = [
    { text: '首页', link: '/guide/' },
    ...sidebarGroups
  ]

  return { nav, sidebar }
}

const { nav, sidebar } = generateConfig()


export default withMermaid(
  defineConfig({
    base: "/blog/",
    title: "CimaStone's Blog",
    description: "基于 Docker 的个人博客",
    themeConfig: {
      nav,
      sidebar
    }
    // themeConfig: {
    //   nav: [
    //     { text: '首页', link: '/guide/' },
    //     { text: '搭建个人博客（vitePress）', link: '/guide/vitePress_blog' },
    //     { text: '高并发查询场景下基于Zookeeper+Redis的分布式一致性缓存设计方案', link: '/guide/zk_redisson_distributed_lock' },
    //     { text: '团队研发流程管理 - scrum', link: '/guide/scrum_running' },
    //     { text: 'Redisson分布式锁+本地缓存', link: '/guide/redisson-distributed-lock' }
    //   ],
    //   sidebar: [
    //     { text: '首页', link: '/guide/' },
    //     { text: '搭建个人博客（vitePress）', link: '/guide/vitePress_blog' },
    //     { text: '高并发查询场景下基于Zookeeper+Redis的分布式一致性缓存设计方案', link: '/guide/zk_redisson_distributed_lock' },
    //     { text: '团队研发流程管理 - scrum', link: '/guide/scrum_running' },
    //     { text: 'Redisson分布式锁+本地缓存', link: '/guide/redisson-distributed-lock' }
    //   ]
    // }
    // 这里不用再写 markdown: { mermaid: true }，由插件接管
    // 如需自定义 Mermaid 选项，可在下方添加（可选）：
    // mermaid: { theme: "dark", ... }
  })
)
