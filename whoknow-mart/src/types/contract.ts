// contract.ts — 共享信封与 mart 自建子集类型（零改写，字段名对齐 DATA-STRUCTURE-v1）
//
// 铁律（mart-L1-datastructure-draft §0 / ADR-003）：mart 字段命名复用 waimai 权威
// （actor / moodDelta / next+nextWeights / id），严禁抢先另起命名。本文件只复用类型，
// 不新增与 waimai 冲突的字段名。

/** 克制矩阵 delta 规范值（REVIEW §6 D2：1+1+2 硬锁，非手感值）。 */
export const DELTA = { WEAKNESS: 40, MINE: -10, NEUTRAL: 10 } as const
export type DeltaValue = (typeof DELTA)[keyof typeof DELTA]

/** 5 型导购（C2 规范英文 id，REVIEW §5.1）。 */
export type Archetype = 'poison_tongue' | 'rational' | 'lazy' | 'philosopher' | 'dark'
/** 4 招式（固定，位置随机由 L2 控制）。 */
export type MoveId = 'move_firm' | 'move_compare' | 'move_pity' | 'move_poison'
/** 记忆分级（对齐 DATA-STRUCTURE §5.1 memoryTier）。 */
export type MemoryTier = 'first' | 'regular' | 'vip'
/** Rarity 枚举（对齐 DATA-STRUCTURE §3.6 / §4.1）。 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface MoveDef {
  id: MoveId
  label: string
  archetype: string
}

export interface GuideDef {
  id: string
  name: string
  archetype: Archetype
  motive: string
  hiddenWeakness: string[]
  thunderMine: string[]
  /** 复用 waimai L3 记忆分级桶（首触/回头客/真爱粉）。 */
  lineBuckets: Record<MemoryTier, string[]>
  rarity: Rarity
  avatar: string
}

/** 克制矩阵：archetype -> moveId -> delta（+40/-10/+10）。 */
export type MartMatrix = Record<Archetype, Record<MoveId, number>>

export interface AffinityConfig {
  initial: number
  min: number
  max: number
  roundCap: number
  winState: string
  loseState: string
}

export interface ProductDef {
  id: string
  name: string
  /** 占位价格哨兵（真实价格禁数字，红线 #2）；展示用 pricePlaceholder 字符串。 */
  price: number
  guideBinding: string
  rarity: Rarity
  /** 商品大图 emoji（色盲三重标识之一）。 */
  emoji?: string
  /** 价格红标占位字符串（离谱价 / ¥?? / 智商税价 / 看缘分价，禁数字）。 */
  pricePlaceholder?: string
  /** 化名店名（某宝/某团/京城…）。 */
  shopName?: string
  /** 商品分类（家居/数码/美妆/宠物/个护…）。 */
  category?: string
  /** 离谱品=true / 正常品=false（决定笑率分布）。 */
  absurdity?: boolean
  /** 比价素材（move_compare 触发，相对描述无绝对数字）。 */
  compareMaterial?: string
}

/** mart 自建 L1 子集（信封 mart 键下）。 */
export interface L1Mart {
  guides: GuideDef[]
  moves: MoveDef[]
  matrix: MartMatrix
  affinity: AffinityConfig
  products: ProductDef[]
}

export interface ForbiddenCheckResult {
  version?: string
  red_light_count: number
  yellow_light_count: number
  passed: boolean
}

export interface UiMeta {
  ai_story_visible?: boolean
  last_brain_run?: string
  freshness_hours?: number
}

export interface MetaParams {
  hot_today: string
  weather: string
  holiday: string
}

/** 多产品共享信封（6 字段 + mart + forbidden_check + fallback）。mart 只读消费，零改写。 */
export interface SharedEnvelope {
  version: string
  generated_at: string
  effective_until: string
  meta: MetaParams
  food?: unknown
  mart: L1Mart
  soul_layer?: unknown
  ui_meta?: UiMeta
  story_assets?: unknown
  forbidden_check: ForbiddenCheckResult
  fallback?: { mart: L1Mart }
}

/** mart L3 玩家持久化（单键 whoknow:mart:stats，结构对齐 DATA-STRUCTURE §5.1）。 */
export interface MartUserStats {
  schemaVersion: number
  guideVisit: Record<string, number>
  memoryTier: Record<string, MemoryTier>
  affinity: Record<string, number>
  guidesSeen: string[]
  movesSeen: string[]
  weakpointsHit: string[]
  branchesSeen: string[]
  achievements: string[]
  flags: string[]
}
