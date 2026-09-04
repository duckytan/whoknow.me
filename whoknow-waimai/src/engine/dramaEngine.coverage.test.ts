// dramaEngine.coverage.test.ts — 死分支守卫（Phase 6 打磨回归）
// 以「500 个独立会话 × 12 单」蒙特卡洛，断言 SEED 每个分支都至少命中一次。
// 每会话重置 flag / 同店计数，模拟「多用户探针」而非「单用户长跑」——
// 后者会让老用户 flag 无限累积、把基线兜底饿死（现实中老用户本就少见基线）。
// 固定种子，保证可复现、非 flaky。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runDrama } from './dramaEngine.ts'
import { loadSeedBranches } from '../config/loader.ts'

const here = dirname(fileURLToPath(import.meta.url))
const seed = loadSeedBranches(
  JSON.parse(readFileSync(join(here, '../../docs/specs/DRAMA-SEED-v1-2026-07-24.json'), 'utf8'))
)
const ALL_IDS = seed.map((b) => b.id)

const SHOPS = ['s01', 's02', 's03', 's04', 's05']
const RIDERS = ['r001', 'r002', 'r003']
const REMARKS = [undefined, undefined, undefined, undefined, undefined, 'odd', 'more_spicy', 'no_scold', 'blacklist']
const ADDR = [undefined, undefined, undefined, undefined, undefined, undefined, 'weird']

let s = 123456789
const rnd = () => {
  s = (s + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)]
const total = () => (rnd() < 0.12 ? 5 + Math.floor(rnd() * 14) : rnd() > 0.97 ? 300 + Math.floor(rnd() * 400) : 20 + Math.floor(rnd() * 70))

const NEW_IDS = [
  'regular_2nd',
  'shop_s01_loyal', 'shop_s02_loyal', 'shop_s03_loyal', 'shop_s04_loyal', 'shop_s05_loyal',
  'vip_roast',
  'rider_r001_recog', 'rider_r002_recog', 'rider_r003_recog',
  'shop_s01_roast', 'shop_s02_roast', 'shop_s03_roast', 'shop_s04_roast', 'shop_s05_roast',
  'default_i', 'default_j', 'default_k',
]

test('COV 全部 58 分支在会话模拟中皆可达（无死分支，含 B 档新增）', () => {
  const hit = new Set<string>()
  const SESSIONS = 2000 // 24000 单：确保稀有/低权分支稳定覆盖，消除统计 flaky
  for (let ss = 0; ss < SESSIONS; ss++) {
    let flags: string[] = []
    const riderVisit: Record<string, number> = {}
    for (let i = 0; i < 12; i++) {
      const shopId = pick(SHOPS)
      const riderId = pick(RIDERS)
      riderVisit[riderId] = (riderVisit[riderId] ?? 0) + 1
      const extra: string[] = []
      if (rnd() < 0.08) extra.push(`married_${riderId}`)
      if (rnd() < 0.08) extra.push(`blacklisted_${shopId}`)
      if (rnd() < 0.08) extra.push(`odd_eats_${shopId}`)
      const toc = 1 + Math.floor(rnd() * 4) // 真实单日下单量 1-4
      const svc = 1 + Math.floor(rnd() * 10) // 1..10：覆盖 shop_s0X_roast / vip_roast 的 >=8 阈值
      const input: any = {
        orderTotal: total(), avgDishPrice: 5 + rnd() * 40, dishCount: 1 + Math.floor(rnd() * 4),
        remarkTag: pick(REMARKS), addressTag: pick(ADDR), shopId, riderId, deliveryFee: 2 + rnd() * 6,
        todayOrderCount: toc,
      }
      const res: any = runDrama(seed as any, input, {
        random: rnd,
        history: { shopVisitCount: svc, todayOrderCount: toc, riderVisitCount: riderVisit[riderId] },
        flags: [...flags, ...extra],
      })
      if (res.selectedBranchId) hit.add(res.selectedBranchId)
      for (const f of res.newFlags) if (!flags.includes(f)) flags.push(f)
    }
  }
  // 覆盖保障：纯基线单（无 shopId / riderId / 特殊变量）→ 仅 isFallback 入池，
  // 保证 11 条基线变体（含权重最低的 default 及新增 default_i/j/k）稳定命中，消除 flaky 死分支
  for (let i = 0; i < 800; i++) {
    const res: any = runDrama(seed as any,
      { orderTotal: 50, avgDishPrice: 99 } as any,
      { random: rnd, history: { shopVisitCount: 1, todayOrderCount: 1 }, flags: [] })
    if (res.selectedBranchId) hit.add(res.selectedBranchId)
  }
  const dead = ALL_IDS.filter((id) => !hit.has(id))
  assert.deepEqual(dead, [], `以下分支 0 命中（疑似死分支）: ${dead.join(', ')}`)
  assert.equal(hit.size, ALL_IDS.length, `命中 ${hit.size}/${ALL_IDS.length}`)
  for (const id of NEW_IDS) {
    assert.ok(hit.has(id), `B 档新增分支未覆盖（死分支）: ${id}`)
  }
})

// 非死链校验：vip_roast 必须能读到 vip_{shopId} 孤儿 flag（修复 setter→reader 闭环）
test('COV 非死链：vip_roast 经 flag(vip_{shopId}) 可达（孤儿 flag 闭环）', () => {
  const r = runDrama(seed as any,
    { shopId: 's01', orderTotal: 50, avgDishPrice: 99 } as any,
    { random: () => 0.7, history: { shopVisitCount: 3, todayOrderCount: 1 }, flags: ['vip_s01'] } as any)
  assert.equal(r.selectedBranchId, 'vip_roast')
  assert.ok(r.events.some((e) => e.text.includes('包浆')))
})

// 非死链校验：rider_r00X_recog 经派生命名参数 riderVisitCount>=2 可达
test('COV 非死链：rider_r001_recog 经 riderVisitCount>=2 可达', () => {
  const r = runDrama(seed as any,
    { riderId: 'r001', orderTotal: 50, avgDishPrice: 99 } as any,
    { random: () => 0.6, history: { riderVisitCount: 2 }, flags: [] } as any)
  assert.equal(r.selectedBranchId, 'rider_r001_recog')
})
