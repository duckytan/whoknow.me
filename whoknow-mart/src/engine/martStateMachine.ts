// martStateMachine.ts — 选招制状态机（07-selection-state-machine · M1）
//
// 自建 MartRoundState，不复用 waimai DramaState/dramaEngine（ADR-001）。纯函数 + 内存态：
// 4 选项位置随机 → 玩家选招 → 查矩阵 delta → 破防度增减 → 双胜利/续局判定。
// 双胜利（破防态≥100 / 反消费胜利态≤0）均为 success 语义，归零态绝不渲染红叉（G-4）。

import type { Archetype, MoveId, MartMatrix, AffinityConfig } from '../types/contract.ts'
import { clampAffinity, lookup } from '../core/matrix.ts'

export type { Archetype, MoveId, MartMatrix, AffinityConfig }

export interface MartRoundState {
  guideId: string
  guideArchetype: Archetype
  affinity: number
  round: number
  roundCap: number
  tags: string[]
  selectedHistory: string[]
  positionSeed: number
  optionsThisRound: MoveId[]
}

export type RoundOutcome = 'WIN_BREAK' | 'WIN_ANTI' | 'CONTINUE' | 'ROUND_CAP'

export interface SelectResult {
  state: MartRoundState
  affinity: number
  delta: number
  outcome: RoundOutcome
}

/** 双胜利均为 success 语义（G-4 / ART-BIBLE §2.4）。 */
export function isSuccess(outcome: RoundOutcome): boolean {
  return outcome === 'WIN_BREAK' || outcome === 'WIN_ANTI'
}

/** 可重现随机：mulberry32（位置随机用，便于测试断言）。 */
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

/** 种子化 Fisher–Yates，4 招全出现去重（位置随机，防肌肉记忆）。 */
export function shuffleMoves(moves: MoveId[], seed: number): MoveId[] {
  const arr = moves.slice()
  const rng = mulberry32(seed)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export interface CreateRoundOpts {
  guideId: string
  guideArchetype: Archetype
  moves: MoveId[]
  affinity: number
  roundCap: number
  seed?: number
}

export function createRound(opts: CreateRoundOpts): MartRoundState {
  const seed = opts.seed ?? ((Math.random() * 0xffffffff) >>> 0)
  return {
    guideId: opts.guideId,
    guideArchetype: opts.guideArchetype,
    affinity: opts.affinity,
    round: 1,
    roundCap: opts.roundCap,
    tags: [],
    selectedHistory: [],
    positionSeed: seed,
    optionsThisRound: shuffleMoves(opts.moves, seed),
  }
}

/** 玩家选招 → 查矩阵 delta → 破防度增减 → 双胜利 / 防死循环 / 续局。 */
export function selectMove(
  state: MartRoundState,
  moveId: MoveId,
  matrix: MartMatrix,
  affinityCfg: AffinityConfig,
): SelectResult {
  const delta = lookup(matrix, state.guideArchetype, moveId)
  const affinity = clampAffinity(state.affinity + delta, affinityCfg.min, affinityCfg.max)

  let outcome: RoundOutcome
  if (affinity >= affinityCfg.max) outcome = 'WIN_BREAK'
  else if (affinity <= affinityCfg.min) outcome = 'WIN_ANTI'
  else if (state.round >= state.roundCap) outcome = 'WIN_ANTI' // 防死循环默认劝退
  else outcome = 'CONTINUE'

  const cont: boolean = outcome === 'CONTINUE'
  const next: MartRoundState = {
    ...state,
    affinity,
    round: state.round + 1,
    selectedHistory: [...state.selectedHistory, moveId],
    optionsThisRound: cont
      ? shuffleMoves(state.optionsThisRound, state.positionSeed + state.round)
      : state.optionsThisRound,
  }
  return { state: next, affinity, delta, outcome }
}
