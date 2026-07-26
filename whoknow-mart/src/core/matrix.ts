// matrix.ts — 克制矩阵查表 + 1+1+2 锁校验（03-matrix · M1）
//
// 数值 +40/-10/+10 为 REVIEW §6 D2 规范锁（非手感值，不可在 playtest 前硬编码手感）；
// 具体「某型弱点=某招」映射为 [待测试] 占位（见 config/l1mart.static.ts）。

import { DELTA } from '../types/contract.ts'
import type { Archetype, MoveId, MartMatrix } from '../types/contract.ts'

export { DELTA }
export type { Archetype, MoveId, MartMatrix }

export const ARCHETYPES: Archetype[] = ['poison_tongue', 'rational', 'lazy', 'philosopher', 'dark']
export const MOVES: MoveId[] = ['move_firm', 'move_compare', 'move_pity', 'move_poison']

export function clampAffinity(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 查表；缺格回退 +10 平手（ARCHITECTURE §3.4，调用方记 warn 不崩）。 */
export function lookup(matrix: MartMatrix, arch: Archetype, move: MoveId): number {
  const row = matrix[arch]
  if (!row) return DELTA.NEUTRAL
  const v = row[move]
  return typeof v === 'number' ? v : DELTA.NEUTRAL
}

export interface MatrixValidation {
  ok: boolean
  errors: string[]
}

/**
 * 否决#2 机检核心：每个导购矩阵必须恰为 1 弱点(+40) + 1 踩雷(−10) + 2 中性(+10)。
 * 不满足即「矩阵崩坏」（任一轮全 +40 / 全 −10，无策略空间）→ 否定。
 */
export function validateMatrix1Plus1Plus2(matrix: MartMatrix): MatrixValidation {
  const errors: string[] = []
  for (const a of ARCHETYPES) {
    const row = matrix[a]
    if (!row) {
      errors.push(`archetype ${a} 缺失`)
      continue
    }
    const deltas = MOVES.map((m) => lookup(matrix, a, m))
    const w = deltas.filter((d) => d === DELTA.WEAKNESS).length
    const m = deltas.filter((d) => d === DELTA.MINE).length
    const n = deltas.filter((d) => d === DELTA.NEUTRAL).length
    if (w !== 1) errors.push(`${a}: 弱点数=${w}（须=1）`)
    if (m !== 1) errors.push(`${a}: 踩雷数=${m}（须=1）`)
    if (n !== 2) errors.push(`${a}: 中性数=${n}（须=2）`)
  }
  return { ok: errors.length === 0, errors }
}

function weaknessMove(matrix: MartMatrix, arch: Archetype): MoveId {
  const row = matrix[arch]
  for (const m of MOVES) if (row && row[m] === DELTA.WEAKNESS) return m
  return MOVES[0]
}

/**
 * 保底轮次机检：从 initial 起，每轮恒定选该导购弱点招（+40），
 * 应在 roundCap 内达到 >= max（破防态）。否则玩家被无限拖延 = 否决。
 */
export function reachesBreak(
  matrix: MartMatrix,
  arch: Archetype,
  initial: number,
  max: number,
  roundCap: number,
): boolean {
  let aff = initial
  for (let r = 0; r < roundCap; r++) {
    aff = clampAffinity(aff + lookup(matrix, arch, weaknessMove(matrix, arch)), 0, max)
    if (aff >= max) return true
  }
  return false
}
