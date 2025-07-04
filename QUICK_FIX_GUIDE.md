# 🚀 快速修复nginx权限问题

## 立即执行的解决方案

### 步骤1：运行修复脚本

```bash
# 在你的服务器上执行
sudo bash fix-nginx-permissions.sh
```

### 步骤2：更新nginx配置

替换你的nginx配置文件中的server块，使用新的配置：

```nginx
server {
    listen 80;
    server_name 127.0.0.1:80;
    charset utf-8;
    
    # VitePress静态站点配置
    location /blog/ {
        alias /var/www/my-blog/;  # 新的路径
        index index.html;
        try_files $uri $uri/ /blog/index.html;
    }
    
    # 原有的项目配置
    location / {
        include uwsgi_params;
        uwsgi_pass 127.0.0.1:8000;
        uwsgi_param UWSGI_SCRIPT issue_collect.wsgi;
        uwsgi_param UWSGI_CHDIR /home/syc/project/issue_collect;
    }
    
    # 静态文件配置（修复路径重复问题）
    location /static/ {
        alias /home/syc/project/issue_collect/static/;
    }
}
```

### 步骤3：重新加载nginx

```bash
sudo nginx -t        # 检查配置语法
sudo systemctl reload nginx   # 重新加载配置
```

### 步骤4：验证部署

```bash
# 检查文件权限
ls -la /var/www/my-blog/

# 检查nginx进程
ps aux | grep nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

## 如果还有问题

### 方案A：手动执行权限修复

```bash
# 1. 复制文件
sudo mkdir -p /var/www/my-blog
sudo cp -r /root/syc/my-blog/docs/.vitepress/dist/* /var/www/my-blog/

# 2. 设置权限
sudo chown -R nobody:nobody /var/www/my-blog
sudo chmod -R 755 /var/www/my-blog

# 3. 测试权限
sudo -u nobody cat /var/www/my-blog/index.html
```

### 方案B：使用ACL权限

```bash
# 给nginx用户添加特定权限
sudo setfacl -R -m u:nobody:rx /var/www/my-blog
sudo setfacl -d -m u:nobody:rx /var/www/my-blog
```

### 方案C：检查SELinux

```bash
# 如果是CentOS/RHEL系统
sudo getenforce

# 如果SELinux启用，设置正确的上下文
sudo setsebool -P httpd_can_network_connect 1
sudo restorecon -R /var/www/my-blog/
```

## 测试访问

打开浏览器访问：
- `http://127.0.0.1/blog/` - VitePress博客
- `http://127.0.0.1/` - 原有的Django/Flask项目

## 常见错误和解决方案

### 错误1：403 Forbidden
```bash
# 检查权限
ls -la /var/www/my-blog/
sudo -u nobody ls -la /var/www/my-blog/
```

### 错误2：404 Not Found
```bash
# 检查文件是否存在
ls -la /var/www/my-blog/index.html
```

### 错误3：样式文件加载失败
```bash
# 检查assets目录权限
ls -la /var/www/my-blog/assets/
```

## 自动化部署

创建一个简单的部署脚本：

```bash
#!/bin/bash
# deploy.sh

# 构建VitePress
cd /root/syc/my-blog
npm run build

# 部署到nginx
sudo cp -r docs/.vitepress/dist/* /var/www/my-blog/
sudo chown -R nobody:nobody /var/www/my-blog
sudo chmod -R 755 /var/www/my-blog

# 重新加载nginx
sudo systemctl reload nginx

echo "部署完成！"
```

## 注意事项

1. **备份原配置**：修改nginx配置前先备份
2. **测试配置**：使用`nginx -t`检查语法
3. **监控日志**：部署后观察错误日志
4. **权限安全**：生产环境不要使用过于宽松的权限

## 联系支持

如果问题仍然存在，请提供以下信息：
- nginx错误日志：`sudo tail -20 /var/log/nginx/error.log`
- 文件权限：`ls -la /var/www/my-blog/`
- nginx进程：`ps aux | grep nginx`
- 配置测试：`sudo nginx -t`