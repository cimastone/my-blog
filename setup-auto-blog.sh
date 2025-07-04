#!/bin/bash

# VitePress 自动化博客设置脚本

echo "=== VitePress 自动化博客设置 ==="

BLOG_ROOT="/root/syc/my-blog"
DOCS_DIR="$BLOG_ROOT/docs"
CONFIG_FILE="$DOCS_DIR/.vitepress/config.mjs"

# 检查项目是否存在
if [ ! -d "$BLOG_ROOT" ]; then
    echo "错误：博客项目不存在: $BLOG_ROOT"
    exit 1
fi

echo "1. 备份现有配置..."
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ 配置已备份"
fi

echo "2. 创建自动化配置文件..."
cat > "$CONFIG_FILE" << 'EOF'
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
      const titleMatch = content.match(/title:\s*['"]?([^'"]+)['"]?/m) || 
                        content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : fileName.replace(/-/g, ' ')
      
      sidebar.push({
        text: title,
        link: `/${dir}/${fileName}`
      })
    } catch (error) {
      sidebar.push({
        text: fileName.replace(/-/g, ' '),
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
            text: '技术指南',
            items: generateSidebar('guide')
          }
        ],
        '/posts/': [
          {
            text: '博客文章',
            items: generateSidebar('posts')
          }
        ]
      },
      
      // 导航栏
      nav: [
        { text: '首页', link: '/guide/' },
        { text: '技术指南', link: '/guide/' },
        { text: '博客文章', link: '/posts/' },
        { text: '关于', link: '/about/' }
      ],
      
      // 搜索
      search: {
        provider: 'local'
      },
      
      // 页脚
      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2025 CimaStone'
      }
    }
  })
)
EOF

echo "✅ 自动化配置文件已创建"

echo "3. 创建目录结构..."

# 创建必要的目录
mkdir -p "$DOCS_DIR/guide"
mkdir -p "$DOCS_DIR/posts/2025"
mkdir -p "$DOCS_DIR/about"

echo "4. 创建示例文章..."

# 创建首页
if [ ! -f "$DOCS_DIR/index.md" ]; then
cat > "$DOCS_DIR/index.md" << 'EOF'
---
layout: home

hero:
  name: "CimaStone's Blog"
  text: "基于 Docker 的个人博客"
  tagline: "记录技术学习和项目实践"
  actions:
    - theme: brand
      text: 技术指南
      link: /guide/
    - theme: alt
      text: 博客文章
      link: /posts/

features:
  - title: 容器化部署
    details: 基于Docker的现代化部署方案
  - title: 技术分享
    details: 记录学习过程和技术实践
  - title: 开源精神
    details: 分享知识，共同进步
EOF
fi

# 创建指南首页
if [ ! -f "$DOCS_DIR/guide/index.md" ]; then
cat > "$DOCS_DIR/guide/index.md" << 'EOF'
# 技术指南

这里收集了各种技术相关的指南和教程。

## 最新指南

- [Redis分布式锁详解](./redisson-distributed-lock)
- [VitePress博客搭建](./vitepress-setup)
- [Nginx配置优化](./nginx-optimization)

## 分类

### 后端技术
- 数据库优化
- 缓存策略
- 分布式系统

### 运维部署
- Docker容器化
- Nginx配置
- 监控告警

### 前端技术
- Vue.js应用
- 静态站点生成
- 性能优化
EOF
fi

# 创建文章首页
if [ ! -f "$DOCS_DIR/posts/index.md" ]; then
cat > "$DOCS_DIR/posts/index.md" << 'EOF'
# 博客文章

这里是我的技术博客文章，记录学习过程和项目实践。

## 2025年文章

- [VitePress博客自动化配置](./2025/01-vitepress-automation)
- [Mermaid图表集成指南](./2025/02-mermaid-integration)
- [Nginx权限问题解决](./2025/03-nginx-permissions)

## 归档

### 按年份
- [2025年](/posts/2025/)
- [2024年](/posts/2024/)

### 按主题
- 容器化技术
- 前端开发
- 后端架构
- 运维部署
EOF
fi

# 创建关于页面
if [ ! -f "$DOCS_DIR/about/index.md" ]; then
cat > "$DOCS_DIR/about/index.md" << 'EOF'
# 关于

## 博客介绍

这是一个基于VitePress构建的个人技术博客，主要分享：

- 📚 技术学习笔记
- 🛠️ 项目实践经验  
- 💡 问题解决方案
- 🔍 技术深度探索

## 技术栈

- **博客框架**: VitePress
- **部署方式**: Docker + Nginx
- **图表支持**: Mermaid
- **主题**: 默认主题（自定义）

## 联系方式

- 邮箱: your-email@example.com
- GitHub: https://github.com/yourusername

## 更新日志

### 2025-01-04
- ✅ 完成VitePress博客搭建
- ✅ 集成Mermaid图表支持
- ✅ 配置自动化侧边栏
- ✅ 解决Nginx部署问题

---

*最后更新: 2025年1月4日*
EOF
fi

# 创建示例文章
if [ ! -f "$DOCS_DIR/posts/2025/01-vitepress-automation.md" ]; then
cat > "$DOCS_DIR/posts/2025/01-vitepress-automation.md" << 'EOF'
---
title: "VitePress博客自动化配置"
date: 2025-01-04
author: CimaStone
tags: 
  - VitePress
  - 自动化
  - 博客
description: "如何配置VitePress实现自动侧边栏生成，无需每次手动修改配置文件"
---

# VitePress博客自动化配置

## 背景

在使用VitePress构建博客时，每次新增文章都需要手动修改`config.mjs`文件来更新侧边栏，这很麻烦。

## 解决方案

通过编写自动侧边栏生成函数，可以实现：

1. 自动扫描目录下的markdown文件
2. 自动提取文章标题
3. 自动生成侧边栏配置

## 实现代码

```javascript
function generateSidebar(dir) {
  const sidebar = []
  const basePath = path.resolve(process.cwd(), 'docs', dir)
  
  if (!fs.existsSync(basePath)) {
    return sidebar
  }
  
  const files = fs.readdirSync(basePath)
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .sort()
  
  // 处理文件...
  return sidebar
}
```

## 效果

现在新增文章只需要：

1. 创建markdown文件
2. 运行构建命令
3. 自动更新侧边栏

## 总结

自动化配置大大提升了博客维护效率，推荐使用！
EOF
fi

echo "5. 设置文件权限..."
chmod -R 755 "$DOCS_DIR"
find "$DOCS_DIR" -type f -exec chmod 644 {} \;

echo "6. 构建项目..."
cd "$BLOG_ROOT"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败，请检查配置"
    exit 1
fi

echo "7. 重新加载nginx..."
systemctl reload nginx

echo ""
echo "=== 设置完成 ==="
echo "🎉 恭喜！你的VitePress博客现在支持自动化了！"
echo ""
echo "📁 目录结构:"
echo "  docs/guide/     - 技术指南"
echo "  docs/posts/     - 博客文章"
echo "  docs/about/     - 关于页面"
echo ""
echo "✍️  创建新文章:"
echo "  # 技术指南"
echo "  vim $DOCS_DIR/guide/new-guide.md"
echo ""
echo "  # 博客文章"
echo "  vim $DOCS_DIR/posts/2025/04-new-post.md"
echo ""
echo "🚀 发布流程:"
echo "  1. 创建/编辑markdown文件"
echo "  2. cd $BLOG_ROOT && npm run build"
echo "  3. 自动更新网站"
echo ""
echo "🌐 访问地址: http://43.139.50.25/blog/"
echo ""
echo "💡 提示："
echo "  - 无需再修改config.mjs"
echo "  - 文章标题自动从frontmatter或#标题提取"
echo "  - 侧边栏按文件名自动排序"