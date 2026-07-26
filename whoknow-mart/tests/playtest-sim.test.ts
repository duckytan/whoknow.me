// playtest-sim.test.ts — Epic D · H5 逻辑级 playtest 仿真（D1 扩展验证）
//
// 目的：在「不改动任何游戏源码逻辑」前提下，用真实引擎（martStateMachine + matrix）
// 跑通逻辑级 playtest，回答 H5 分布均衡假说：
//   1) 每个导购矩阵严格 1+1+2（已由 02-matrix.test.ts 机检，此处再确认）；
//   2) 玩家是否能在 roundCap(=8) 内到达 WIN_BREAK(≥100) 与 WIN_ANTI(≤0) —— 两种胜利都可达且都不死锁；
//   3) 蒙特卡洛随机策略下的真实胜率分布（≥3 轮/导购 + 200 次随机采样/导购，共 5×200 局）。
//
// 策略定义（"reasonable move-selection strategy"）：
//   - break：恒定选弱点招(+40) → 探 WIN_BREAK 可达性/速度
//   - anti ：恒定选踩雷招(-10) → 探 WIN_ANTI 可达性/速度
//   - random：每轮从真实 4 选项（位置已随机）均匀随机选 → 表征真实游玩分布
//
// 注意：本文件为可复现证据，跑 `npm test` 即重跑；分布数字会打印到 stdout 供 QA 报告引用。

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { L1MART } from '../src/config/l1mart.static.ts'
import {
  DELTA,
  ARCHETYPES,
  MOVES,
  lookup,
  validateMatrix1Plus1Plus2,
} from '../src/core/matrix.ts'
import {
  createRound,
  selectMove,
  type MartRoundState,
  type RoundOutcome,
} from '../src/engine/martStateMachine.ts'

type Strategy = 'break' | 'anti' | 'random'

function weaknessMove(arch: (typeof ARCHETYPES)[number]): string {
  const m = MOVES.find((x) => lookup(L1MART.matrix, arch, x) === DELTA.WEAKNESS)
  if (!m) throw new Error(`${arch} 无弱点招`)
  return m
}
function mineMove(arch: (typeof ARCHETYPES)[number]): string {
  const m = MOVES.find((x) => lookup(L1MART.matrix, arch, x) === DELTA.MINE)
  if (!m) throw new Error(`${arch} 无踩雷招`)
  return m
}

/** 可重现随机（mulberry32，与引擎同源）。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function chooseMove(
  strategy: Strategy,
  arch: (typeof ARCHETYPES)[number],
  state: MartRoundState,
  rng: () => number,
): string {
  if (strategy === 'break') return weaknessMove(arch)
  if (strategy === 'anti') return mineMove(arch)
  const opts = state.optionsThisRound.length ? state.optionsThisRound : MOVES
  return opts[Math.floor(rng() * opts.length)]
}

interface RunResult {
  outcome: RoundOutcome
  rounds: number
  finalAffinity: number
  deltas: number[]
}

function playthrough(
  guideId: string,
  arch: (typeof ARCHETYPES)[number],
  strategy: Strategy,
  seed: number,
): RunResult {
  const rng = mulberry32(seed)
  let state = createRound({
    guideId,
    guideArchetype: arch,
    moves: MOVES,
    affinity: L1MART.affinity.initial,
    roundCap: L1MART.affinity.roundCap,
    seed,
  })
  const deltas: number[] = []
  let outcome: RoundOutcome = 'CONTINUE'
  let rounds = 0
  while (outcome === 'CONTINUE') {
    const move = chooseMove(strategy, arch, state, rng)
    const res = selectMove(state, move, L1MART.matrix, L1MART.affinity)
    deltas.push(res.delta)
    state = res.state
    outcome = res.outcome
    rounds++
    assert.ok(rounds <= L1MART.affinity.roundCap + 1, '超时仍未终止=死锁（应被 roundCap 拦下）')
  }
  return { outcome, rounds, finalAffinity: state.affinity, deltas }
}

// ---------- H5-a: 矩阵 1+1+2 锁（再确认） ----------
test('H5 · 每个导购矩阵严格 1+1+2（1×+40 / 1×−10 / 2×+10）', () => {
  const v = validateMatrix1Plus1Plus2(L1MART.matrix)
  assert.ok(v.ok, `矩阵不满足 1+1+2: ${v.errors.join('; ')}`)
  for (const a of ARCHETYPES) {
    const deltas = MOVES.map((m) => lookup(L1MART.matrix, a, m))
    assert.equal(deltas.filter((d) => d === DELTA.WEAKNESS).length, 1)
    assert.equal(deltas.filter((d) => d === DELTA.MINE).length, 1)
    assert.equal(deltas.filter((d) => d === DELTA.NEUTRAL).length, 2)
  }
})

// ---------- H5-b: 两种胜利都可达 + 不死锁（每导购 ≥3 轮 确定性策略） ----------
test('H5 · 两种胜利 WIN_BREAK / WIN_ANTI 均可在 roundCap 内达成，且 5 导购×3 轮均不死锁', () => {
  const N = 3
  const cap = L1MART.affinity.roundCap
  for (const g of L1MART.guides) {
    for (let i = 0; i < N; i++) {
      const brk = playthrough(g.id, g.archetype, 'break', 1000 + i)
      assert.equal(brk.outcome, 'WIN_BREAK', `${g.id} break 策略应破防`)
      assert.ok(brk.rounds <= cap, `${g.id} break 超轮次`)

      const anti = playthrough(g.id, g.archetype, 'anti', 2000 + i)
      assert.equal(anti.outcome, 'WIN_ANTI', `${g.id} anti 策略应反消费胜利`)
      assert.ok(anti.rounds <= cap, `${g.id} anti 超轮次`)
    }
  }
})

// ---------- H5-c: 蒙特卡洛随机分布（5 导购 × 200 局） + 不死锁断言 ----------
test('H5 · 蒙特卡洛随机策略下 5 导购×200 局分布（无死锁，全以胜利态终止）', () => {
  const SAMPLES = 200
  const cap = L1MART.affinity.roundCap
  console.log('\n===== H5 蒙特卡洛随机分布（每导购 200 局, roundCap=' + cap + ', initial=' + L1MART.affinity.initial + '） =====')
  for (const g of L1MART.guides) {
    let winBreak = 0
    let winAnti = 0
    let roundsSum = 0
    let roundsMin = Infinity
    let roundsMax = 0
    for (let i = 0; i < SAMPLES; i++) {
      const r = playthrough(g.id, g.archetype, 'random', 5000 + g.id.length * 1000 + i)
      // 不死锁断言：必须在 roundCap 内以胜利态终止
      assert.ok(
        r.outcome === 'WIN_BREAK' || r.outcome === 'WIN_ANTI',
        `${g.id} 随机局出现非胜利终态 ${r.outcome}（死锁）`,
      )
      assert.ok(r.rounds <= cap, `${g.id} 随机局超轮次`)
      if (r.outcome === 'WIN_BREAK') winBreak++
      else winAnti++
      roundsSum += r.rounds
      roundsMin = Math.min(roundsMin, r.rounds)
      roundsMax = Math.max(roundsMax, r.rounds)
    }
    const avg = (roundsSum / SAMPLES).toFixed(2)
    console.log(
      `  ${g.id.padEnd(18)} WIN_BREAK=${String(winBreak).padStart(3)}  WIN_ANTI=${String(winAnti).padStart(3)}  ` +
        `rounds avg=${avg} min=${roundsMin} max=${roundsMax}`,
    )
  }
  console.log('===== 说明：随机策略下 WIN_ANTI 罕见=设计标定发现，详见 QA 报告 CONCERNS =====\n')
})

// ---------- 附带：H1 扩展——5 导购三桶 pairwise 互异且非空 ----------
test('H1(扩展) · 5 导购 lineBuckets 三桶(first/regular/vip) 两两互异且均非空', () => {
  for (const g of L1MART.guides) {
    const { first, regular, vip } = g.lineBuckets
    assert.ok(first.length > 0 && regular.length > 0 && vip.length > 0, `${g.id} 存在空桶`)
    assert.notDeepEqual(first, regular, `${g.id} first==regular`)
    assert.notDeepEqual(first, vip, `${g.id} first==vip`)
    assert.notDeepEqual(regular, vip, `${g.id} regular==vip`)
  }
})
