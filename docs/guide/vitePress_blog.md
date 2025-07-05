---
title: "搭建个人博客（vitePress）"
date: 2025-07-05
author: CimaStone
tags: [个人博客搭建]
---

# 搭建个人博客（vitePress）

## 🎯 背景
最近想把工作履历进行相应的梳理，之前也在市面上比较大的博客论坛中编写过相应的博客，但各种原因未能持续记录；现在搭建自己的个人博客，把工作多年的履历进行相应的记录，里面会包含技术、管理和生活的感悟；
so，从搭建vitepress的过程记录成一篇博客

## 🔧 环境准备
前置条件：CPU - 2核 内存 - 2GB，CentOS 7.6 64bit，操作系统比较老，所以通过docker进行安装，摒弃了操作系统差异化限制

## 📝 详细步骤

### 1. 安装docker

```bash
# 卸载旧版本（如果有）
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安装依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 官方仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 验证 Docker 是否安装成功
docker --version
```

### 2. 拉取Node.js 官方镜像 && 创建并运行 VitePress 容器
```bash
# 拉取镜像
docker pull node:18

# 创建项目目录
mkdir -p ~/vitepress
cd ~/vitepress

# 初始化 vitepress 项目
docker run --rm -it -v "$PWD":/app -w /app node:18 bash

# 进入容器后执行
npm init vitepress@latest
exit

# 启动vitepress
sudo docker run -it --name vitepress-blog \
  -p 5173:5173 \
  -v /root/syc/my-blog:/workspace \
  node:18-bullseye bash

# 进入容器后执行，需要在项目根目录，也就是docs同级目录
npx vitepress dev docs --host

# 对vitepress进行编译，其目的是编译后，会在 your_project_path/docs/.vitepress/dist编译成html文件
npx vitepress build docs

# 关掉docker
docker stop vitepress-blog

# 启动docker
docker start -ai vitepress-blog

#从服务器中进入docker内部
docker exec -it vitepress-blog bash

# 查询vitepress ｜ mermaid版本 
npm ls vitepress
npm ls mermaid
```
### 3. 集成Giscus 评论系统
#### 步骤 1：准备你的 GitHub 仓库
Giscus 依赖 GitHub Discussions，你需要有一个启用了 Discussions 的公开仓库（私有仓库不支持评论）。

打开你的 GitHub 仓库页面，点击「Settings」→「Features」→ 勾选「Discussions」。
如果没有 Discussions，点击「Set up discussions」

#### 步骤 2：在 Giscus 网站生成嵌入代码
1. 打开 https://giscus.app/。
2. 选择你的「仓库」（如 yourname/yourrepo）。
3. 选择 Discussion 分类（如 General）。
4. 配置 Mapping（建议用 pathname，即按页面路径分配讨论）。
5. 配置其它选项（如主题、语言等）。
6. 下方会自动生成一段 <script ...></script> 代码，复制备用。
   
#### 步骤 3：在 VitePress 中插入 Giscus
1. 新建docs/.vitepress/theme/Giscus.vue文件
```bash
<template>
  <div id="giscus_container"></div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

function renderGiscus() {
  const el = document.getElementById('giscus_container')
  if (!el) return
  // 清空容器，确保不会重复插入
  el.innerHTML = ''
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', '你的github账号/你的repo')
  script.setAttribute('data-repo-id', '你的repo-id')
  script.setAttribute('data-category', 'General')
  script.setAttribute('data-category-id', '你的category-id')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', 'light')
  script.setAttribute('data-lang', 'zh-CN')
  script.crossOrigin = 'anonymous'
  script.async = true
  el.appendChild(script)
}

onMounted(renderGiscus)

// 每次路由变化，重新渲染评论
watch(
  () => route.path,
  () => {
    renderGiscus()
  }
)
</script>
```
注意点：  
  - a页面有评论，在路由到b页面时，评论未刷新，导致评论不在对应的页面体现，所以有了watch代码，强制重新渲染评论  
2. 新建docs/.vitepress/theme/Layout.vue
```bash
<template>
  <DefaultTheme.Layout>
    <template #doc-after>
      <Giscus />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import Giscus from './Giscus.vue'
</script>
```
注意点：  
  - 需要继承默认的布局：DefaultTheme，不然会导致sidebar和样式都不生效  
     
3. 新建docs/.vitepress/theme/index.js
```bash
import Layout from './Layout.vue'

export default {
  Layout
}
```

### 4：通过nginx进行访问vitePress
1. 设置软链接
```bash
ln -s /path/to/your/project/.vitepress/dist /var/www/my-blog
```
2. 在nginx.conf中加入vitepress
```bash
  ...
        # 新增 VitePress 静态站点
        location ^~ /blog/ {
            alias /var/www/my-blog;
            try_files $uri $uri/ /blog/guide/index.html;
        }
  ...
```
3. 在your_project_path/docs/.vitepress/conf.mjs中加入base配置，与title同级
```bash
 base: "/blog/",
```

注意点：
  1. 最好设置软链接，这样会便于操作和后续维护
  2. conf.mjs配置的base要与nginx.conf中locaction配置一致，如/blog/；不然your_project_path/docs/.vitepress/dist/asset中的资源获取不到
  3. 在nginx.conf中需要把location /blog/配置在location /前面，这样优先级高于location /；这是因为 Nginx 的 location 匹配机制。在你的配置中，location / 比 location /blog/ 优先级高，但如果 /blog/ 的匹配或静态文件找不到时，会fallback到 /，会路由到别的服务
  4. 因为nginx启动用的账户是nobody，而vitepress用的是root账户启动的，所以在nginx errror log会看到premission问题，最好是相同的用户启动相关服务；因为特殊缘故，不能随意启动nginx，所以通过chmod修改了vitepress相关目录的访问权限

## 🔍 常见问题
**问题1： sideBar不展示**  

解决方案：config.js的路径应该放在your_project_path/docs/.vitepress目录下，而不是放在docs/config.js
```js
export default {
  title: "Docker VitePress Blog",
  description: "基于 Docker 的个人博客",
  markdown: { mermaid: true },
  themeConfig: {
    nav: [
      { text: '首页', link: '/guide/' },
      { text: 'syc', link: '/guide/syc' }
    ],
    sidebar: {
    '/guide/': [
      { text: '首页', link: '/guide/' },
      { text: 'syc', link: '/guide/syc' }
    ]
  }
  }
}
```
***

**问题2： vitepress v1.6.3内置mermaid识别不了mermaid**  

解决方案：这个问题经过多轮分析，大概是与操作系统有关，所以采取了手动安装mermaid插件进行渲染mermaid的方式解决，还可以用前端渲染mermaid,在theme目录下手动创建mermaid.vue文件进行解析，
该方法太繁琐，所以采取使用安装vitepress-plugin-mermaid方式
```bash
# 1. 将your_project_path/docs/.vitepress/conf.js改为将your_project_path/docs/.vitepress/conf.mjs，使用ESM语法
mv conf.js conf.mjs

# 2. 安装vitepress-plugin-mermaid 插件
npm install vitepress-plugin-mermaid mermaid
```
your_project_path/docs/.vitepress/conf.mjs
```mjs
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    base: "/blog/",
    title: "CimaStone's Blog",
    description: "基于 Docker 的个人博客",
    themeConfig: {
      nav: [
        { text: '首页', link: '/guide/' },
        { text: 'Redisson分布式锁+本地缓存', link: '/guide/redisson-distributed-lock' }
      ],
      sidebar: [
        { text: '首页', link: '/guide/' },
        { text: 'Redisson分布式锁+本地缓存', link: '/guide/redisson-distributed-lock' }
      ]
    }
    // 这里不用再写 markdown: { mermaid: true }，由插件接管
    // 如需自定义 Mermaid 选项，可在下方添加（可选）：
    // mermaid: { theme: "dark", ... }
  })
)
```
注意点
1. 使用withMermaid，而不是mermaidPlugin
2. 可以对mermaid配置相关的参数
   
通过以上方式及能正常访问mermaid语法
