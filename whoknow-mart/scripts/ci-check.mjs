#!/usr/bin/env node
/**
 * ci-check.mjs — Phase 4 门禁（不破坏 whoknow-waimai，L1-T5 红线）
 *
 * 关卡：
 *  1) L1-T5 红线：变更集不得触碰 whoknow-waimai/（本地 git diff 扫描，非 git 环境跳过）
 *  2) forbiddenCheck 双份一致：mart 与 waimai forbiddenCheck.ts 须逐字同源（ADR-003）
 *  3) 三大否决项单测（node --test，全绿）
 *  4) vue-tsc 类型门 + vite PWA 构建
 */

import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const martDir = path.join(root, 'whoknow-mart')
let failed = false

function step(name, fn) {
  try {
    fn()
    console.log(`✅ ${name}`)
  } catch (e) {
    failed = true
    console.error(`❌ ${name}\n   ${e && e.message ? e.message : e}`)
  }
}

// 1) L1-T5 红线（本地 git diff 扫描）
step('L1-T5 红线（不触碰 whoknow-waimai）', () => {
  try {
    const diff = execSync('git diff --name-only HEAD', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const touched = diff
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const bad = touched.filter((f) => f.startsWith('whoknow-waimai/'))
    if (bad.length > 0) {
      throw new Error(`变更集触碰 whoknow-waimai/: ${bad.join(', ')}`)
    }
  } catch (e) {
    if (e && e.message && e.message.includes('whoknow-waimai')) throw e
    console.warn('   (非 git 环境或 git 不可用，跳过 waimai 红线扫描)')
  }
})

// 2) forbiddenCheck 双份一致（mart vs waimai，逐字同源，ADR-003）
// 归一化行尾空白后再比对：容忍编辑器差异，仍捕获解析逻辑层面的真实改动。
step('forbiddenCheck 双份一致（mart vs waimai）', () => {
  const a = path.join(martDir, 'src/core/forbiddenCheck.ts')
  const b = path.join(root, 'whoknow-waimai/src/core/forbiddenCheck.ts')
  if (!existsSync(a) || !existsSync(b)) throw new Error('缺少 forbiddenCheck.ts')
  const norm = (s) => s.split('\n').map((l) => l.trimEnd()).join('\n').trim()
  const ca = norm(readFileSync(a, 'utf8'))
  const cb = norm(readFileSync(b, 'utf8'))
  if (ca !== cb) {
    throw new Error('mart 与 waimai forbiddenCheck.ts 逻辑不一致（须逐字同源，ADR-003）')
  }
})

// 3) 三大否决项单测
step('三大否决项单测（node --test）', () => {
  execSync('npm test', { cwd: martDir, stdio: 'inherit' })
})

// 4) vue-tsc 类型门 + vite 构建（含 PWA 生成）
step('vue-tsc 类型门 + vite 构建', () => {
  execSync('npm run build', { cwd: martDir, stdio: 'inherit' })
})

if (failed) {
  console.error('\n🔴 CI 门禁失败')
  process.exit(1)
}
console.log('\n✅ CI 门禁全部通过')
