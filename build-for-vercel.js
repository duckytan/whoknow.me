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

// 4. 构建胡闹导购 app（不破坏 waimai 产物，L1-T5 精神延伸：mart 不劫持 waimai 构建）
const martDir = path.join(root, 'whoknow-mart');
if (fs.existsSync(martDir)) {
  console.log('[build] installing whoknow-mart dependencies...');
  execSync('npm install', { cwd: martDir, stdio: 'inherit' });
  console.log('[build] building whoknow-mart...');
  execSync('npm run build', { cwd: martDir, stdio: 'inherit' });
  const martDist = path.join(martDir, 'dist');
  const martOut = path.join(outDir, 'mart');
  fs.cpSync(martDist, martOut, { recursive: true });
  console.log('[build] copied whoknow-mart/dist -> dist/mart');
} else {
  console.warn('[build] skip whoknow-mart: 目录不存在');
}

console.log('[build] done. output:', outDir);
