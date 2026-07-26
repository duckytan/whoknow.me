// playtest-realuser.ts — 真人模拟试玩（主理人 stand-in）
// 原样复刻 OrderView.submit 的下单循环：真实 MemoryEngine + runDrama + forbiddenCheck。
// 不渲染 UI，但跑的是与线上完全一致的运行时代码，输出每单真实生成的「四阶段段子时间线」。
//
// 运行（在 whoknow-waimai/ 下）：
//   node --experimental-strip-types scripts/playtest-realuser.ts
//
// 这不是 8 名真人 tester 的 H1 正式门（那是 Phase 7 硬闸门），而是主理人代真人走一遍，
// 验证「能跑 / 好玩 / 会传播 / 红线 / 同店递进 / 成就可达」，并产出可复盘的原始时间线。

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runDrama } from '../src/engine/dramaEngine.ts'
import { MemoryEngine, MemStore, type HistoryParams } from '../src/store/memory.ts'
import { loadSeedBranches, type Branch } from '../src/config/loader.ts'
import { buildOrderInput } from '../src/core/orderInput.ts'
import { runForbiddenCheck, type TabooList } from '../src/core/forbiddenCheck.ts'
import { getShop, RIDERS } from '../src/data/shops.ts'
import { getDish } from '../src/data/dishes.ts'
import { getAchievement } from '../src/data/achievements.ts'

// ---- 可复现 RNG（mulberry32）----
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
const SEED = 20260726
const rng = mulberry32(SEED)

// ---- 加载真实 SEED + 红线词表 ----
const root = resolve(process.cwd())
const seedRaw = JSON.parse(readFileSync(resolve(root, 'docs/specs/DRAMA-SEED-v1-2026-07-24.json'), 'utf8'))
const taboo = JSON.parse(readFileSync(resolve(root, 'tests/taboo-list.json'), 'utf8')) as TabooList
const branches = loadSeedBranches(seedRaw)
const branchById = new Map<string, Branch>(branches.map((b) => [b.id, b]))

const memory = new MemoryEngine(new MemStore())

// ---- 工具 ----
function pickRider(): string {
  const i = Math.floor(rng() * RIDERS.length)
  return RIDERS[i].id
}

interface OrderIntent {
  label: string
  shopId: string
  items: Array<{ id: string; q: number }>
  remark?: string
  address?: string
}

// 一个真实吃货一天里的 12 单（不预先知道分支，只按「想吃的」和「手滑填的备注/地址」下单）
const session: OrderIntent[] = [
  { label: '第 1 单 · 第一次来老王烧烤，随便点点', shopId: 's01', items: [{ id: 's01_d1', q: 3 }, { id: 's01_d2', q: 1 }, { id: 's01_d5', q: 2 }] },
  { label: '第 2 单 · 换孔子饺子馆尝尝', shopId: 's02', items: [{ id: 's02_d1', q: 2 }, { id: 's02_d3', q: 1 }, { id: 's02_d6', q: 1 }] },
  { label: '第 3 单 · 又馋烧烤了，回老王（本店第 3 单）', shopId: 's01', items: [{ id: 's01_d1', q: 4 }, { id: 's01_d4', q: 2 }, { id: 's01_d6', q: 1 }, { id: 's01_d3', q: 1 }] },
  { label: '第 4 单 · 怪味研究所 + 手滑填了奇葩地址', shopId: 's04', items: [{ id: 's04_d2', q: 1 }, { id: 's04_d4', q: 1 }], address: '导航找不到这栋楼' },
  { label: '第 5 单 · 回老王 + 备注多放辣（本店第 5 单）', shopId: 's01', items: [{ id: 's01_d1', q: 3 }, { id: 's01_d2', q: 1 }], remark: '多放辣' },
  { label: '第 6 单 · 佛系粥铺，穷到只点茶叶蛋和青菜包', shopId: 's03', items: [{ id: 's03_d4', q: 3 }, { id: 's03_d5', q: 2 }] },
  { label: '第 7 单 · 怪味研究所 + 备注「来个私房菜」', shopId: 's04', items: [{ id: 's04_d1', q: 1 }, { id: 's04_d6', q: 1 }], remark: '来个私房菜' },
  { label: '第 8 单 · 懒人便当，一顿点一大桌', shopId: 's05', items: [{ id: 's05_d1', q: 2 }, { id: 's05_d2', q: 1 }, { id: 's05_d3', q: 1 }, { id: 's05_d6', q: 2 }] },
  { label: '第 9 单 · 又回老王，随便烤两串', shopId: 's01', items: [{ id: 's01_d1', q: 2 }] },
  { label: '第 10 单 · 孔子饺子馆 + 备注「拉黑你」', shopId: 's02', items: [{ id: 's02_d1', q: 2 }], remark: '拉黑你' },
  { label: '第 11 单 · 又去孔子饺子馆（看拉黑后会不会和好）', shopId: 's02', items: [{ id: 's02_d2', q: 2 }, { id: 's02_d4', q: 1 }] },
  { label: '第 12 单 · 再回老王，老熟客了', shopId: 's01', items: [{ id: 's01_d2', q: 2 }, { id: 's01_d4', q: 2 }] },
]

// ---- 跑会话 ----
function runOrder(intent: OrderIntent, idx: number) {
  const shop = getShop(intent.shopId)!
  const riderId = pickRider()
  const rider = RIDERS.find((r) => r.id === riderId)!

  let orderTotal = 0
  let dishCount = 0
  const lines = intent.items.map(({ id, q }) => {
    const d = getDish(intent.shopId, id)!
    orderTotal += d.price * q
    dishCount += q
    return `  · ${d.emoji} ${d.name} ×${q} = ¥${d.price * q}`
  })
  const avgDishPrice = dishCount > 0 ? Math.round(orderTotal / dishCount) : 0

  const oi = buildOrderInput({
    shopId: intent.shopId,
    riderId,
    orderTotal,
    avgDishPrice,
    dishCount,
    deliveryFee: shop.deliveryFee,
    remark: intent.remark,
    address: intent.address,
  } as any)

  const sid = oi.shopId ?? 's01'
  const hist: HistoryParams = memory.getHistoryParams(sid, riderId)
  hist.shopVisitCount = (hist.shopVisitCount ?? 0) + 1 // 含本次，驱动同店递进（与 OrderView 一致）

  const before = memory.getAchievements()
  const mem = memory.getShopMemory(sid)
  const r = runDrama(branches, oi, { random: rng, history: hist, flags: mem.flags })

  const fg = runForbiddenCheck(r.events.map((e) => e.text), taboo)

  if (r.selectedBranchId) {
    memory.recordOrder(sid, { flags: r.newFlags, tags: r.finalState.tags })
    if (riderId) memory.recordRider(riderId)
    const bm = branchById.get(r.selectedBranchId)
    memory.unlockAchievements(bm?.achievements ?? [])
    memory.recordOrderHistory({
      ts: Date.now(),
      shopId: sid,
      shopName: shop.name,
      branchId: r.selectedBranchId,
      branchName: bm?.name,
      bossMood: r.finalState.bossMood,
      total: oi.orderTotal,
      achievements: bm?.achievements ?? [],
    })
  }
  const after = memory.getAchievements()
  const newlyUnlocked = after.filter((a) => !before.includes(a))

  return { intent, shop, rider, orderTotal, dishCount, avgDishPrice, oi, r, fg, newlyUnlocked, hist, lines }
}

// ---- 输出 ----
const out: string[] = []
out.push(`# 真人模拟试玩 · 原始时间线 (seed=${SEED})`)
out.push('')
out.push(`> 运行时代码：真实 \`runDrama\` + 真实 \`MemoryEngine\` + 真实 \`DRAMA-SEED-v1\`（${branches.length} 分支）+ 真实红线词表。`)
out.push(`> 说明：这是主理人代真人走的一遍 12 单会话，用于验证「能跑/好玩/会传播/红线/同店递进/成就可达」。正式 H1 笑率仍需 ≥8 名真人 tester。`)
out.push('')
out.push(`总分支数：${branches.length} ｜ 红线词：${taboo.red_light.length} 红 / ${taboo.yellow_light.length} 黄`)
out.push('')

let redTotal = 0
let allBranchIds: string[] = []

for (let i = 0; i < session.length; i++) {
  const res = runOrder(session[i], i)
  allBranchIds.push(res.r.selectedBranchId ?? '(none)')
  redTotal += res.fg.redLightCount
  const bm = branchById.get(res.r.selectedBranchId ?? '')
  out.push(`## ${session[i].label}`)
  out.push('')
  out.push(`- 店：${res.shop.emoji} ${res.shop.name}（本店第 ${res.hist.shopVisitCount} 单）`)
  out.push(`- 骑手：${res.rider.emoji} ${res.rider.name}`)
  out.push(`- 购物车：`)
  out.push(res.lines.join('\n'))
  out.push(`- 合计：¥${res.orderTotal} ｜ 件数 ${res.dishCount} ｜ 均价 ¥${res.avgDishPrice} ｜ 配送费 ¥${res.oi.deliveryFee}`)
  if (res.oi.remarkTag) out.push(`- 备注标签：${res.oi.remarkTag}${res.intent.remark ? `（"${res.intent.remark}"）` : ''}`)
  if (res.oi.addressTag) out.push(`- 地址标签：${res.oi.addressTag}${res.intent.address ? `（"${res.intent.address}"）` : ''}`)
  out.push(`- 命中分支：\`${res.r.selectedBranchId}\`${bm?.name ? `（${bm.name}）` : ''} ｜ 稀有度 ${bm?.rarity ?? '-'}`)
  out.push(`- 老板心情：${res.r.finalState.bossMood} ｜ 累计延误：${res.r.finalState.totalDelay}min ｜ 新 flags：${res.r.newFlags.join(', ') || '无'}`)
  out.push(`- 红线门控：${res.fg.pass ? '✅ 通过' : `⛔ 命中 ${res.fg.redLightCount} 处`}`)
  out.push('')
  out.push('**四阶段段子时间线：**')
  for (const e of res.r.events) {
    out.push(`- 【${e.phase}】<${e.actor}> ${e.text}`)
  }
  out.push('')
  if (res.newlyUnlocked.length) {
    out.push('**🏆 本单解锁成就：** ' + res.newlyUnlocked.map((a) => `${getAchievement(a)?.icon ?? ''} ${getAchievement(a)?.name ?? a}`).join('、'))
    out.push('')
  }
  out.push('---')
  out.push('')
}

out.push('## 会话汇总')
out.push('')
out.push(`- 命中分支序列：${allBranchIds.join(' → ')}`)
out.push(`- 红线命中合计：${redTotal} 处（应为 0）`)
out.push(`- 已解锁成就（${memory.getAchievements().length}）：${memory.getAchievements().join(', ')}`)
out.push('')

const md = out.join('\n')
const rawPath = resolve(root, 'docs/playtest/REALUSER-RAW-2026-07-26.md')
writeFileSync(rawPath, md, 'utf8')
console.log(md)
console.log(`\n[已写入原始时间线] ${rawPath}`)
