---
title: "mac - sdk资源版本管理"
date: 2025-08-26
author: cimaStone
category: "工具教程"
tags: 
  - sdk 资源版本管理
---

# mac sdk 介绍

## 🎯 背景
   因为近期本地有很多项目是由不同版本的maven和jdk运行，导致频繁切换会是个问题，所以采取sdk对其进行管理

---

### 常用命令行
```bash
  # 加载配置文件
  source ～/.zshrc

  # 查询jdk
  sdk list java/maven

  # 设置默认值
  sdk default maven 3.9.12-brew

  # 切换不同的版本
  sdk use maven 3.9.12-brew
```
