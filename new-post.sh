#!/bin/bash

# 快速创建新文章脚本

BLOG_ROOT="/root/syc/my-blog"
DOCS_DIR="$BLOG_ROOT/docs"

echo "=== 快速创建新文章 ==="

# 选择文章类型
echo "请选择文章类型:"
echo "1. 技术指南 (guide)"
echo "2. 博客文章 (posts)"
read -p "请输入选择 (1或2): " choice

# 获取文章标题
read -p "请输入文章标题: " title

# 生成文件名（将标题转为文件名格式）
filename=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[[:space:]]/-/g' | sed 's/[^a-z0-9-]//g')

# 根据选择设置路径
if [ "$choice" == "1" ]; then
    file_path="$DOCS_DIR/guide/${filename}.md"
    category="技术指南"
elif [ "$choice" == "2" ]; then
    year=$(date +%Y)
    mkdir -p "$DOCS_DIR/posts/$year"
    file_path="$DOCS_DIR/posts/$year/$(date +%m)-${filename}.md"
    category="博客文章"
else
    echo "无效选择"
    exit 1
fi

# 检查文件是否已存在
if [ -f "$file_path" ]; then
    echo "文件已存在: $file_path"
    read -p "是否覆盖? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "取消创建"
        exit 0
    fi
fi

# 创建文章模板
cat > "$file_path" << EOF
---
title: "$title"
date: $(date +%Y-%m-%d)
author: CimaStone
tags: 
  - 标签1
  - 标签2
description: "文章描述"
---

# $title

## 背景

这里写背景介绍...

## 正文

### 小标题1

内容...

### 小标题2

内容...

## 总结

这里写总结...

---

*最后更新: $(date +%Y年%m月%d日)*
EOF

echo "✅ 文章已创建: $file_path"
echo ""
echo "📝 下一步操作:"
echo "1. 编辑文章内容:"
echo "   vim $file_path"
echo ""
echo "2. 构建和部署:"
echo "   cd $BLOG_ROOT"
echo "   npm run build"
echo ""
echo "🌐 完成后访问: http://43.139.50.25/blog/"

# 询问是否立即打开编辑器
read -p "是否立即打开编辑器? (y/N): " edit_now
if [ "$edit_now" == "y" ] || [ "$edit_now" == "Y" ]; then
    vim "$file_path"
    
    # 编辑完成后询问是否构建
    read -p "是否立即构建网站? (y/N): " build_now
    if [ "$build_now" == "y" ] || [ "$build_now" == "Y" ]; then
        cd "$BLOG_ROOT"
        npm run build
        echo "✅ 构建完成！"
    fi
fi