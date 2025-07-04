#!/bin/bash

# 检查VitePress构建结果脚本

echo "=== 检查VitePress构建结果 ==="

VITEPRESS_ROOT="/root/syc/my-blog"
DIST_DIR="/root/syc/my-blog/docs/.vitepress/dist"

echo "1. 检查项目目录..."
if [ ! -d "$VITEPRESS_ROOT" ]; then
    echo "错误：项目目录不存在"
    exit 1
fi

echo "2. 进入项目目录并重新构建..."
cd "$VITEPRESS_ROOT"

echo "开始构建VitePress..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！请检查配置文件"
    exit 1
fi

echo "✅ 构建成功！"

echo ""
echo "3. 检查构建文件..."
if [ ! -d "$DIST_DIR" ]; then
    echo "❌ 构建目录不存在"
    exit 1
fi

echo "构建目录内容:"
ls -la "$DIST_DIR"

echo ""
echo "4. 检查HTML文件中的资源路径..."
INDEX_FILE="$DIST_DIR/index.html"
if [ -f "$INDEX_FILE" ]; then
    echo "检查index.html中的静态资源路径:"
    echo "CSS文件路径:"
    grep -o 'href="[^"]*\.css"' "$INDEX_FILE" | head -3
    
    echo ""
    echo "JS文件路径:"
    grep -o 'src="[^"]*\.js"' "$INDEX_FILE" | head -3
    
    echo ""
    echo "检查是否包含 /blog/ 前缀:"
    if grep -q "/blog/assets" "$INDEX_FILE"; then
        echo "✅ 找到正确的 /blog/assets 路径"
    else
        echo "❌ 未找到 /blog/assets 路径，检查base配置"
        echo "当前找到的assets路径:"
        grep -o '[^"]*assets[^"]*' "$INDEX_FILE" | head -3
    fi
else
    echo "❌ index.html文件不存在"
fi

echo ""
echo "5. 检查assets目录..."
ASSETS_DIR="$DIST_DIR/assets"
if [ -d "$ASSETS_DIR" ]; then
    echo "✅ assets目录存在"
    echo "assets文件数量: $(ls -1 "$ASSETS_DIR" | wc -l)"
    echo "部分文件列表:"
    ls -la "$ASSETS_DIR" | head -5
    
    # 检查文件权限
    echo ""
    echo "检查文件权限:"
    ls -la "$ASSETS_DIR" | head -3
else
    echo "❌ assets目录不存在"
fi

echo ""
echo "6. 测试文件访问权限..."
if sudo -u nobody test -r "$INDEX_FILE"; then
    echo "✅ nobody用户可以读取index.html"
else
    echo "❌ nobody用户无法读取index.html，需要修复权限"
fi

if [ -d "$ASSETS_DIR" ]; then
    FIRST_ASSET=$(find "$ASSETS_DIR" -type f | head -1)
    if [ -n "$FIRST_ASSET" ] && sudo -u nobody test -r "$FIRST_ASSET"; then
        echo "✅ nobody用户可以读取assets文件"
    else
        echo "❌ nobody用户无法读取assets文件，需要修复权限"
        echo "修复权限:"
        chmod -R 644 "$ASSETS_DIR"/*
        find "$ASSETS_DIR" -type d -exec chmod 755 {} \;
    fi
fi

echo ""
echo "7. 重新加载nginx..."
systemctl reload nginx
echo "✅ nginx已重新加载"

echo ""
echo "=== 检查完成 ==="
echo "请清空浏览器缓存后访问: http://43.139.50.25/blog/"
echo ""
echo "如果仍有问题，请检查:"
echo "1. 浏览器开发者工具Network标签"
echo "2. nginx访问日志: sudo tail -f /var/log/nginx/access.log"
echo "3. HTML文件中是否包含正确的 /blog/assets 路径"