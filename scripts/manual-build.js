#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

console.log('🔨 手动触发VitePress构建...');

const startTime = Date.now();

exec('npx vitepress build docs', (error, stdout, stderr) => {
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  if (error) {
    console.error('❌ 构建失败:', error.message);
    console.error(stderr);
    process.exit(1);
  } else {
    console.log(`✅ 手动构建成功! 耗时: ${duration}s`);
    console.log('📄 已生成静态文件到: docs/.vitepress/dist/');
    
    // 如果监听器在运行，创建触发文件通知它
    if (!fs.existsSync('.build-trigger')) {
      fs.writeFileSync('.build-trigger', '');
      console.log('📡 已通知监听器更新缓存');
    }
  }
});