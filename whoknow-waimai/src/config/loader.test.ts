// loader.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseBranches, assertNoPlaceholderLeak, loadSeedBranches } from './loader.ts'

const here = dirname(fileURLToPath(import.meta.url))
const seedPath = join(here, '../../docs/specs/DRAMA-SEED-v1-2026-07-24.json')
const seed = JSON.parse(readFileSync(seedPath, 'utf8'))

function loadSeed() {
  return loadSeedBranches(JSON.parse(readFileSync(seedPath, 'utf8')))
}

test('L1 解析 SEED：顶层数组为 58 分支（40 基线零改动 + B 档新增 18：regular_2nd / shop_s0X_loyal×5 / vip_roast / rider_r00X_recog×3 / shop_s0X_roast×5 / default_i/j/k×3）', () => {
  const b = parseBranches(seed)
  assert.equal(b.length, 58)
  const ids = b.map((x) => x.id)
  for (const id of ['poor', 'poor_b', 'cheap_no_rider', 'odd_eats', 'odd_eats_b', 'odd_eats_c', 'boss_blacklist', 'remark_more_spicy', 'remark_no_scold', 'address_weird', 'default', 'default_b', 'default_c', 'default_d', 'default_h', 'shop_s01_b', 'rider_r001_b', 'regular_2nd', 'shop_s01_loyal', 'shop_s02_loyal', 'shop_s03_loyal', 'shop_s04_loyal', 'shop_s05_loyal', 'vip_roast', 'rider_r001_recog', 'rider_r002_recog', 'rider_r003_recog', 'shop_s01_roast', 'shop_s02_roast', 'shop_s03_roast', 'shop_s04_roast', 'shop_s05_roast', 'default_i', 'default_j', 'default_k'])
    assert.ok(ids.includes(id), `缺 ${id}`)
  assert.ok(b.find((x) => x.id === 'default')?.isFallback === true)
  assert.ok(b.filter((x) => x.isFallback).length >= 8, '基线变体池应至少 8 个 isFallback（含 default_i/j/k 共 11）')
})

test('L2 占位符无泄漏：SEED 全部台词无残留 {xxx}', () => {
  assertNoPlaceholderLeak(parseBranches(seed)) // 不抛即过
})

test('L3 结构非法：非数组 / 缺 id / 缺 chain 均拒绝', () => {
  assert.throws(() => parseBranches({}))
  assert.throws(() => parseBranches([{ trigger: { condition: 'x' }, chain: [{ phase: 'a', actor: 'b', text: 'c' }] }]))
  assert.throws(() => parseBranches([{ id: 'x', trigger: { condition: 'x' }, chain: [] }]))
})

test('L4 loadSeedBranches 端到端返回 58 分支且已校验', () => {
  const b = loadSeed()
  assert.equal(b.length, 58)
})

test('L5 占位符规范：SEED 不使用原型遗留的 {price}/{fee}（Route B 按设计消解原型 config）', () => {
  const text = JSON.stringify(seed)
  assert.ok(!/\{price\}/.test(text), 'SEED 不应含 {price}')
  assert.ok(!/\{fee\}/.test(text), 'SEED 不应含 {fee}')
})
