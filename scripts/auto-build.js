#!/usr/bin/env node

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

console.log('🚀 启动VitePress自动构建监听器...');
console.log('📁 监听目录: docs/guide/');
console.log('📝 监听文件: *.md');
console.log('⚡ 文件变化时将自动重新构建\n');

let isBuilding = false;
let buildQueue = false;

// 构建函数
function build() {
  if (isBuilding) {
    buildQueue = true;
    return;
  }
  
  isBuilding = true;
  const startTime = Date.now();
  
  console.log('🔄 检测到文件变化，开始构建...');
  
  exec('npx vitepress build docs', (error, stdout, stderr) => {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (error) {
      console.error('❌ 构建失败:', error.message);
      console.error(stderr);
    } else {
      console.log(`✅ 构建成功! 耗时: ${duration}s`);
      console.log('📄 已生成静态文件到: docs/.vitepress/dist/');
    }
    
    isBuilding = false;
    
    // 如果构建期间有新的变化，再次构建
    if (buildQueue) {
      buildQueue = false;
      setTimeout(build, 500); // 防抖，500ms后执行
    }
    
    console.log('👀 继续监听文件变化...\n');
  });
}

// 监听文件变化
const watcher = chokidar.watch('docs/guide/**/*.md', {
  ignored: /[\/\\]\./, // 忽略隐藏文件
  persistent: true,
  ignoreInitial: true
});

// 防抖函数
let timeout;
function debouncedBuild() {
  clearTimeout(timeout);
  timeout = setTimeout(build, 1000); // 1秒内的多次变化只触发一次构建
}

watcher
  .on('add', path => {
    console.log(`📄 新增文件: ${path}`);
    debouncedBuild();
  })
  .on('change', path => {
    console.log(`📝 修改文件: ${path}`);
    debouncedBuild();
  })
  .on('unlink', path => {
    console.log(`🗑️  删除文件: ${path}`);
    debouncedBuild();
  })
  .on('error', error => {
    console.error('❌ 监听器错误:', error);
  });

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🛑 停止监听器...');
  watcher.close();
  process.exit(0);
});

// 初始构建
console.log('🏗️  执行初始构建...');
build();
