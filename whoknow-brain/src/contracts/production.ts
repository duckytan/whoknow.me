// production.ts — 本地生产记录 → 公开 envelope 的投影（知识产权边界的工程落地）
//
// 这是"知识产权留本地、只把成品送上云"这条铁律的**唯一执行点**。
//
//   ProductionRecord（本地全量，含公式本体 / 素材原文 / prompt / 审核过程）
//        │  projectToPublicEnvelope()  ← 白名单投影，只放行已知安全字段
//        ▼
//   Envelope（上云、公开、只读）
//
// 白名单而非黑名单：新增内部字段默认**不会**外泄；要放行必须显式改这里并补测试。

import { checksumOf } from '../storage/fsx.ts'
import {
  ENVELOPE_CONTRACT,
  computeContentChecksumInput,
  type DegradeLevel,
  type Envelope,
  type QualitySignals,
} from './envelope.ts'

/** 风险 5 级分级：1–3 自动发，4–5 高危人工审（BRAIN-PLAN 发布与风险）。 */
export type RiskLevel = 1 | 2 | 3 | 4 | 5
export const HIGH_RISK_MIN: RiskLevel = 4

export interface ForbiddenHit {
  term: string
  level: 'red' | 'yellow'
}

/** 来源链路（审核台要素②）。含 IP，**永不上云**。 */
export interface Provenance {
  /** 公式快照：含 pattern 本体，属核心资产 */
  formula_snapshots: Array<{ id: string; version: number; pattern: string }>
  /** 素材摘录：含原文片段，属核心资产 */
  material_excerpts: Array<{ id: string; version: number; title: string; excerpt: string }>
  news_ids: string[]
  generated_by: { model: string; prompt_version: string }
}

/** 审核记录（M0–M2 = 锡哥开 pending 文件批注落盘，无 UI）。 */
export interface AuditRecord {
  risk_level: RiskLevel
  forbidden_hits: ForbiddenHit[]
  state: 'pending' | 'approved' | 'rejected'
  reviewer: string | null
  reviewed_at: string | null
  reject_reason: string | null
  /** 审核台要素④「同类历史」的 M0–M2 替代判据（design D3） */
  substitute_evidence?: {
    formula_pass_rate: number | null
    material_red_level: 'green' | 'yellow' | 'red' | null
  }
}

export interface ProductionRecord {
  /** 公开部分的草稿（content_checksum 由投影时计算） */
  envelope: Envelope
  provenance: Provenance
  audit: AuditRecord
  quality_signals: QualitySignals
}

const WATERMARK_LABEL: Record<DegradeLevel, string> = {
  L1: '🧠 今日 AI 更新',
  L2: '⏰ 昨日 AI 内容',
  L3: '🎭 经典段子',
  L4: '今天没新段子，喝杯水吧 ☕',
}

export function watermarkFor(level: DegradeLevel): { level: DegradeLevel; label: string; placement: 'footer' } {
  return { level, label: WATERMARK_LABEL[level], placement: 'footer' }
}

/** 只放行这些顶层键进入公开 envelope。新增键必须在此显式登记。 */
const PUBLIC_TOP_LEVEL_KEYS = [
  'version',
  'generated_at',
  'effective_until',
  'meta',
  'food',
  'mart',
  'products',
  'soul_layer',
  'ui_meta',
  'story_assets',
  'forbidden_check',
  'fallback',
] as const

/**
 * 投影：本地全量记录 → 公开 envelope。
 * - 溯源只保留 `ID@版本` 不透明引用（C-RULE-3）
 * - 审核只保留结论摘要，不带批注/驳回理由/审核人心路
 * - content_checksum 最后计算并回填
 *
 * 注意：本函数**不做**发布准入判断（那是 release/gate.ts 的职责），只做"能不能被看见"的裁剪。
 */
export function projectToPublicEnvelope(record: ProductionRecord, level: DegradeLevel = 'L1'): Envelope {
  const src = record.envelope as unknown as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of PUBLIC_TOP_LEVEL_KEYS) {
    if (src[key] !== undefined) out[key] = JSON.parse(JSON.stringify(src[key])) as unknown
  }

  const env = out as unknown as Envelope
  env.ui_meta = { ...env.ui_meta, watermark: watermarkFor(level) }

  env.brain_meta = {
    contract: ENVELOPE_CONTRACT,
    content_checksum: '',
    formula_refs: record.provenance.formula_snapshots.map((f) => `${f.id}@${f.version}`),
    material_refs: record.provenance.material_excerpts.map((m) => `${m.id}@${m.version}`),
    quality_signals: { ...record.quality_signals },
    audit: {
      risk_level: record.audit.risk_level,
      state: 'approved',
      approved_at: record.audit.reviewed_at ?? record.envelope.generated_at,
    },
  }

  env.brain_meta.content_checksum = checksumOf(computeContentChecksumInput(env))
  return env
}

/** 校验一个公开 envelope 的 content_checksum 是否自洽（分发前/拉取后都可复算）。 */
export function verifyEnvelopeChecksum(env: Envelope): boolean {
  if (!env.brain_meta) return false
  return checksumOf(computeContentChecksumInput(env)) === env.brain_meta.content_checksum
}
