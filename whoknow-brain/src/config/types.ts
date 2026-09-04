// config/types.ts — 管理平台手动配置类型（M0–M2）
//
// 范围边界（design-lock gate 硬约束）：
//   本文件描述的两类配置 = 主理人**手动编辑**的运营配置，
//   **不接 cron 定时调度、不接审核台 UI、不接反馈回传**（那些是 M3 自动化）。
//   对应 BRAIN-PLAN：新闻渠道 MVP=RSS+免费API（M0 人工维护）；类型权重维度已拍板
//   （5维+梗性），但「自动升降 cron」属 M3，本阶段只提供手动档位。
//
// 不含知识产权：无 formula pattern 框架、无素材原文，纯运营参数，
// 故不进成品 envelope 投影白名单（成品只含 formula_refs / material_refs 引用）。

/** 信源类型：M0 先支持 rss / api；scrape 预留。 */
export type SourceKind = 'rss' | 'api' | 'scrape'

/** 素材类别，对应 BRAIN-PLAN 多渠道新闻挖掘：时事/热点/财经/科技/娱乐。 */
export type SourceCategory = 'news' | 'weather' | 'finance' | 'tech' | 'entertainment' | 'hot' | 'misc'

/** 信源状态：启用 / 暂停 / 黑名单。 */
export type SourceStatus = 'active' | 'paused' | 'blacklisted'

/** 一条新闻渠道 / 信源（大脑「从哪采素材」的入口）。 */
export interface SourceChannel {
  id: string
  name: string
  kind: SourceKind
  category: SourceCategory
  url: string
  /**
   * 合规标记（BRAIN-PLAN ④衍生层：涉政/涉敏源降权或黑名单）。
   * politics_sensitive=true 的源在 M3 自动采集时降权/屏蔽；
   * M0-M2 手动阶段即由主理人把关（默认 paused / weight=0）。
   */
  politics_sensitive: boolean
  /** 初始健康分 0–1：复用 OpenClaw 5维健康分范式，M0-M2 手动设初值，M3 由 cron 自动升降。 */
  health: number
  /** 该源权重 0–1：主理人手动设，组装排序时与其它源加权。 */
  weight: number
  status: SourceStatus
  notes?: string
}

/** ③ 已拍板：权重打分 6 维 = 命中率/时效性/相关性/权威性/稳定性 + 大脑特有「梗性/趣味性」。 */
export interface DimensionWeights {
  hit_rate: number
  freshness: number
  relevance: number
  authority: number
  stability: number
  meme: number
}

/** 类型权重档位（组装排序 Top-N 时用，主理人手动可调）。 */
export interface TypeWeight {
  /** 各 app 基础优先级（waimai/mart/...），默认 1.0。 */
  app_priority: Record<string, number>
  /** 各梗类型基础优先级（天气梗/职场梗/沙雕新闻/meme...），默认 1.0。 */
  genre_priority: Record<string, number>
  /** 6维权重档位（主理人手动调，不接自动升降）。 */
  dimension_weights: DimensionWeights
}

export interface PlatformConfigMeta {
  version_label: string
  updated_by: string
  notes?: string
}

/**
 * 平台配置包（配置包 = 新闻渠道清单 + 类型权重档位，合成一个 VersionedStore 记录）。
 * 修改任一处 = addVersion 出新版本，永不删改旧版。
 */
export interface PlatformConfig {
  sources: SourceChannel[]
  weights: TypeWeight
  meta: PlatformConfigMeta
}
