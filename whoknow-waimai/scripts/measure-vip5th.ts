// measure-vip5th.ts — 量化 H2「同店第5单差异」在真实运行时的触发率
// 严格按 CHECKLIST H2 做法：固定 s01，连点 5 单（无备注/无奇葩地址，模拟真实"老熟客连点"），
// 统计第 5 单是否命中 vip_5th，以及当它没命中时是被谁抢走的。
//
// 运行：node --experimental-strip-types scripts/measure-vip5th.ts

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runDrama } from '../src/engine/dramaEngine.ts'
import { MemoryEngine, MemStore, type HistoryParams } from '../src/store/memory.ts'
import { loadSeedBranches, type Branch } from '../src/config/loader.ts'
import { buildOrderInput } from '../src/core/orderInput.ts'
import { RIDERS } from '../src/data/shops.ts'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(777)

const root = resolve(process.cwd())
const seedRaw = JSON.parse(readFileSync(resolve(root, 'docs/specs/DRAMA-SEED-v1-2026-07-24.json'), 'utf8'))
const branches = loadSeedBranches(seedRaw)
const branchById = new Map<string, Branch>(branches.map((b) => [b.id, b]))
const B = Math.floor(rng() * RIDERS.length)

const SESSIONS = 500
let vip5thHits = 0
const stealers: Record<string, number> = {} // 第5单被谁抢走
const fifthBranches: Record<string, number> = {}

for (let s = 0; s < SESSIONS; s++) {
  const memory = new MemoryEngine(new MemStore())
  for (let k = 1; k <= 5; k++) {
    const riderId = RIDERS[Math.floor(rng() * RIDERS.length)].id
    // 老熟客连点：正常客单价，不触发 poor/cheap
    const oi = buildOrderInput({
      shopId: 's01',
      riderId,
      orderTotal: 52,
      avgDishPrice: 13,
      dishCount: 4,
      deliveryFee: 3,
    } as any)
    const sid = 's01'
    const hist: HistoryParams = memory.getHistoryParams(sid, riderId)
    hist.shopVisitCount = (hist.shopVisitCount ?? 0) + 1
    const mem = memory.getShopMemory(sid)
    const r = runDrama(branches, oi, { random: rng, history: hist, flags: mem.flags })
    const bid = r.selectedBranchId ?? '(none)'
    if (k === 5) {
      fifthBranches[bid] = (fifthBranches[bid] ?? 0) + 1
      if (bid === 'vip_5th') vip5thHits++
      else stealers[bid] = (stealers[bid] ?? 0) + 1
    }
    if (r.selectedBranchId) {
      memory.recordOrder(sid, { flags: r.newFlags, tags: r.finalState.tags })
      if (riderId) memory.recordRider(riderId)
    }
  }
}

const lines: string[] = []
lines.push(`# H2 量化：固定 s01 连点 5 单 · ${SESSIONS} 会话`)
lines.push('')
lines.push(`- vip_5th 在第 5 单命中率：**${(vip5thHits / SESSIONS * 100).toFixed(1)}%** (${vip5thHits}/${SESSIONS})`)
lines.push(`- 即：按 CHECKLIST H2 标准做法，用户只有约 ${(vip5thHits / SESSIONS * 100).toFixed(1)}% 概率在「本店第 5 单」看到隐藏 VIP 剧本。`)
lines.push('')
lines.push('## 第 5 单实际命中的分支分布（被谁抢走）')
lines.push('')
for (const [bid, n] of Object.entries(fifthBranches).sort((a, b) => b[1] - a[1])) {
  const name = branchById.get(bid)?.name ?? (bid === '(none)' ? '无' : '')
  const tag = bid === 'vip_5th' ? ' ✅ 期望' : ' ❌ 抢走'
  lines.push(`- \`${bid}\`${name ? `（${name}）` : ''}：${n} 次 (${((n / SESSIONS) * 100).toFixed(1)}%)${tag}`)
}
lines.push('')
const md = lines.join('\n')
const p = resolve(root, 'docs/playtest/MEASURE-VIP5TH-2026-07-26.md')
writeFileSync(p, md, 'utf8')
console.log(md)
console.log(`\n[已写入] ${p}`)
