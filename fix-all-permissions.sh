#!/bin/bash

# VitePress 完整权限修复脚本
# 修复所有文件权限，包括CSS、JS等静态资源

echo "=== VitePress 完整权限修复脚本 ==="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用sudo运行此脚本"
    exit 1
fi

# 设置路径变量
VITEPRESS_ROOT="/root/syc/my-blog"
VITEPRESS_DIST="/root/syc/my-blog/docs/.vitepress/dist"
SYMLINK_PATH="/var/syc/my-blog"

echo "1. 检查VitePress项目目录..."
if [ ! -d "$VITEPRESS_ROOT" ]; then
    echo "错误：VitePress项目目录不存在: $VITEPRESS_ROOT"
    exit 1
fi

if [ ! -d "$VITEPRESS_DIST" ]; then
    echo "错误：VitePress构建目录不存在: $VITEPRESS_DIST"
    echo "请先运行 'npm run build' 构建VitePress"
    exit 1
fi

echo "2. 修复整个VitePress项目目录权限..."

# 修复整个项目目录权限
echo "修复整个项目目录: $VITEPRESS_ROOT"
chmod -R 755 "$VITEPRESS_ROOT"

echo "3. 特别处理构建文件权限..."

# 确保所有目录都有执行权限
echo "设置所有目录为755权限..."
find "$VITEPRESS_DIST" -type d -exec chmod 755 {} \;

# 确保所有文件都有读取权限
echo "设置所有文件为644权限..."
find "$VITEPRESS_DIST" -type f -exec chmod 644 {} \;

# 特别处理常见的静态资源文件
echo "4. 修复静态资源文件权限..."

# CSS文件
if find "$VITEPRESS_DIST" -name "*.css" | grep -q .; then
    echo "修复CSS文件权限..."
    find "$VITEPRESS_DIST" -name "*.css" -exec chmod 644 {} \;
fi

# JavaScript文件
if find "$VITEPRESS_DIST" -name "*.js" | grep -q .; then
    echo "修复JavaScript文件权限..."
    find "$VITEPRESS_DIST" -name "*.js" -exec chmod 644 {} \;
fi

# 图片文件
if find "$VITEPRESS_DIST" -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" | grep -q .; then
    echo "修复图片文件权限..."
    find "$VITEPRESS_DIST" \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" \) -exec chmod 644 {} \;
fi

# 字体文件
if find "$VITEPRESS_DIST" -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" -o -name "*.eot" | grep -q .; then
    echo "修复字体文件权限..."
    find "$VITEPRESS_DIST" \( -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" -o -name "*.eot" \) -exec chmod 644 {} \;
fi

# HTML文件
if find "$VITEPRESS_DIST" -name "*.html" | grep -q .; then
    echo "修复HTML文件权限..."
    find "$VITEPRESS_DIST" -name "*.html" -exec chmod 644 {} \;
fi

echo "5. 检查assets目录..."
ASSETS_DIR="$VITEPRESS_DIST/assets"
if [ -d "$ASSETS_DIR" ]; then
    echo "修复assets目录权限..."
    chmod 755 "$ASSETS_DIR"
    chmod -R 644 "$ASSETS_DIR"/*
    find "$ASSETS_DIR" -type d -exec chmod 755 {} \;
fi

echo "6. 验证关键文件权限..."
echo "检查构建目录权限:"
ls -la "$VITEPRESS_DIST"

if [ -d "$ASSETS_DIR" ]; then
    echo ""
    echo "检查assets目录权限:"
    ls -la "$ASSETS_DIR"
fi

echo ""
echo "7. 测试nobody用户访问权限..."
echo "测试index.html:"
if sudo -u nobody cat "$VITEPRESS_DIST/index.html" > /dev/null 2>&1; then
    echo "✅ nobody用户可以访问index.html"
else
    echo "❌ nobody用户无法访问index.html"
fi

echo ""
echo "测试assets目录:"
if sudo -u nobody ls "$ASSETS_DIR" > /dev/null 2>&1; then
    echo "✅ nobody用户可以访问assets目录"
    # 测试assets目录中的文件
    FIRST_ASSET=$(sudo -u nobody find "$ASSETS_DIR" -type f | head -1)
    if [ -n "$FIRST_ASSET" ] && sudo -u nobody cat "$FIRST_ASSET" > /dev/null 2>&1; then
        echo "✅ nobody用户可以读取assets文件"
    else
        echo "❌ nobody用户无法读取assets文件"
    fi
else
    echo "❌ nobody用户无法访问assets目录"
fi

echo ""
echo "8. 检查nginx配置..."
if nginx -t; then
    echo "✅ Nginx配置语法正确"
else
    echo "❌ Nginx配置有错误"
fi

echo ""
echo "9. 重新加载nginx..."
systemctl reload nginx
echo "✅ Nginx已重新加载"

echo ""
echo "10. 显示文件权限统计..."
echo "目录权限统计:"
find "$VITEPRESS_DIST" -type d -exec stat -c "%a %n" {} \; | head -5

echo ""
echo "文件权限统计:"
find "$VITEPRESS_DIST" -type f -exec stat -c "%a %n" {} \; | head -10

echo ""
echo "=== 修复完成 ==="
echo "VitePress项目路径: $VITEPRESS_ROOT"
echo "构建文件路径: $VITEPRESS_DIST"
echo "软链接路径: $SYMLINK_PATH"
echo ""
echo "建议操作:"
echo "1. 清空浏览器缓存 (Ctrl+F5)"
echo "2. 检查开发者工具的Network标签，查看是否有404错误"
echo "3. 访问: http://43.139.50.25/blog/"
echo ""
echo "如果样式仍然有问题，请检查:"
echo "- 浏览器开发者工具的Console和Network标签"
echo "- nginx访问日志: sudo tail -f /var/log/nginx/access.log"
echo "- nginx错误日志: sudo tail -f /var/log/nginx/error.log"