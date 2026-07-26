// lines.ts — 记忆分级台词选桶（04 记忆分级消费点）
// 引擎按玩家在该导购的 memoryTier 选首触/回头客/真爱粉桶；三桶必须可感知差异（否决#1）。

import type { L1Mart, MemoryTier } from '../types/contract.ts'

/** 取某导购在某记忆分级下的台词桶；缺桶返回空数组（loader 启动告警）。 */
export function pickLineBucket(mart: L1Mart, guideId: string, tier: MemoryTier): string[] {
  const g = mart.guides.find((x) => x.id === guideId)
  if (!g) return []
  return g.lineBuckets[tier] ?? []
}
