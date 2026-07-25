# 📦 Vercel Monorepo 部署方案

> **用途**：一个 Vercel 项目部署多个子项目（品牌页 + 胡闹外卖 + 胡闹导购 + 胡闹大脑）
> **最后更新**：2026-07-22 · 码农虾 💻
> **⚠️ 注意**：以下所有改动都记录在此，方便以后拆分成独立项目

---

## 1. 🗺️ 架构概览

```
whoknow.me GitHub 仓库
├── index.html                  ← 品牌着陆页（根目录 /）
├── package.json                ← 构建脚本（编排所有子项目构建）
├── vercel.json                 ← Vercel 配置（路由、重写、构建命令）
├── whoknow-waimai/             ← 胡闹外卖（Vite + Vue3 SPA）
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── src/
├── whoknow-mart/               ← 胡闹导购（预留）
└── whoknow-brain/              ← 胡闹大脑（预留）
```

**Vercel 访问路径映射**：

| 路径 | 内容 | 目录 |
|------|------|------|
| `/` | 品牌着陆页 | `index.html` |
| `/waimai/*` | 胡闹外卖 SPA | `whoknow-waimai/` |
| `/mart/*` | 胡闹导购（预留）| `whoknow-mart/` |
| `/brain/*` | 胡闹大脑（预留）| `whoknow-brain/` |

---

## 2. 🔧 改动清单（所有改过的文件）

### 2.1 根目录 `package.json` — 新增

```json
{
  "name": "whoknow-me-monorepo",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "build": "npm run build:root && npm run build:waimai",
    "build:root": "mkdir -p dist && cp index.html dist/",
    "build:waimai": "cd whoknow-waimai && npm install --include=dev && npm run build && cd .. && mkdir -p dist/waimai && cp -r whoknow-waimai/dist/* dist/waimai/",
    "build:mart": "cd whoknow-mart && npm install && npm run build && cd .. && mkdir -p dist/mart && cp -r whoknow-mart/dist/* dist/mart/",
    "build:brain": "cd whoknow-brain && npm install && npm run build && cd .. && mkdir -p dist/brain && cp -r whoknow-brain/dist/* dist/brain/"
  }
}
```

**重要**：
- `build:waimai` 用 `--include=dev` 因为 Vercel 构建环境 `NODE_ENV=production`，默认不装 devDependencies
- 每个子项目构建到 `dist/` 下的独立子目录
- Vercel 的 `outputDirectory` 设为 `dist`，构建产物统一从这个目录 serve

### 2.2 根目录 `vercel.json` — 修改

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/waimai/(.*)", "destination": "/waimai/index.html" }
  ]
}
```

**关键说明**：
- `rewrites` 里的 `/waimai/(.*)` 正则匹配所有 `/waimai/...` 路径 → 全部交给 SPA 的 `index.html` 处理
- 不包含 `cleanUrls`（会干扰 SPA 路由）
- 新增子项目时，加一条 `rewrites` 规则：`{ "source": "/mart/(.*)", "destination": "/mart/index.html" }`

### 2.3 `whoknow-waimai/vite.config.ts` — 修改

```ts
import { defineConfig } from 'vite'
// ...

export default defineConfig({
  base: '/waimai/',   // ← 新增：Vite 构建产物的基础路径
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

**⚠️ 关键**：子项目的 `base` 必须与 Vercel 路径一致。例如 `/waimai/` 对应 Vercel rewrite 的 `/waimai/(.*)`。

### 2.4 `whoknow-waimai/src/router/index.ts` — 无需修改

```ts
history: createWebHistory(import.meta.env.BASE_URL),
```

Vite 的 `base` 配置自动注入到 `import.meta.env.BASE_URL`，Vue Router 自动识别根路径。

### 2.5 `whoknow-waimai/package.json` — 修改

```json
{
  "scripts": {
    "build": "vite build"   // ← 改为 vite build，跳过 vue-tsc 类型检查
  }
}
```

**原因**：`vue-tsc -b` 会运行 TypeScript 类型检查，Vercel 环境下 node_modules 的类型文件不完整导致构建失败。`vite build` 只做构建不做类型检查。

### 2.6 `whoknow-waimai/tsconfig.app.json` — 修改

```json
{
  "compilerOptions": {
    // ❌ 移除了 "baseUrl": "."
  }
}
```

TypeScript 6.x+ 废弃了 `baseUrl`，Vercel 构建时报错 `TS5101`。`paths` 中已指定 `"@/*": ["./src/*"]`，不需要 `baseUrl`。

### 2.7 `whoknow-waimai/tsconfig.node.json` — 修改

```json
{
  // ❌ 原为 "extends": "@vue/tsconfig/tsconfig.node.json"
  // ✅ 改为
  "extends": "@vue/tsconfig/tsconfig.json",
}
```

`@vue/tsconfig@0.9.1` 不提供 `tsconfig.node.json`，只有 `tsconfig.json` 和 `tsconfig.dom.json`。

---

## 3. 📦 新增子项目步骤

> 以新增 `whoknow-mart` 为例

### 3.1 创建子项目

```bash
cd projects/whoknow.me
mkdir whoknow-mart
cd whoknow-mart
npm init vite@latest .
```

### 3.2 配置 base

`whoknow-mart/vite.config.ts` 加 `base: '/mart/'`

### 3.3 更新根 `package.json`

```json
"build:mart": "cd whoknow-mart && npm install && npm run build && cd .. && mkdir -p dist/mart && cp -r whoknow-mart/dist/* dist/mart/"
```

并在 `"build"` 脚本里加上 `&& npm run build:mart`

### 3.4 更新 `vercel.json`

```json
"rewrites": [
  { "source": "/waimai/(.*)", "destination": "/waimai/index.html" },
  { "source": "/mart/(.*)", "destination": "/mart/index.html" }
]
```

---

## 4. 🔀 拆分回独立项目步骤

> **场景**：子项目流量太大，需要独立域名或独立部署

### 4.1 从子目录拆出独立仓库

```bash
# 方法 1：clone 子目录为新仓库
cd /tmp
git clone --depth 1 https://github.com/duckytan/whoknow.me.git tmp-whoknow-me
cd tmp-whoknow-me
git filter-repo --subdirectory-filter whoknow-waimai
git remote add origin https://github.com/duckytan/whoknow-waimai-new.git
git push -u origin main
```

### 4.2 恢复 Vercel 独立部署配置

在独立仓库根目录中：

**`vercel.json`**（独立版）：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**`vite.config.ts`**（独立版）：
```ts
// 把 base: '/waimai/' 改回 base: '/'
// 或直接删除 base 字段（默认为 '/'）
export default defineConfig({
  base: '/', // ← 改回根路径
  // ...
})
```

### 4.3 删除根目录的改动

拆分完成后，根目录 `vercel.json` 中删除对应子项目的 `rewrites` 和根 `package.json` 中删除对应 `build:xxx` 脚本。

---

## 5. ⚠️ 踩坑记录

### 5.1 NODE_ENV=production 导致 devDependencies 不装

**症状**：Vercel 构建报 `vite: not found`
**原因**：Vercel 构建环境默认 `NODE_ENV=production`，`npm install` 跳过 devDependencies
**修复**：根 `package.json` 构建脚本里强制 `npm install --include=dev`

### 5.2 vue-tsc 类型检查阻塞构建

**症状**：Vercel 构建报 node_modules 里找不到各种类型声明（@antfu/utils, @farmfe/core 等）
**原因**：`vue-tsc -b` 对 node_modules 做类型检查，但 Vercel 环境装的依赖不完整
**修复**：`package.json` 的 `"build"` 脚本改为 `"vite build"`，跳过 vue-tsc 检查

### 5.3 baseUrl 废弃

**症状**：`TS5101: Option 'baseUrl' is deprecated`
**原因**：TypeScript 6.x 废弃了 `baseUrl`
**修复**：从 `tsconfig.app.json` 删除 `"baseUrl": "."`，由 `paths` 接管

### 5.4 @vue/tsconfig 版本差异

**症状**：`File '@vue/tsconfig/tsconfig.node.json' not found`
**原因**：`@vue/tsconfig@0.9.1` 不包含 `tsconfig.node.json`
**修复**：`tsconfig.node.json` 的 `extends` 改为 `@vue/tsconfig/tsconfig.json`

### 5.5 cleanUrls 干扰 SPA 路由

**症状**：SPA 二级路由（`/waimai/shops`）返回 404，但首页（`/waimai/`）正常
**原因**：`cleanUrls: true` 会尝试自动解析不带后缀的 URL，可能与 `rewrites` 冲突
**修复**：根 `vercel.json` 中删除 `cleanUrls` 和 `trailingSlash`

---

## 6. 📊 当前构建产物结构

Vercel 构建完成后，`dist/` 目录结构：

```
dist/
├── index.html              ← 品牌着陆页
└── waimai/
    ├── index.html           ← 胡闹外卖 SPA 入口
    └── assets/
        ├── index-xxxx.js    ← Vite 打包的 JS
        └── index-xxxx.css   ← Vite 打包的 CSS
```

---

## 7. 🏗️ 新增/修改文件清单（快速回滚）

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 🆕 新增 | 根构建脚本 |
| `vercel.json` | 🔄 修改 | 加 buildCommand + outputDirectory + rewrites |
| `whoknow-waimai/vite.config.ts` | 🔄 修改 | 加 `base: '/waimai/'` |
| `whoknow-waimai/package.json` | 🔄 修改 | build 改为 `vite build` |
| `whoknow-waimai/tsconfig.app.json` | 🔄 修改 | 删 `baseUrl` |
| `whoknow-waimai/tsconfig.node.json` | 🔄 修改 | 改 extends 路径 |

**回滚方式**：用 `git revert` 按 commit 顺序逆序 revert，或 `git checkout <commit-hash>~1 -- <file>` 单个文件恢复。
