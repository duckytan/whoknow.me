#!/usr/bin/env node
/**
 * Vercel 构建脚本
 * 产出目录：dist/
 * 内容：根门面（index.html / index1.html / styles / js / data） + whoknow-waimai 构建产物（dist/waimai）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = __dirname;
const outDir = path.join(root, 'dist');

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

function copyToDist(src, dest = src) {
  const srcPath = path.join(root, src);
  const destPath = path.join(outDir, dest);
  if (!fs.existsSync(srcPath)) {
    console.warn(`[build] skip missing: ${src}`);
    return;
  }
  fs.cpSync(srcPath, destPath, { recursive: true });
  console.log(`[build] copied ${src} -> ${dest}`);
}

// 1. 门面静态资源
['index.html', 'index1.html', 'styles', 'js', 'data'].forEach((item) => copyToDist(item));

// 2. 构建胡闹外卖 app
const appDir = path.join(root, 'whoknow-waimai');
console.log('[build] installing whoknow-waimai dependencies...');
execSync('npm install', { cwd: appDir, stdio: 'inherit' });
console.log('[build] building whoknow-waimai...');
execSync('npm run build', { cwd: appDir, stdio: 'inherit' });

// 3. 把 app 产物放到 dist/waimai/
const appDist = path.join(appDir, 'dist');
const appOut = path.join(outDir, 'waimai');
fs.cpSync(appDist, appOut, { recursive: true });
console.log('[build] copied whoknow-waimai/dist -> dist/waimai');

console.log('[build] done. output:', outDir);
