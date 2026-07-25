// dramaEngine.test.ts — DRAMA 解析器/状态机原型测试（Phase 3 · A2）
// 加载真实 SEED，验证：四阶段流动、权重选支、moodDelta 累加、
// P0-D「写备注 vs 没写」差异、odd_eats 自锁修复、ADR-001 字段契约。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runDrama } from './dramaEngine.impl.ts'

const SEED_PATH = fileURLToPath(new URL('../../docs/specs/DRAMA-SEED-v1-2026-07-24.json', import.meta.url))
const SEED = JSON.parse(readFileSync(SEED_PATH, 'utf8'))

function baseInput(over: Record<string, unknown> = {}) {
  return {
    shopId: 's001-老王烧烤',
    riderId: 'r001',
    orderTotal: 50,
    avgDishPrice: 20,
    dishCount: 1,
    deliveryFee: 3,
    addressTag: 'home',
    remarkTag: 'none',
    ...over,
  } as any
}

test('四阶段流动 · 穷鬼分支：orderTotal<20 → poor，bossMood 50-30=20', () => {
  const r = runDrama(SEED, baseInput({ orderTotal: 15 }), { random: () => 0 })
  assert.equal(r.selectedBranchId, 'poor')
  assert.equal(r.finalState.bossMood, 20)
  assert.equal(r.events.length, 4)
  assert.deepEqual(
    r.events.map((e) => e.phase),
    ['accept', 'cook', 'deliver', 'complete'],
  )
})

test('P0-D · 写备注「多放辣」 → 触发 remark_more_spicy 专属分支', () => {
  const r = runDrama(SEED, baseInput({ remarkTag: 'more_spicy' }), { random: () => 0 })
  assert.equal(r.selectedBranchId, 'remark_more_spicy')
  assert.ok(r.events.some((e) => e.text.includes('多放辣')))
})

test('P0-D · 写备注「别骂了」 → 触发 remark_no_scold（bossMood +15）', () => {
  const r = runDrama(SEED, baseInput({ remarkTag: 'no_scold' }), { random: () => 0 })
  assert.equal(r.selectedBranchId, 'remark_no_scold')
  assert.equal(r.finalState.bossMood, 65) // 50 + 15
})

test('P0-D · 奇葩地址 → 触发 address_weird（bossMood -30 + 延时）', () => {
  const r = runDrama(SEED, baseInput({ addressTag: 'weird' }), { random: () => 0 })
  assert.equal(r.selectedBranchId, 'address_weird')
  assert.equal(r.finalState.bossMood, 20) // 50 - 30
  assert.ok(r.finalState.totalDelay > 0)
})

test('P0-D · 没写备注（remarkTag=none） → 不命中任何 remark 分支（差异成立）', () => {
  const r = runDrama(SEED, baseInput({ remarkTag: 'none' }), { random: () => 0 })
  assert.notEqual(r.selectedBranchId, 'remark_more_spicy')
  assert.notEqual(r.selectedBranchId, 'remark_no_scold')
  // 普通单（无特殊变量）不命中任何分支 → 体现「写 vs 没写」台词差异
  assert.equal(r.selectedBranchId, null)
})

test('多分支 next/nextWeights · bankrupt_love 按权重选后继 bk_bro', () => {
  const r = runDrama(SEED, baseInput({ orderTotal: 350 }), { random: () => 0 })
  assert.equal(r.selectedBranchId, 'bankrupt_love')
  assert.ok(r.events.some((e) => e.id === 'bk_bro'), 'random=0 应落在权重最高(6/10)的 bk_bro')
  assert.ok(r.newFlags.includes('bro_r001'))
})

test('odd_eats 自锁修复 · flag 回访可触发（不再依赖 hasTag(odd_eats) 死锁）', () => {
  const r = runDrama(SEED, baseInput({ orderTotal: 50 }), {
    random: () => 0,
    flags: ['odd_eats_s001-老王烧烤'],
  })
  assert.equal(r.selectedBranchId, 'odd_eats')
})

test('ADR-001 §6 契约 · SEED 字段终态无残留、结构合规', () => {
  assert.ok(SEED.length >= 7, '分支数 >= 7（含 P0-D 新增）')
  for (const b of SEED) {
    assert.ok(b.id && typeof b.id === 'string', '分支缺 id')
    assert.ok('actor' in b === false, '分支层不应有 actor（actor 在 chain 节点）')
    for (const n of b.chain) {
      assert.ok(n.actor, `chain 节点 ${n.id ?? '?'} 缺 actor（禁用 speaker）`)
      assert.ok(!('speaker' in n), '残留 speaker')
      assert.ok(!('mood' in n), '残留 mood（应仅 moodDelta）')
      if (n.next !== undefined && n.next !== null) {
        assert.ok(Array.isArray(n.next), 'next 应为 string[]（禁用 next:string|null）')
        if (n.nextWeights) {
          assert.equal(
            (n.nextWeights as number[]).length,
            (n.next as string[]).length,
            'nextWeights 与 next 同序等长',
          )
        }
      }
      if ('moodDelta' in n && n.moodDelta !== undefined) {
        assert.equal(typeof n.moodDelta, 'number', 'moodDelta 必须为 number')
      }
    }
  }
})
