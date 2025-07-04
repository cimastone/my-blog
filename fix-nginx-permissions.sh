#!/bin/bash

# VitePress Nginx 权限修复脚本
# 使用方法：bash fix-nginx-permissions.sh

echo "=== VitePress Nginx 权限修复脚本 ==="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用sudo运行此脚本"
    exit 1
fi

# 设置变量
VITEPRESS_SOURCE="/root/syc/my-blog/docs/.vitepress/dist"
NGINX_WEBROOT="/var/www/my-blog"
NGINX_USER="nginx"

# 如果nginx用户不存在，使用nobody
if ! id "$NGINX_USER" &>/dev/null; then
    NGINX_USER="nobody"
fi

echo "1. 检查VitePress构建文件..."
if [ ! -d "$VITEPRESS_SOURCE" ]; then
    echo "错误：VitePress构建目录不存在: $VITEPRESS_SOURCE"
    echo "请先运行 'npm run build' 构建VitePress"
    exit 1
fi

echo "2. 创建nginx web目录..."
mkdir -p "$NGINX_WEBROOT"

echo "3. 复制VitePress文件..."
cp -r "$VITEPRESS_SOURCE"/* "$NGINX_WEBROOT"/

echo "4. 设置文件权限..."
chown -R "$NGINX_USER":"$NGINX_USER" "$NGINX_WEBROOT"
chmod -R 755 "$NGINX_WEBROOT"

echo "5. 验证文件权限..."
ls -la "$NGINX_WEBROOT"/

echo "6. 测试nginx用户是否能读取文件..."
if sudo -u "$NGINX_USER" cat "$NGINX_WEBROOT/index.html" > /dev/null 2>&1; then
    echo "✅ 权限设置成功！"
else
    echo "❌ 权限设置失败，尝试备用方案..."
    # 备用方案：给所有用户读取权限
    chmod -R 755 "$NGINX_WEBROOT"
    chmod -R 644 "$NGINX_WEBROOT"/*
    find "$NGINX_WEBROOT" -type d -exec chmod 755 {} \;
fi

echo "7. 检查nginx配置..."
if nginx -t; then
    echo "✅ Nginx配置语法正确"
else
    echo "❌ Nginx配置有语法错误，请检查配置文件"
fi

echo "8. 重新加载nginx..."
systemctl reload nginx

echo "=== 修复完成 ==="
echo "现在请更新你的nginx配置文件，将："
echo "  alias /var/syc/my-blog/;"
echo "改为："
echo "  alias $NGINX_WEBROOT/;"
echo ""
echo "然后运行："
echo "  sudo systemctl reload nginx"
echo ""
echo "访问地址：http://your-domain.com/blog/"

# 显示部署信息
echo ""
echo "=== 部署信息 ==="
echo "VitePress源文件: $VITEPRESS_SOURCE"
echo "Nginx Web目录: $NGINX_WEBROOT"
echo "Nginx用户: $NGINX_USER"
echo "文件权限: 755 (目录) / 644 (文件)"