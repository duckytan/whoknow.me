// envelope.ts — 成品段子库对外契约（对齐 api-spec v2.2 envelope）
//
// 权威来源：whoknow-brain/docs/api-spec.md（文件头标 v2.1，文末含 v2.2 增量三节 → 实际生效 = v2.2）
// 映射表见：docs/architecture/data-contract-v1.md
//
// 铁律：
//   1. 本文件描述的是**上云、公开、只读**的结构。凡是知识产权（公式本体 / 素材原文 /
//      prompt / 打分算法）一律不得出现在此类型中 —— 见 production.ts 的投影函数。
//   2. 只增字段、不改语义；app 端必须忽略未知键（向后兼容）。

export const ENVELOPE_CONTRACT = 'brain.data-contract/1'
export const ENVELOPE_TARGET_SPEC = 'api-spec v2.2'

export type DegradeLevel = 'L1' | 'L2' | 'L3' | 'L4'

export interface EnvelopeMeta {
  hot_today?: string
  weather?: string
  holiday?: string
  [k: string]: unknown
}

export interface DramaChainNode {
  phase: string
  actor?: string
  text: string
  moodDelta?: number
  next?: string | string[]
  nextWeights?: number[]
  effect?: { tags?: string[]; flags?: string[] }
}

/** 形状权威以 whoknow-waimai/docs/specs/DATA-STRUCTURE-v1 §3.6 为准（冲突以该规范胜出）。 */
export interface DramaBranch {
  id: string
  name?: string
  weight?: number
  priority?: number
  isFallback?: boolean
  trigger: {
    condition: string
    probability?: number
    probabilityScaling?: { param: string; threshold?: number; rate?: number }
    cooldownMin?: number
    maxPerUser?: number
  }
  rarity?: string
  achievements?: string[]
  chain: DramaChainNode[]
}

export interface FoodPayload {
  boss?: Record<string, Record<string, string[]>>
  rider?: Record<string, string[]>
  /** v2.2 D1：DRAMA 引擎核心输入，缺失则 waimai 回落内置 seed */
  branches?: DramaBranch[]
  [k: string]: unknown
}

export interface SoulLayer {
  npc_id: string
  personality: string
  speech_style: string
  topic_preference: string[]
  forbidden_words: string[]
}

export interface UiMeta {
  ai_story_visible: boolean
  last_brain_run: string
  freshness_hours: number
  /** v2.2 D3：水印只进环境页脚，绝不覆盖戏精弹层/气泡/结局卡 */
  watermark?: { level: DegradeLevel; label: string; placement: 'footer' }
}

export interface StoryAssets {
  today_hot_topic?: string
  npc_quotes_today?: string[]
  [k: string]: unknown
}

export interface ForbiddenCheck {
  version: string
  red_light_count: number
  yellow_light_count: number
  passed: boolean
}

/** 质量信号（双评审 B2/S3 预埋位）。M0–M2 允许为 null，M3 由反馈闭环填。 */
export interface QualitySignals {
  /** 梗性 / 趣味性 0–1 */
  memeability: number | null
  /** 传播力（截图率代理 / replay 率）0–1 —— 依赖 ADR-004 上行反馈（M3） */
  spreadability: number | null
  /** 反差强度（现实锚点 vs 胡闹偏移的落差）0–1 */
  contrast_intensity: number | null
}

/**
 * brain 扩展块 —— 新增于 envelope，api-spec 未定义但向后兼容（app 忽略未知键）。
 * 只允许放**不透明引用**与**标量信号**，任何原文/本体都不得进入。
 */
export interface BrainMeta {
  contract: string
  /** 对"去掉 brain_meta.content_checksum 后的整包"取 canonical sha256 */
  content_checksum: string
  /** 形如 F-0007@3，仅 ID@版本，不含公式 pattern */
  formula_refs: string[]
  /** 形如 K-2026-0731-002@1，仅 ID@版本，不含素材原文 */
  material_refs: string[]
  quality_signals: QualitySignals
  /** 审核结论摘要（不含审核过程与内部批注） */
  audit: { risk_level: number; state: 'approved'; approved_at: string }
}

export interface Envelope {
  /** 形如 2026-07-31.001 */
  version: string
  generated_at: string
  effective_until: string
  meta: EnvelopeMeta
  food?: FoodPayload
  mart?: Record<string, unknown>
  /** 多 app 扩展命名空间（提案，待主理人拍板；见 kickoff §7 阻塞项 U6） */
  products?: Record<string, unknown>
  soul_layer?: SoulLayer
  ui_meta: UiMeta
  story_assets?: StoryAssets
  forbidden_check: ForbiddenCheck
  fallback?: { food?: unknown; mart?: unknown }
  brain_meta?: BrainMeta
}

const VERSION_RE = /^\d{4}-\d{2}-\d{2}\.\d{3}$/

function isIsoTime(v: unknown): boolean {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v))
}

/**
 * 结构校验（非业务规则）。返回问题清单，空数组 = 通过。
 * 刻意返回清单而非抛错：审核台要一次性展示"哪几处不合契约"。
 */
export function validateEnvelopeShape(e: unknown): string[] {
  const issues: string[] = []
  if (e === null || typeof e !== 'object') return ['envelope 必须是对象']
  const env = e as Partial<Envelope>

  if (typeof env.version !== 'string' || !VERSION_RE.test(env.version)) {
    issues.push('version 必须形如 YYYY-MM-DD.NNN')
  }
  if (!isIsoTime(env.generated_at)) issues.push('generated_at 必须是 ISO 时间')
  if (!isIsoTime(env.effective_until)) issues.push('effective_until 必须是 ISO 时间')
  if (isIsoTime(env.generated_at) && isIsoTime(env.effective_until)) {
    if (Date.parse(env.effective_until as string) <= Date.parse(env.generated_at as string)) {
      issues.push('effective_until 必须晚于 generated_at')
    }
  }
  if (env.meta === null || typeof env.meta !== 'object') issues.push('meta 缺失')

  const ui = env.ui_meta
  if (!ui || typeof ui !== 'object') {
    issues.push('ui_meta 缺失')
  } else {
    if (typeof ui.ai_story_visible !== 'boolean') issues.push('ui_meta.ai_story_visible 必须是布尔')
    if (!isIsoTime(ui.last_brain_run)) issues.push('ui_meta.last_brain_run 必须是 ISO 时间')
    if (typeof ui.freshness_hours !== 'number') issues.push('ui_meta.freshness_hours 必须是数字')
    if (ui.watermark && ui.watermark.placement !== 'footer') {
      issues.push('ui_meta.watermark.placement 只允许 footer（v2.2 D3：水印不得覆盖戏精弹层）')
    }
  }

  const fc = env.forbidden_check
  if (!fc || typeof fc !== 'object') {
    issues.push('forbidden_check 缺失（红线门控是发布前置）')
  } else {
    if (typeof fc.passed !== 'boolean') issues.push('forbidden_check.passed 必须是布尔')
    if (typeof fc.red_light_count !== 'number') issues.push('forbidden_check.red_light_count 必须是数字')
  }

  if (env.food === undefined && env.mart === undefined && env.products === undefined) {
    issues.push('至少要有一个产品负载（food / mart / products）')
  }
  return issues
}

/** 内容校验和：排除 brain_meta.content_checksum 自身，避免自指。 */
export function computeContentChecksumInput(env: Envelope): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(env)) as Record<string, unknown>
  const bm = clone['brain_meta'] as Record<string, unknown> | undefined
  if (bm) delete bm['content_checksum']
  return clone
}
