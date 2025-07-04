#!/bin/bash

# VitePress base 路径修复脚本

echo "=== VitePress Base 路径修复 ==="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用sudo运行此脚本"
    exit 1
fi

VITEPRESS_ROOT="/root/syc/my-blog"
CONFIG_FILE="/root/syc/my-blog/docs/.vitepress/config.mjs"

echo "1. 检查VitePress项目..."
if [ ! -d "$VITEPRESS_ROOT" ]; then
    echo "错误：VitePress项目不存在: $VITEPRESS_ROOT"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误：配置文件不存在: $CONFIG_FILE"
    exit 1
fi

echo "2. 备份原配置文件..."
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ 备份完成: $CONFIG_FILE.backup.*"

echo "3. 检查配置文件中是否已有base配置..."
if grep -q "base:" "$CONFIG_FILE"; then
    echo "⚠️  配置文件中已有base配置"
    echo "当前base配置:"
    grep "base:" "$CONFIG_FILE"
else
    echo "📝 需要添加base配置"
    
    # 检查是否使用withMermaid
    if grep -q "withMermaid" "$CONFIG_FILE"; then
        echo "检测到withMermaid配置，正在添加base..."
        # 在defineConfig中添加base配置
        sed -i '/defineConfig({/a\    base: "/blog/",' "$CONFIG_FILE"
    else
        echo "检测到标准配置，正在添加base..."
        sed -i '/export default defineConfig({/a\  base: "/blog/",' "$CONFIG_FILE"
    fi
    echo "✅ base配置已添加"
fi

echo "4. 显示修改后的配置..."
echo "配置文件内容:"
cat "$CONFIG_FILE"

echo ""
echo "5. 重新构建VitePress..."
cd "$VITEPRESS_ROOT"

# 检查是否有package.json
if [ ! -f "package.json" ]; then
    echo "错误：package.json不存在，请确认这是一个有效的VitePress项目"
    exit 1
fi

# 构建项目
echo "开始构建..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败，请检查配置"
    exit 1
fi

echo ""
echo "6. 检查构建文件..."
DIST_DIR="$VITEPRESS_ROOT/docs/.vitepress/dist"
if [ -d "$DIST_DIR" ]; then
    echo "✅ 构建目录存在: $DIST_DIR"
    echo "文件列表:"
    ls -la "$DIST_DIR"
    
    if [ -d "$DIST_DIR/assets" ]; then
        echo "✅ assets目录存在"
        echo "assets文件列表:"
        ls -la "$DIST_DIR/assets" | head -5
    fi
else
    echo "❌ 构建目录不存在"
    exit 1
fi

echo ""
echo "7. 重新加载nginx..."
systemctl reload nginx
echo "✅ Nginx已重新加载"

echo ""
echo "=== 修复完成 ==="
echo "请执行以下操作:"
echo "1. 清空浏览器缓存 (Ctrl+F5)"
echo "2. 访问: http://43.139.50.25/blog/"
echo "3. 检查开发者工具Network标签，确认静态资源正常加载"
echo ""
echo "如果还有问题，请检查:"
echo "- nginx访问日志: sudo tail -f /var/log/nginx/access.log"
echo "- VitePress构建日志中是否有错误"
echo ""
echo "配置文件已备份为: $CONFIG_FILE.backup.*"