# Nginx VitePress 部署故障排除指南

## 问题概述

你遇到的是典型的nginx权限问题：
```
stat() "/var/syc/my-blog/index.html" failed (13: Permission denied)
```

## 故障原因分析

1. **nginx进程权限**：nginx worker进程运行在`nobody`用户下
2. **文件路径权限**：VitePress构建文件位于`/root/syc/my-blog/docs/.vitepress/dist`
3. **软链接权限**：`/var/syc/my-blog` → `/root/syc/my-blog/docs/.vitepress/dist`
4. **权限链断裂**：nginx进程无法访问`/root`目录

## 解决方案

### 方案1：修复目录权限（推荐）

```bash
# 1. 检查当前权限
ls -la /root/
ls -la /root/syc/
ls -la /root/syc/my-blog/docs/.vitepress/dist/

# 2. 修复整个路径链的权限
chmod 755 /root
chmod 755 /root/syc
chmod 755 /root/syc/my-blog
chmod 755 /root/syc/my-blog/docs
chmod 755 /root/syc/my-blog/docs/.vitepress
chmod -R 755 /root/syc/my-blog/docs/.vitepress/dist

# 3. 确保软链接权限正确
ls -la /var/syc/my-blog
```

### 方案2：移动文件到标准位置

```bash
# 1. 创建标准的web目录
sudo mkdir -p /var/www/my-blog

# 2. 复制VitePress构建文件
sudo cp -r /root/syc/my-blog/docs/.vitepress/dist/* /var/www/my-blog/

# 3. 设置正确的权限
sudo chown -R nginx:nginx /var/www/my-blog
sudo chmod -R 755 /var/www/my-blog

# 4. 更新nginx配置
# 将 alias /var/syc/my-blog/; 改为 alias /var/www/my-blog/;
```

### 方案3：更改nginx运行用户

**注意：这种方法安全性较低，不推荐用于生产环境**

```bash
# 1. 编辑nginx配置文件
sudo vim /etc/nginx/nginx.conf

# 2. 在文件开头添加或修改
user root;

# 3. 重启nginx
sudo systemctl restart nginx
```

### 方案4：使用ACL权限

```bash
# 1. 安装ACL工具（如果未安装）
sudo yum install acl -y  # CentOS/RHEL
# 或
sudo apt-get install acl -y  # Ubuntu/Debian

# 2. 给nobody用户添加读取权限
sudo setfacl -R -m u:nobody:rx /root/syc/my-blog/docs/.vitepress/dist
sudo setfacl -m u:nobody:x /root
sudo setfacl -m u:nobody:x /root/syc
sudo setfacl -m u:nobody:x /root/syc/my-blog
sudo setfacl -m u:nobody:x /root/syc/my-blog/docs
sudo setfacl -m u:nobody:x /root/syc/my-blog/docs/.vitepress
```

## 推荐的nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名
    charset utf-8;
    
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # VitePress静态站点配置
    location /blog/ {
        alias /var/www/my-blog/;  # 使用标准路径
        try_files $uri $uri/ /blog/index.html;
        
        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # HTML文件缓存
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public";
        }
    }
    
    # 你的其他配置...
}
```

## 验证步骤

### 1. 检查nginx配置

```bash
# 检查配置文件语法
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx
```

### 2. 检查文件权限

```bash
# 检查nginx进程
ps aux | grep nginx

# 检查文件权限
ls -la /var/www/my-blog/
ls -la /var/www/my-blog/index.html

# 测试nobody用户是否能访问
sudo -u nobody cat /var/www/my-blog/index.html
```

### 3. 检查SELinux（如果适用）

```bash
# 检查SELinux状态
getenforce

# 如果SELinux启用，设置正确的上下文
sudo setsebool -P httpd_can_network_connect 1
sudo setsebool -P httpd_read_user_content 1
sudo restorecon -R /var/www/my-blog/
```

## 自动化部署脚本

```bash
#!/bin/bash
# deploy-vitepress.sh

# 设置变量
VITEPRESS_SOURCE="/root/syc/my-blog/docs/.vitepress/dist"
NGINX_WEBROOT="/var/www/my-blog"
NGINX_USER="nginx"

# 创建目录
sudo mkdir -p $NGINX_WEBROOT

# 复制文件
sudo cp -r $VITEPRESS_SOURCE/* $NGINX_WEBROOT/

# 设置权限
sudo chown -R $NGINX_USER:$NGINX_USER $NGINX_WEBROOT
sudo chmod -R 755 $NGINX_WEBROOT

# 重启nginx
sudo systemctl reload nginx

echo "VitePress部署完成！"
echo "访问地址：http://your-domain.com/blog/"
```

## 常见问题排除

### 1. 403 Forbidden错误

```bash
# 检查目录权限
ls -la /var/www/my-blog/

# 检查nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### 2. 404 Not Found错误

```bash
# 检查文件是否存在
ls -la /var/www/my-blog/index.html

# 检查nginx配置中的alias路径
sudo nginx -T | grep -A 10 "location /blog"
```

### 3. 样式或JS文件加载失败

```bash
# 检查静态文件权限
ls -la /var/www/my-blog/assets/

# 检查MIME类型配置
sudo nginx -T | grep -A 5 "include.*mime.types"
```

## 监控和日志

```bash
# 实时监控访问日志
sudo tail -f /var/log/nginx/access.log

# 实时监控错误日志
sudo tail -f /var/log/nginx/error.log

# 检查nginx状态
sudo systemctl status nginx
```

## 最佳实践

1. **使用标准目录**：将静态文件放在`/var/www/`下
2. **合理设置权限**：使用644权限给文件，755权限给目录
3. **避免使用root用户**：不要让nginx以root身份运行
4. **定期备份**：定期备份你的VitePress源文件
5. **版本控制**：使用Git管理你的VitePress项目

## 自动化CI/CD

考虑使用GitHub Actions或其他CI/CD工具自动化部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy VitePress

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm install
      - name: Build VitePress
        run: npm run build
      - name: Deploy to server
        run: |
          # 使用SCP或rsync部署到服务器
          scp -r docs/.vitepress/dist/* user@server:/var/www/my-blog/
```

记住：**方案2（移动文件到标准位置）**通常是最佳选择，因为它遵循Linux文件系统的最佳实践。