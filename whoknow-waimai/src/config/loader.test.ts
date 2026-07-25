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

test('L1 解析 SEED：顶层数组为 11 分支（含 default 兜底）', () => {
  const b = parseBranches(seed)
  assert.equal(b.length, 11)
  const ids = b.map((x) => x.id)
  for (const id of ['poor', 'cheap_no_rider', 'odd_eats', 'remark_more_spicy', 'remark_no_scold', 'address_weird', 'default'])
    assert.ok(ids.includes(id), `缺 ${id}`)
  assert.ok(b.find((x) => x.id === 'default')?.isFallback === true)
})

test('L2 占位符无泄漏：SEED 全部台词无残留 {xxx}', () => {
  assertNoPlaceholderLeak(parseBranches(seed)) // 不抛即过
})

test('L3 结构非法：非数组 / 缺 id / 缺 chain 均拒绝', () => {
  assert.throws(() => parseBranches({}))
  assert.throws(() => parseBranches([{ trigger: { condition: 'x' }, chain: [{ phase: 'a', actor: 'b', text: 'c' }] }]))
  assert.throws(() => parseBranches([{ id: 'x', trigger: { condition: 'x' }, chain: [] }]))
})

test('L4 loadSeedBranches 端到端返回 11 分支且已校验', () => {
  const b = loadSeed()
  assert.equal(b.length, 11)
})
