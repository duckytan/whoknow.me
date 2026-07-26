// memory.ts — 记忆引擎（02-memory · M1）
//
// 键前缀 whoknow:mart: 隔离（ADR-002）；KVStore 注入式；单键存整份 MartUserStats JSON。
// 零改写复用 waimai memory.ts 模式，仅改键前缀 + mart UserStats 结构。
// 本模块无外部依赖，可 100% 纯 Node 单测（否决#1 机检）。

import type { MartUserStats, MemoryTier } from '../types/contract.ts'

export interface KVStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const KEY_PREFIX = 'whoknow:mart:'
const STATS_KEY = `${KEY_PREFIX}stats`
const SCHEMA_VERSION = 1

/**
 * 复用 DATA-STRUCTURE-v1 §2.3 记忆分级阈值（first=1 / regular>=3 / vip>=10）。
 * 注：CONTROL-CHECKLIST §B.1 示例代码写「5 次→vip」与 DATA-STRUCTURE 源权威阈值(10)不一致，
 * 此处以 DATA-STRUCTURE §2.3 单一事实来源为准（vip>=10）；阈值待 playtest 标定。
 */
export const MEMORY_TIER_THRESHOLDS = { first: 1, regular: 3, vip: 10 } as const

function defaultStats(): MartUserStats {
  return {
    schemaVersion: SCHEMA_VERSION,
    guideVisit: {},
    memoryTier: {},
    affinity: {},
    guidesSeen: [],
    movesSeen: [],
    weakpointsHit: [],
    branchesSeen: [],
    achievements: [],
    flags: [],
  }
}

function computeTier(visitCount: number): MemoryTier {
  if (visitCount >= MEMORY_TIER_THRESHOLDS.vip) return 'vip'
  if (visitCount >= MEMORY_TIER_THRESHOLDS.regular) return 'regular'
  return 'first'
}

export class MemoryEngine {
  private store: KVStore
  constructor(store: KVStore) {
    this.store = store
  }

  private read(): MartUserStats {
    const raw = this.store.getItem(STATS_KEY)
    if (!raw) return defaultStats()
    try {
      const parsed = JSON.parse(raw) as MartUserStats
      // 迁移：缺字段用默认补齐（DATA-STRUCTURE §8.3），不丢已有计数
      return { ...defaultStats(), ...parsed, schemaVersion: SCHEMA_VERSION }
    } catch {
      return defaultStats()
    }
  }

  private write(s: MartUserStats): void {
    this.store.setItem(STATS_KEY, JSON.stringify(s))
  }

  /** 记录一局博弈终止，更新该导购 visit + 派生 memoryTier（+可选 affinity 峰值/flags）。 */
  recordOrder(
    guideId: string,
    opts: { affinityPeak?: number; flags?: string[] } = {},
  ): MartUserStats {
    const s = this.read()
    s.guideVisit[guideId] = (s.guideVisit[guideId] ?? 0) + 1
    s.memoryTier[guideId] = computeTier(s.guideVisit[guideId])
    if (opts.affinityPeak !== undefined) {
      const prev = s.affinity[guideId] ?? 0
      s.affinity[guideId] = Math.max(prev, opts.affinityPeak)
    }
    for (const f of opts.flags ?? []) if (!s.flags.includes(f)) s.flags.push(f)
    this.write(s)
    return s
  }

  getVisitCount(guideId: string): number {
    return this.read().guideVisit[guideId] ?? 0
  }

  getMemoryTier(guideId: string): MemoryTier {
    const s = this.read()
    if (s.memoryTier[guideId]) return s.memoryTier[guideId]
    return computeTier(s.guideVisit[guideId] ?? 0)
  }

  getAffinity(guideId: string): number {
    return this.read().affinity[guideId] ?? 0
  }

  /** 图鉴/成就写回（05/04 共用，L4 内嵌 L3）。 */
  markSeen(guideId: string): void {
    const s = this.read()
    if (!s.guidesSeen.includes(guideId)) {
      s.guidesSeen.push(guideId)
      this.write(s)
    }
  }
  markMoveSeen(moveId: string): void {
    const s = this.read()
    if (!s.movesSeen.includes(moveId)) {
      s.movesSeen.push(moveId)
      this.write(s)
    }
  }
  markWeakpoint(guideId: string): void {
    const s = this.read()
    if (!s.weakpointsHit.includes(guideId)) {
      s.weakpointsHit.push(guideId)
      this.write(s)
    }
  }
  unlockAchievements(ids: string[]): string[] {
    const s = this.read()
    let changed = false
    for (const id of ids)
      if (id && !s.achievements.includes(id)) {
        s.achievements.push(id)
        changed = true
      }
    if (changed) this.write(s)
    return s.achievements.slice()
  }

  /** 重置（P3 零负担，入口藏深）。 */
  reset(): void {
    this.store.setItem(STATS_KEY, JSON.stringify(defaultStats()))
  }
}

/** 内存 KV（测试用）。 */
export class MemStore implements KVStore {
  private m = new Map<string, string>()
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.m.set(k, v)
  }
}
