// 04-memory.test.ts — 否决#1 记忆失效机检（04 记忆分级）
//
// 坏长什么样：同导购博弈累计达 vip 阈值（≥10 次）时，台词/弱点仍无差异（P1 破裂）→ 否决。
// 机检：memoryTier 随 visit 切换（首触≠回头客≠真爱粉）+ 跨会话持久 + lineBucket 随 tier 差异。

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryEngine, MemStore } from '../src/store/memory.ts'
import { L1MART } from '../src/config/l1mart.static.ts'
import { pickLineBucket } from '../src/core/lines.ts'

const GUIDE = L1MART.guides[0].id

test('否决#1 · 首触(visit=1) → memoryTier=first', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder(GUIDE)
  assert.equal(eng.getMemoryTier(GUIDE), 'first')
})

test('否决#1 · 回头客(visit>=3) → memoryTier=regular', () => {
  const eng = new MemoryEngine(new MemStore())
  for (let i = 0; i < 3; i++) eng.recordOrder(GUIDE)
  assert.equal(eng.getMemoryTier(GUIDE), 'regular')
})

test('否决#1 · 真爱粉(visit>=10) → memoryTier=vip', () => {
  // 阈值复用权威源 DATA-STRUCTURE-v1 §2.3（first=1 / regular>=3 / vip>=10）。
  // CONTROL-CHECKLIST §B.1 示例已对齐此阈值（同导购第≥10次 → vip）。
  const eng = new MemoryEngine(new MemStore())
  for (let i = 0; i < 10; i++) eng.recordOrder(GUIDE)
  assert.equal(eng.getMemoryTier(GUIDE), 'vip')
})

test('否决#1 · guideVisit 跨会话持久（whoknow:mart: 前缀隔离）', () => {
  const kv = new MemStore()
  new MemoryEngine(kv).recordOrder(GUIDE)
  const reloaded = new MemoryEngine(kv).getVisitCount(GUIDE)
  assert.equal(reloaded, 1)
})

test('否决#1 · lineBucket 随 tier 切换（首触≠真爱粉，记忆机制可感知差异）', () => {
  const first = pickLineBucket(L1MART, GUIDE, 'first')
  const vip = pickLineBucket(L1MART, GUIDE, 'vip')
  assert.notDeepEqual(first, vip) // 三桶内容必须存在差异，否则记忆失效
  assert.ok(first.length > 0 && vip.length > 0)
})
