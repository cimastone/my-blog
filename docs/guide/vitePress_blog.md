---
title: "搭建个人博客（vitePress）"
date: 2025-07-05
author: CimaStone
tags: [个人博客搭建]
---

# 搭建个人博客（vitePress）

## 🎯 背景
最近想把工作履历进行相应的梳理，之前也在市面上比较大的博客论坛中编写过相应的博客，但各种原因未能持续记录；现在搭建自己的个人博客，把工作多年的履历进行相应的记录，里面会包含技术、管理和生活的感悟；
so，从搭建vitepress的过程记录成一篇博客

## 🔧 环境准备
前置条件：CPU - 2核 内存 - 2GB，CentOS 7.6 64bit，操作系统比较老，所以通过docker进行安装，摒弃了操作系统差异化限制

## 📝 详细步骤

### 1. 安装docker

### 2. 拉取Node.js 官方镜像 && 创建并运行 VitePress 容器
```bash
# 拉取镜像
docker pull node:18

# 创建项目目录
mkdir -p ~/vitepress
cd ~/vitepress

# 初始化 vitepress 项目
docker run --rm -it -v "$PWD":/app -w /app node:18 bash

# 进入容器后执行
npm init vitepress@latest
exit

# 启动vitepress
sudo docker run -it --name vitepress-blog \
  -p 5173:5173 \
  -v /root/syc/my-blog:/workspace \
  node:18-bullseye bash

# 进入容器后执行，需要在项目根目录，也就是docs同级目录
npx vitepress dev docs --host

# 对vitepress进行编译，其目的是编译后，会在 your_project_path/docs/.vitepress/dist编译成html文件
npx vitepress build docs

# 关掉docker
docker stop vitepress-blog

# 启动docker
docker start -ai vitepress-blog

#从服务器中进入docker内部
docker exec -it vitepress-blog bash

# 查询vitepress ｜ mermaid版本 
npm ls vitepress
npm ls mermaid
```
