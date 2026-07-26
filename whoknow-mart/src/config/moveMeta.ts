// moveMeta.ts — 4 招式呈现元数据（mart 自有）
//
// 固定语义、位置随机（位置由 martStateMachine.shuffleMoves 控制）。
// icon + 文字双标识，不靠色相（ACCESSIBILITY §5 / ART-BIBLE §5.5）。
// 对齐 ASSET-SPECS §2.2 / ACCESSIBILITY §9.2。

import type { MoveId } from '../types/contract.ts'

export interface MoveMeta {
  icon: string
  label: string
}

export const MOVE_META: Record<MoveId, MoveMeta> = {
  move_firm: { icon: '💪', label: '我需要！' },
  move_compare: { icon: '📊', label: '我比过价了' },
  move_pity: { icon: '🥺', label: '求求了' },
  move_poison: { icon: '🤬', label: '爱卖不卖' },
}
