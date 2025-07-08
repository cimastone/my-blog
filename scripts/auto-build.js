#!/usr/bin/env node

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 启动VitePress自动构建监听器...');
console.log('📁 监听目录: docs/guide/');
console.log('📝 监听文件: *.md');
console.log('⚡ 文件变化时将自动重新构建');
console.log('🔄 支持git pull检测和手动触发\n');

let isBuilding = false;
let buildQueue = false;
let lastBuildTime = Date.now();
let fileHashes = new Map(); // 文件内容哈希缓存

// 构建函数
function build(reason = '文件变化') {
  if (isBuilding) {
    buildQueue = true;
    return;
  }
  
  isBuilding = true;
  lastBuildTime = Date.now();
  const startTime = Date.now();
  
  console.log(`🔄 检测到${reason}，开始构建...`);
  
  exec('npx vitepress build docs', (error, stdout, stderr) => {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (error) {
      console.error('❌ 构建失败:', error.message);
      console.error(stderr);
    } else {
      console.log(`✅ 构建成功! 耗时: ${duration}s`);
      console.log('📄 已生成静态文件到: docs/.vitepress/dist/');
      updateFileHashes(); // 更新文件哈希缓存
    }
    
    isBuilding = false;
    
    // 如果构建期间有新的变化，再次构建
    if (buildQueue) {
      buildQueue = false;
      setTimeout(() => build('队列构建'), 500);
    }
    
    console.log('👀 继续监听文件变化...\n');
  });
}

// 计算文件哈希
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

// 更新文件哈希缓存
function updateFileHashes() {
  const glob = require('glob');
  const files = glob.sync('docs/guide/**/*.md');
  files.forEach(file => {
    const hash = getFileHash(file);
    if (hash) {
      fileHashes.set(file, hash);
    }
  });
}

// 检查文件是否真的变化了
function hasFileChanged(filePath) {
  const currentHash = getFileHash(filePath);
  const cachedHash = fileHashes.get(filePath);
  
  if (!currentHash) return false;
  if (!cachedHash) return true; // 新文件
  
  return currentHash !== cachedHash;
}

// 轮询检查（用于git pull检测）
function pollForChanges() {
  const glob = require('glob');
  const files = glob.sync('docs/guide/**/*.md');
  let hasChanges = false;
  
  files.forEach(file => {
    if (hasFileChanged(file)) {
      console.log(`🔍 轮询检测到变化: ${file}`);
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    debouncedBuild('轮询检测');
  }
}

// 手动触发文件（用于手动构建）
const triggerFile = '.build-trigger';
function createTriggerMechanism() {
  // 监听触发文件
  if (fs.existsSync(triggerFile)) {
    fs.unlinkSync(triggerFile);
  }
  
  const triggerWatcher = chokidar.watch(triggerFile, {
    ignoreInitial: false
  });
  
  triggerWatcher.on('add', () => {
    console.log('🎯 检测到手动触发信号');
    build('手动触发');
    // 删除触发文件
    if (fs.existsSync(triggerFile)) {
      fs.unlinkSync(triggerFile);
    }
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
function debouncedBuild(reason = '文件变化') {
  clearTimeout(timeout);
  timeout = setTimeout(() => build(reason), 1000); // 1秒内的多次变化只触发一次构建
}

watcher
  .on('add', path => {
    console.log(`📄 新增文件: ${path}`);
    debouncedBuild('新增文件');
  })
  .on('change', path => {
    console.log(`📝 修改文件: ${path}`);
    if (hasFileChanged(path)) {
      debouncedBuild('文件内容变化');
    } else {
      console.log(`⏭️  文件时间戳变化但内容未变: ${path}`);
    }
  })
  .on('unlink', path => {
    console.log(`🗑️  删除文件: ${path}`);
    fileHashes.delete(path); // 清理缓存
    debouncedBuild('删除文件');
  })
  .on('error', error => {
    console.error('❌ 监听器错误:', error);
  });

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🛑 停止监听器...');
  watcher.close();
  // 清理触发文件
  if (fs.existsSync(triggerFile)) {
    fs.unlinkSync(triggerFile);
  }
  process.exit(0);
});

// 启动轮询机制（每30秒检查一次，用于检测git pull）
console.log('⏰ 启动轮询机制（每30秒检查git pull变化）');
setInterval(pollForChanges, 30000); // 30秒轮询一次

// 启动手动触发机制
console.log('🎯 启动手动触发机制');
createTriggerMechanism();

// 显示使用说明
console.log('\n📖 使用说明:');
console.log('   - 文件修改会自动触发构建');
console.log('   - git pull后30秒内会自动检测');
console.log('   - 手动触发: touch .build-trigger');
console.log('   - 手动构建: npm run build');
console.log('   - 停止监听: Ctrl+C\n');

// 初始构建和缓存
console.log('🏗️  执行初始构建...');
updateFileHashes(); // 初始化文件哈希缓存
build('初始构建');