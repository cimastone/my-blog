#!/bin/bash

# 软链接权限修复脚本
# 解决 /var/syc/my-blog -> /root/syc/my-blog/docs/.vitepress/dist 的权限问题

echo "=== 软链接权限修复脚本 ==="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用sudo运行此脚本"
    exit 1
fi

# 定义路径
SYMLINK_PATH="/var/syc/my-blog"
TARGET_PATH="/root/syc/my-blog/docs/.vitepress/dist"

echo "1. 检查软链接和目标路径..."
if [ ! -L "$SYMLINK_PATH" ]; then
    echo "错误：软链接不存在: $SYMLINK_PATH"
    exit 1
fi

if [ ! -d "$TARGET_PATH" ]; then
    echo "错误：目标目录不存在: $TARGET_PATH"
    echo "请先运行 'npm run build' 构建VitePress"
    exit 1
fi

echo "2. 检查当前权限..."
echo "软链接权限:"
ls -la "$SYMLINK_PATH"
echo ""
echo "目标路径权限:"
ls -la /root/
ls -la /root/syc/
ls -la /root/syc/my-blog/
ls -la /root/syc/my-blog/docs/
ls -la /root/syc/my-blog/docs/.vitepress/

echo ""
echo "3. 修复软链接路径权限..."

# 修复 /var 路径（通常已经有正确权限，但确保一下）
echo "修复 /var 权限..."
chmod 755 /var

# 修复 /var/syc 权限
echo "修复 /var/syc 权限..."
mkdir -p /var/syc
chmod 755 /var/syc

# 软链接本身权限通常不需要修改，但确保父目录权限正确
echo "软链接 $SYMLINK_PATH 权限已检查"

echo ""
echo "4. 修复目标路径权限..."

# 这是关键！/root 目录通常是 700 权限，nobody用户无法访问
echo "修复 /root 权限..."
chmod 755 /root

echo "修复 /root/syc 权限..."
chmod 755 /root/syc

echo "修复 /root/syc/my-blog 权限..."
chmod 755 /root/syc/my-blog

echo "修复 /root/syc/my-blog/docs 权限..."
chmod 755 /root/syc/my-blog/docs

echo "修复 /root/syc/my-blog/docs/.vitepress 权限..."
chmod 755 /root/syc/my-blog/docs/.vitepress

echo "修复 VitePress 构建文件权限..."
chmod -R 755 "$TARGET_PATH"

echo ""
echo "5. 测试 nobody 用户访问权限..."
if sudo -u nobody test -r "$TARGET_PATH/index.html"; then
    echo "✅ nobody 用户可以访问 index.html"
else
    echo "❌ nobody 用户仍然无法访问文件"
    echo "尝试更宽松的权限设置..."
    chmod 755 /root
    chmod -R 755 /root/syc
fi

echo ""
echo "6. 验证权限设置..."
echo "完整路径权限检查:"
ls -la /var/
ls -la /var/syc/
ls -la /root/
ls -la /root/syc/
ls -la "$TARGET_PATH"

echo ""
echo "7. 测试nginx配置..."
if nginx -t; then
    echo "✅ Nginx配置语法正确"
    systemctl reload nginx
    echo "✅ Nginx已重新加载"
else
    echo "❌ Nginx配置有错误"
fi

echo ""
echo "=== 修复完成 ==="
echo "软链接: $SYMLINK_PATH"
echo "目标路径: $TARGET_PATH"
echo ""
echo "⚠️  安全提醒:"
echo "   修改 /root 目录权限可能带来安全风险"
echo "   生产环境建议使用方案2（移动文件到 /var/www/）"
echo ""
echo "测试访问: http://127.0.0.1/blog/"