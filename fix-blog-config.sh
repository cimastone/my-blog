#!/bin/bash

# 修复VitePress Mermaid配置脚本

echo "=== 修复VitePress Mermaid配置 ==="

BLOG_ROOT="/root/syc/my-blog"
CONFIG_FILE="$BLOG_ROOT/docs/.vitepress/config.mjs"

# 检查项目是否存在
if [ ! -d "$BLOG_ROOT" ]; then
    echo "❌ 博客项目不存在: $BLOG_ROOT"
    echo "请确认项目路径是否正确"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ 配置文件不存在: $CONFIG_FILE"
    exit 1
fi

echo "1. 备份原配置文件..."
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ 配置已备份"

echo "2. 检查当前配置..."
echo "当前配置内容:"
cat "$CONFIG_FILE"

echo ""
echo "3. 检查是否需要更新依赖..."
cd "$BLOG_ROOT"

# 检查package.json中是否有mermaid相关依赖
if ! grep -q "vitepress-plugin-mermaid" package.json; then
    echo "⚠️  检测到缺少mermaid插件依赖"
    echo "正在安装 vitepress-plugin-mermaid..."
    npm install vitepress-plugin-mermaid mermaid --save-dev
    if [ $? -eq 0 ]; then
        echo "✅ 依赖安装成功"
    else
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

echo "4. 检查配置文件语法..."
if node -c "$CONFIG_FILE" 2>/dev/null; then
    echo "✅ 配置文件语法正确"
else
    echo "❌ 配置文件语法错误，请检查"
    echo "查看详细错误信息:"
    node -c "$CONFIG_FILE"
    exit 1
fi

echo "5. 尝试构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！问题已解决"
else
    echo "❌ 构建仍然失败"
    echo ""
    echo "🔍 故障排除步骤:"
    echo "1. 检查markdown文件语法"
    echo "2. 检查mermaid代码块是否正确闭合"
    echo "3. 查看详细错误信息"
    echo ""
    echo "📁 检查可能有问题的文件:"
    find docs -name "*.md" -exec grep -l "```mermaid" {} \;
fi

echo ""
echo "=== 修复完成 ==="
echo "如果问题仍然存在，请:"
echo "1. 检查所有包含mermaid的markdown文件"
echo "2. 确保代码块正确闭合"
echo "3. 查看具体的错误信息"