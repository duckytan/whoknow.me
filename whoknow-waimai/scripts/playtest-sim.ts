// playtest-sim.ts — 自动 playtest 仿真器（Phase 7 硬闸门 · 代码级代理）
// 蒙特卡洛模拟「典型用户会话」，量化：
//   H1 重复疲劳：12 单会话内撞同一完整台词链的概率
//   H2 基线多样性：4 条 isFallback 基线分支的命中分布
//   H3 覆盖：所有 28 分支是否可达（防死分支回归）
//   P3 概率平衡：各分支命中率，标记饥饿分支
// 运行: node --experimental-strip-types scripts/playtest-sim.ts

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runDrama } from '../src/engine/dramaEngine.ts'
import { loadSeedBranches } from '../src/config/loader.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const seedPath = join(root, 'docs/specs/DRAMA-SEED-v1-2026-07-24.json')
const branches = loadSeedBranches(JSON.parse(readFileSync(seedPath, 'utf8')))
const ALL_IDS = branches.map((b) => b.id)

// ---- seeded RNG (mulberry32) 保证可复现 ----
function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = (Math.imul(a ^ (a >>> 15), 1 | a))
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(20260725)
const rnd = () => rng()

const SHOPS = ['s01', 's02', 's03', 's04', 's05']
const RIDERS = ['r001', 'r002', 'r003']
const REMARKS = [null, null, null, null, null, 'odd', 'more_spicy', 'no_scold', 'blacklist']
const ADDR = [null, null, null, null, null, null, 'weird']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]
}
function genOrderTotal(): number {
  const u = rnd()
  if (u < 0.12) return Math.floor(5 + rnd() * 14) // 5-18 (<20 穷鬼)
  if (u > 0.97) return Math.floor(300 + rnd() * 400) // 300-700 (破产)
  return Math.floor(20 + rnd() * 70) // 20-89 常规
}

interface SimState {
  flags: string[]
  shopVisit: Record<string, number>
  today: number
  total: number
}

function runSession(state: SimState) {
  const hit = new Set<string>()
  const chainSig = new Set<string>()
  const branchCount: Record<string, number> = {}
  let dupCount = 0
  const n = 12
  for (let i = 0; i < n; i++) {
    const shopId = pick(SHOPS)
    state.shopVisit[shopId] = (state.shopVisit[shopId] ?? 0) + 1
    const riderId = pick(RIDERS)
    const orderTotal = genOrderTotal()
    const avgDishPrice = 5 + rnd() * 40
    const dishCount = 1 + Math.floor(rnd() * 4)
    const remarkTag = pick(REMARKS)
    const addressTag = pick(ADDR)
    const deliveryFee = 2 + rnd() * 6
    const todayOrderCount = state.today + 1
    const shopVisitCount = state.shopVisit[shopId]
    const extraFlags: string[] = []
    if (rnd() < 0.05) extraFlags.push(`married_${riderId}`)
    if (rnd() < 0.05) extraFlags.push(`blacklisted_${shopId}`)
    if (rnd() < 0.05) extraFlags.push(`odd_eats_${shopId}`)
    const flags = [...state.flags, ...extraFlags]
    const input: any = {
      orderTotal, avgDishPrice, dishCount, remarkTag, addressTag,
      shopId, riderId, deliveryFee, todayOrderCount,
    }
    const res: any = runDrama(branches, input, {
      random: rnd,
      history: { shopVisitCount, todayOrderCount },
      flags,
    })
    if (res.selectedBranchId) {
      hit.add(res.selectedBranchId)
      branchCount[res.selectedBranchId] = (branchCount[res.selectedBranchId] ?? 0) + 1
    }
    const sig = (res.events || []).map((e: any) => e.text).join('|')
    if (chainSig.has(sig)) dupCount++
    chainSig.add(sig)
    for (const f of res.newFlags) if (!state.flags.includes(f)) state.flags.push(f)
    state.today = todayOrderCount
    state.total++
  }
  const maxRepeat = Math.max(0, ...Object.values(branchCount))
  return { hit, dupCount, chains: chainSig.size, maxRepeat }
}

// ===== 1) 会话级蒙特卡洛 =====
const SESSIONS = 1500
const hitCount: Record<string, number> = {}
for (const id of ALL_IDS) hitCount[id] = 0
let sessionsWithDup = 0
let totalDups = 0
let totalChainsSeen = 0
let sumDistinct = 0
let repeat3 = 0
let globalChains = new Set<string>()

for (let s = 0; s < SESSIONS; s++) {
  const st: SimState = { flags: [], shopVisit: {}, today: 0, total: 0 }
  const r = runSession(st)
  for (const id of r.hit) hitCount[id]++
  if (r.dupCount > 0) sessionsWithDup++
  totalDups += r.dupCount
  totalChainsSeen += r.chains
  sumDistinct += r.chains
  if (r.maxRepeat >= 3) repeat3++
  // 重新跑一次收集全局 chain 签名（粗略：再跑一会话不经济，跳过全局精确集）
}

const totalOrders = SESSIONS * 12
const STARVE = 0.002 // <0.2% 命中视为饥饿

// ===== 2) 基线池多样性（纯普通单，排除专属分支干扰）=====
const baselineIds = branches.filter((b) => b.isFallback).map((b) => b.id)
const baselineHit: Record<string, number> = {}
for (const id of baselineIds) baselineHit[id] = 0
const BASE_N = 3000
for (let i = 0; i < BASE_N; i++) {
  const shopId = pick(SHOPS)
  const riderId = pick(RIDERS)
  const input: any = { orderTotal: 50, avgDishPrice: 99, shopId, riderId }
  const res: any = runDrama(branches, input, {
    random: rnd,
    history: { shopVisitCount: 0, todayOrderCount: 1 },
    flags: [],
  })
  if (res.selectedBranchId && baselineHit[res.selectedBranchId] !== undefined) {
    baselineHit[res.selectedBranchId]++
  }
}

// ===== 3) 覆盖校验 =====
const covered = new Set<string>()
for (const id of ALL_IDS) if (hitCount[id] > 0) covered.add(id)
const dead = ALL_IDS.filter((id) => !covered.has(id))

// ===== 报告 =====
let md = '# 自动 Playtest 仿真报告\n\n'
md += `- 生成时间：2026-07-25（种子 20260725，可复现）\n`
md += `- 会话数：${SESSIONS}（每会话 12 单，共 ${totalOrders} 单）\n`
md += `- 基线池采样：${BASE_N} 单纯普通单\n\n`

md += '## H1 重复疲劳（12 单会话）\n'
md += `- 出现 ≥1 次「完整台词链撞车」的会话占比：**${(sessionsWithDup / SESSIONS * 100).toFixed(1)}%**\n`
md += `- 平均每次会话撞车次数：**${(totalDups / SESSIONS).toFixed(2)}**\n`
md += `- 平均每次会话「不同台词链数」：**${(sumDistinct / SESSIONS).toFixed(1)}** / 12\n`
md += `- 出现「单分支重复 ≥3 次」的会话占比：**${(repeat3 / SESSIONS * 100).toFixed(1)}%**\n`
md += `- 判据（见 PLAYTEST-CHECKLIST）：不同台词链均值 ≥ 9 且 单分支≥3次会话占比 < 25% 视为代码级通过（真笑率仍需真人 H1）\n\n`

md += '## H2 基线变体池多样性（isFallback 分支）\n'
md += '| 分支 | 命中 | 占比 |\n|---|---|---|\n'
for (const id of baselineIds) {
  md += `| ${id} | ${baselineHit[id]} | ${(baselineHit[id] / BASE_N * 100).toFixed(1)}% |\n`
}
md += `- 4 条基线全部出现 = 抗撞句生效；期望接近权重比 1:3:3:3\n\n`

md += '## H3 分支覆盖（防死分支）\n'
md += `- 可达分支：${covered.size}/${ALL_IDS.length}\n`
md += `- 死分支（0 命中）：${dead.length === 0 ? '无 ✅' : dead.join(', ') + ' ❌'}\n\n`

md += '## P3 概率平衡 · 各分支命中率\n'
md += '| 分支 | 命中 | 命中率 | 标记 |\n|---|---|---|---|\n'
for (const id of ALL_IDS) {
  const rate = hitCount[id] / totalOrders
  let tag = ''
  if (rate < STARVE) tag = '⚠️ 饥饿'
  md += `| ${id} | ${hitCount[id]} | ${(rate * 100).toFixed(2)}% | ${tag} |\n`
}

const reportPath = join(root, 'docs/PLAYTEST-SIM-2026-07-25.md')
writeFileSync(reportPath, md, 'utf8')

console.log(md)
console.log(`\n报告已写入：${reportPath}`)
