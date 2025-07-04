# 软链接权限详解

## 问题分析

你的软链接路径：`/var/syc/my-blog` → `/root/syc/my-blog/docs/.vitepress/dist`

nginx进程运行在`nobody`用户下，需要访问整个路径链的每一级目录。

## 权限路径分析

### 软链接侧路径
```
/var/                     # 需要 755 权限（通常已有）
└── syc/                  # 需要 755 权限 ⚠️ 
    └── my-blog           # 软链接本身
```

### 目标路径侧
```
/root/                              # 需要 755 权限 ⚠️ 关键！
└── syc/                           # 需要 755 权限 ⚠️
    └── my-blog/                   # 需要 755 权限 ⚠️
        └── docs/                  # 需要 755 权限 ⚠️
            └── .vitepress/        # 需要 755 权限 ⚠️
                └── dist/          # 需要 755 权限 ⚠️
                    ├── index.html # 需要 644 权限
                    └── assets/    # 目录需要 755 权限
```

## 具体需要修改的权限

### 1. 软链接路径权限

```bash
# /var 通常已经有正确权限，但确保一下
chmod 755 /var

# /var/syc 需要创建并设置权限
mkdir -p /var/syc
chmod 755 /var/syc
```

### 2. 目标路径权限（关键！）

```bash
# ⚠️ 这是最关键的 - /root 目录通常是 700 权限
chmod 755 /root

# 修复整个目标路径
chmod 755 /root/syc
chmod 755 /root/syc/my-blog
chmod 755 /root/syc/my-blog/docs
chmod 755 /root/syc/my-blog/docs/.vitepress
chmod -R 755 /root/syc/my-blog/docs/.vitepress/dist
```

## 自动修复脚本

使用我创建的脚本：

```bash
sudo bash fix-symlink-permissions.sh
```

## 手动验证

### 检查当前权限
```bash
# 检查软链接侧
ls -la /var/
ls -la /var/syc/

# 检查目标路径侧
ls -la /root/
ls -la /root/syc/
ls -la /root/syc/my-blog/docs/.vitepress/dist/
```

### 测试nobody用户访问
```bash
# 测试nobody用户是否能读取文件
sudo -u nobody cat /root/syc/my-blog/docs/.vitepress/dist/index.html

# 测试nobody用户是否能列出目录
sudo -u nobody ls /root/syc/my-blog/docs/.vitepress/dist/
```

## 安全考虑

### ⚠️ 安全风险

修改 `/root` 目录权限从 `700` 改为 `755` 会带来安全风险：
- 其他用户可以进入/root目录
- 可能暴露root用户的敏感文件

### 🛡️ 更安全的替代方案

**推荐：使用专用目录**
```bash
# 方案A：移动到标准web目录
sudo mkdir -p /var/www/my-blog
sudo cp -r /root/syc/my-blog/docs/.vitepress/dist/* /var/www/my-blog/
sudo chown -R nobody:nobody /var/www/my-blog
sudo chmod -R 755 /var/www/my-blog

# 更新nginx配置
# alias /var/syc/my-blog/; → alias /var/www/my-blog/;
```

**方案B：使用ACL权限**
```bash
# 安装ACL工具
sudo yum install acl -y  # CentOS/RHEL

# 只给nobody用户特定权限，不改变原有权限
sudo setfacl -m u:nobody:x /root
sudo setfacl -m u:nobody:x /root/syc
sudo setfacl -m u:nobody:x /root/syc/my-blog
sudo setfacl -m u:nobody:x /root/syc/my-blog/docs
sudo setfacl -m u:nobody:x /root/syc/my-blog/docs/.vitepress
sudo setfacl -R -m u:nobody:rx /root/syc/my-blog/docs/.vitepress/dist
```

**方案C：创建专用用户**
```bash
# 创建专用用户运行nginx
sudo useradd -r -s /bin/false nginx-blog
sudo usermod -a -G syc nginx-blog  # 假设syc是一个组

# 修改nginx配置运行用户
# 在nginx.conf开头添加：user nginx-blog;
```

## 推荐的解决方案优先级

1. **最推荐**：方案A - 移动文件到 `/var/www/`
2. **次推荐**：方案B - 使用ACL权限
3. **可接受**：修改目录权限（但要注意安全风险）
4. **不推荐**：方案C - 创建专用用户（配置复杂）

## 快速解决命令

如果你要继续使用软链接方案，执行：

```bash
# 一键修复所有权限
sudo chmod 755 /var /var/syc /root /root/syc /root/syc/my-blog /root/syc/my-blog/docs /root/syc/my-blog/docs/.vitepress
sudo chmod -R 755 /root/syc/my-blog/docs/.vitepress/dist
sudo systemctl reload nginx
```

## 验证成功

修复后运行这些命令验证：

```bash
# 1. 测试文件访问
sudo -u nobody cat /root/syc/my-blog/docs/.vitepress/dist/index.html

# 2. 检查nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 3. 测试网站访问
curl http://127.0.0.1/blog/
```

如果没有权限错误且能看到HTML内容，说明修复成功！