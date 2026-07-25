// memory.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryEngine, MemStore } from './memory.ts'
import { runDrama } from '../engine/dramaEngine.ts'
import { loadSeedBranches } from '../config/loader.ts'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const seedPath = join(here, '../../docs/specs/DRAMA-SEED-v1-2026-07-24.json')
const branches = loadSeedBranches(JSON.parse(readFileSync(seedPath, 'utf8')))

test('M1 首单：visitCount=1，history 同步', () => {
  const eng = new MemoryEngine(new MemStore())
  const { memory, history } = eng.recordOrder('s01')
  assert.equal(memory.visitCount, 1)
  assert.equal(history.shopVisitCount, 1)
  assert.equal(history.totalOrders, 1)
  assert.equal(history.todayOrderCount, 1)
})

test('M2 同店第二单：visitCount=2，全局计数累加', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder('s01')
  const { memory, history } = eng.recordOrder('s01')
  assert.equal(memory.visitCount, 2)
  assert.equal(history.shopVisitCount, 2)
  assert.equal(history.totalOrders, 2)
})

test('M3 flags 累积：写入的 flag 持久化', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder('s01', { flags: ['odd_eats_s01'] })
  eng.recordOrder('s01', { flags: ['boss_cares_s01'] })
  const mem = eng.getShopMemory('s01')
  assert.ok(mem.flags.includes('odd_eats_s01'))
  assert.ok(mem.flags.includes('boss_cares_s01'))
  assert.equal(mem.flags.length, 2)
})

test('M4 跨店隔离：s01 与 s02 互不污染', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder('s01', { flags: ['odd_eats_s01'] })
  assert.equal(eng.getShopMemory('s02').visitCount, 0)
  assert.equal(eng.getShopMemory('s01').visitCount, 1)
})

test('M5 集成：第二单携带 odd_eats flag → 引擎可触发 odd_eats 分支', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder('s01', { flags: ['odd_eats_s01'] }) // 首单写入 flag
  eng.recordOrder('s01') // 第二单
  const history = eng.getHistoryParams('s01')
  const mem = eng.getShopMemory('s01')
  const r = runDrama(branches, { shopId: 's01' }, { random: () => 0, flags: mem.flags, history })
  assert.equal(r.selectedBranchId, 'odd_eats') // 回访触发隐藏私房菜
  assert.equal(r.events.length, 4)
})
