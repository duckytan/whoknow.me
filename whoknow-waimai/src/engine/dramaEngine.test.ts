// dramaEngine.test.ts — M1 引擎验收（node --test --experimental-strip-types）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runDrama, type RunResult } from './dramaEngine.ts'

const here = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(
  readFileSync(join(here, '../../docs/specs/DRAMA-SEED-v1-2026-07-24.json'), 'utf8')
)
const branches = seed // SEED 顶层即为 branches[]

const det = () => 0 // 确定性随机：概率门 0<prob 必过；权重池取第一个；next 取第一个

function run(input: Record<string, unknown>, opts: Record<string, unknown> = {}) {
  return runDrama(branches, input as any, { random: det, ...opts } as any)
}

// 1) 四阶段顺序流（穷鬼单，且 avgDishPrice 高以避开 cheap_no_rider 重叠）
test('T1 四阶段顺序流：poor 分支产出 4 个有序事件', () => {
  const r: RunResult = run({ orderTotal: 15, avgDishPrice: 99, dishCount: 3 })
  assert.equal(r.selectedBranchId, 'poor')
  assert.equal(r.events.length, 4)
  const phases = r.events.map((e) => e.phase)
  assert.deepEqual(phases, ['accept', 'cook', 'deliver', 'complete'])
  assert.equal(r.finalState.bossMood, 20) // 50 - 30
  assert.equal(r.finalState.totalDelay, 15000)
})

// 2) P0-D：写备注「别骂了」命中专属分支（bossMood 上升）
test('T2 P0-D 差异(1)：remark_no_scold 命中，bossMood +15 → 65', () => {
  const r = run({ remarkTag: 'no_scold', orderTotal: 50, avgDishPrice: 99 })
  assert.equal(r.selectedBranchId, 'remark_no_scold')
  assert.equal(r.finalState.bossMood, 65)
  assert.ok(r.events.some((e) => e.text.includes('别骂了')))
})

// 3) P0-D：写备注「多放辣」命中另一分支（bossMood 下降）
test('T3 P0-D 差异(2)：remark_more_spicy 命中，bossMood -10 → 40', () => {
  const r = run({ remarkTag: 'more_spicy', orderTotal: 50, avgDishPrice: 99 })
  assert.equal(r.selectedBranchId, 'remark_more_spicy')
  assert.equal(r.finalState.bossMood, 40)
})

// 4) 兜底：普通单无备注/flags → 命中 default 兜底（非空），保证每单都有反应
test('T4 兜底：普通单无 remark/flags → 命中 default 兜底，事件非空', () => {
  const r = run({ orderTotal: 50, avgDishPrice: 99 })
  assert.equal(r.selectedBranchId, 'default')
  assert.equal(r.events.length, 4)
})

// 5) odd_eats 自锁修复：携带 flag(odd_eats_{shopId}) 的回访才触发
test('T5 odd_eats 回访：flags 含 odd_eats_s01 时命中，moodDelta -80', () => {
  const r = run({ shopId: 's01' }, { flags: ['odd_eats_s01'] })
  assert.equal(r.selectedBranchId, 'odd_eats')
  assert.equal(r.events.length, 4)
  assert.equal(r.finalState.bossMood, -30) // 50 - 80
})

// 6) 加权 next + flag 插值（破产 · 被接济：跳转 bk_bro，flag bro_{riderId} 插值）
test('T6 加权跳转 + flag 插值：bankrupt_love → bk_bro，flag=bro_r001', () => {
  const r = run({ orderTotal: 300, avgDishPrice: 99, riderId: 'r001' })
  assert.equal(r.selectedBranchId, 'bankrupt_love')
  assert.equal(r.events.length, 2) // 系统事件 + 跳转到的 bk_bro
  assert.equal(r.events[1].id, 'bk_bro')
  assert.ok(r.newFlags.includes('bro_r001')) // ADR-001 §4 插值
})

// 7) 占位符无泄漏（所有事件文本不含 {）
test('T7 占位符无残留：任何分支渲染后文本不含 {', () => {
  const cases = [
    { orderTotal: 15, avgDishPrice: 99 },
    { orderTotal: 300, avgDishPrice: 99, riderId: 'r001' },
    { shopId: 's01', flags: ['odd_eats_s01'] },
    { addressTag: 'weird', orderTotal: 50, avgDishPrice: 99 },
    { remarkTag: 'more_spicy', orderTotal: 50, avgDishPrice: 99 },
  ]
  for (const c of cases) {
    const r = run(c)
    for (const e of r.events) assert.ok(!e.text.includes('{'), `leak in ${r.selectedBranchId}: ${e.text}`)
  }
  // 额外验证 ¥{deliveryFee} 已修复：cheap_no_rider 渲染出真实数值
  const cr = run({ avgDishPrice: 5, deliveryFee: 5 })
  assert.ok(cr.events.some((e) => e.text.includes('¥5的配送费')))
})

// 8) ADR-001 契约：每个事件含 phase/actor/text；moodDelta 为数字或缺失
test('T8 ADR 契约：事件结构合法', () => {
  const r = run({ orderTotal: 15, avgDishPrice: 99, dishCount: 3 })
  for (const e of r.events) {
    assert.equal(typeof e.phase, 'string')
    assert.equal(typeof e.actor, 'string')
    assert.equal(typeof e.text, 'string')
    if (e.moodDelta !== undefined) assert.equal(typeof e.moodDelta, 'number')
  }
})

// 9) 兜底优先级：特定分支命中时，default 不抢占
test('T9 兜底优先级：remark_no_scold 命中时 selected 非 default', () => {
  const r = run({ remarkTag: 'no_scold', orderTotal: 50, avgDishPrice: 99 })
  assert.equal(r.selectedBranchId, 'remark_no_scold')
  assert.notEqual(r.selectedBranchId, 'default')
})

// 10) P0-1 修复：odd_eats 经备注「私房菜」首次可达（不再自锁），并播种 flag 供回访延续
test('T10 P0-1 修复：odd_eats 经备注 odd 首次可达并播种 odd_eats_{shopId}', () => {
  const r = run({ shopId: 's01', remarkTag: 'odd', orderTotal: 50, avgDishPrice: 99 })
  assert.equal(r.selectedBranchId, 'odd_eats')
  assert.ok(r.newFlags.includes('odd_eats_s01'))
})

// 11) P0-1 修复：boss_blacklist 经备注「拉黑」播种 blacklisted_{shopId}（让 blacklist_reunion 后续可触发）
test('T11 P0-1 修复：boss_blacklist 经备注 blacklist 播种 blacklisted_{shopId}', () => {
  const r = run({ shopId: 's01', remarkTag: 'blacklist', orderTotal: 50, avgDishPrice: 99 })
  assert.equal(r.selectedBranchId, 'boss_blacklist')
  assert.ok(r.newFlags.includes('blacklisted_s01'))
})

// 12) P0-1 修复：回访带 blacklisted_{shopId} → blacklist_reunion 命中（reconciled 成就不再死锁）
test('T12 P0-1 修复：回访带 flag 触发 blacklist_reunion，reconciled 可达', () => {
  const r = run({ shopId: 's01', orderTotal: 50, avgDishPrice: 99 }, { flags: ['blacklisted_s01'] })
  assert.equal(r.selectedBranchId, 'blacklist_reunion')
  assert.equal(r.events.length, 4)
})

// 13) 差异感·店间：shopId=s01 命中店铺专属分支（非 default），选店有意义
test('T13 差异感·店间：shopId=s01 命中 shop_s01_angry 专属分支', () => {
  const r = run({ shopId: 's01', orderTotal: 50, avgDishPrice: 99 })
  assert.equal(r.selectedBranchId, 'shop_s01_angry')
  assert.notEqual(r.selectedBranchId, 'default')
})

// 14) 差异感·同店递进：第 3 单(shopVisitCount=3) 命中 regular_3rd，同店差异生效（隔离店间干扰，不传 shopId）
test('T14 差异感·同店：shopVisitCount>=3 命中 regular_3rd', () => {
  const r = run({ orderTotal: 50, avgDishPrice: 99 }, { history: { shopVisitCount: 3 } })
  assert.equal(r.selectedBranchId, 'regular_3rd')
  assert.ok(r.events.some((e) => e.text.includes('第')))
})

// 15) 差异感·骑手：riderId=r003 命中骑手专属分支（路痴梗），骑手有差异台词
test('T15 差异感·骑手：riderId=r003 命中 rider_r003_lost 专属分支', () => {
  const r = run({ orderTotal: 50, avgDishPrice: 99, riderId: 'r003' })
  assert.equal(r.selectedBranchId, 'rider_r003_lost')
  assert.ok(r.events.some((e) => e.text.includes('张迷路')))
})
