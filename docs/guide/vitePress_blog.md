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

```bash
# 卸载旧版本（如果有）
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安装依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 官方仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 验证 Docker 是否安装成功
docker --version
```
