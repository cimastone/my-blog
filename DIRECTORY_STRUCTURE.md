# VitePress 自动化目录结构

## 推荐的文件组织方式

```
docs/
├── .vitepress/
│   └── config.mjs          # 配置文件
├── index.md                # 首页
├── guide/                  # 指南目录
│   ├── index.md           # 指南首页
│   ├── redis-lock.md      # 文章1
│   ├── docker-deploy.md   # 文章2
│   └── nginx-config.md    # 文章3
├── posts/                  # 博客文章目录  
│   ├── index.md           # 文章列表页
│   ├── 2025/              # 按年份组织
│   │   ├── 01-learning-vitepress.md
│   │   ├── 02-mermaid-integration.md
│   │   └── 03-nginx-deployment.md
│   └── 2024/
│       ├── 12-year-summary.md
│       └── 11-tech-sharing.md
└── about/
    └── index.md           # 关于页面
```

## 文章编写规范

### 1. 使用Frontmatter（推荐）

```markdown
---
title: "Redis分布式锁详解"
date: 2025-01-04
tags: 
  - Redis
  - 分布式
  - 锁机制
author: CimaStone
description: "深入了解Redis分布式锁的实现原理和最佳实践"
---

# Redis分布式锁详解

这里是文章内容...
```

### 2. 或者使用Markdown标题

```markdown
# Redis分布式锁详解

这里是文章内容...
```

## 自动化的好处

1. **无需修改配置**：新增文章只需创建.md文件
2. **自动标题提取**：从frontmatter或#标题自动提取
3. **自动排序**：按文件名自动排序
4. **分类组织**：按目录自动分类

## 创建新文章的步骤

```bash
# 1. 进入项目目录
cd /root/syc/my-blog

# 2. 创建新文章（指南类）
vim docs/guide/kubernetes-deploy.md

# 3. 创建新文章（博客类）
vim docs/posts/2025/04-k8s-learning.md

# 4. 构建和部署
npm run build
```

## 示例文章模板

### 技术指南模板
```markdown
---
title: "Kubernetes部署指南"
date: 2025-01-04
tags: ["Kubernetes", "Docker", "部署"]
---

# Kubernetes部署指南

## 前言

这里是文章内容...

## 步骤

### 1. 环境准备

### 2. 安装配置

## 总结
```

### 博客文章模板
```markdown
---
title: "2025年技术学习计划"
date: 2025-01-04
author: CimaStone
categories: ["技术", "学习"]
---

# 2025年技术学习计划

## 背景

今年的学习目标是...

## 计划

1. 容器化技术
2. 微服务架构
3. 云原生

## 总结
```