// 02-matrix.test.ts — 否决#2 矩阵崩坏机检（03-matrix / 02 选招制状态机）
//
// 坏长什么样：任一轮 4 选项全 +40 或全 −10（无策略空间）→ 否决。
// 机检：每个导购矩阵恰为 1+1+2（1 弱点+40 / 1 踩雷-10 / 2 中性+10）+ 必存在可达破防态路径。

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { L1MART } from '../src/config/l1mart.static.ts'
import {
  DELTA,
  ARCHETYPES,
  MOVES,
  lookup,
  validateMatrix1Plus1Plus2,
  reachesBreak,
} from '../src/core/matrix.ts'

test('否决#2 · 每个导购矩阵 = 规范 1+1+2（禁止全同值轮次）', () => {
  const v = validateMatrix1Plus1Plus2(L1MART.matrix)
  assert.ok(v.ok, `矩阵不满足 1+1+2: ${v.errors.join('; ')}`)
  for (const a of ARCHETYPES) {
    const deltas = MOVES.map((m) => lookup(L1MART.matrix, a, m))
    assert.equal(deltas.filter((d) => d === DELTA.WEAKNESS).length, 1) // +40
    assert.equal(deltas.filter((d) => d === DELTA.MINE).length, 1) // -10
    assert.equal(deltas.filter((d) => d === DELTA.NEUTRAL).length, 2) // +10
    assert.ok(new Set(deltas).size > 1) // 不全 +40 / 不全 -10
  }
})

test('否决#2 · 每导购必存在可达破防态路径（保底轮次）', () => {
  for (const a of ARCHETYPES) {
    assert.ok(
      reachesBreak(L1MART.matrix, a, L1MART.affinity.initial, L1MART.affinity.max, L1MART.affinity.roundCap),
      `${a} 无法在 roundCap 内破防`,
    )
  }
})

test('否决#2 · 矩阵崩坏（全 +40）应被机检捕获', () => {
  const broken = {
    ...L1MART.matrix,
    poison_tongue: { move_firm: 40, move_compare: 40, move_pity: 40, move_poison: 40 },
  } as typeof L1MART.matrix
  const v = validateMatrix1Plus1Plus2(broken)
  assert.ok(!v.ok)
})
