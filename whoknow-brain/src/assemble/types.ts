// assemble/types.ts — M0–M2 手动作者草稿契约
//
// 这是"大脑工厂中段"的输入契约：M0–M2 阶段大脑**不上 LLM 自动生成**（那是 M3），
// 段子/活动内容由主理人（锡哥）手动撰写，本契约定义"一份草稿长什么样"。
//
// 设计铁律在此落地：
//   - 草稿只引用公式 ID 与知识库 ID（不把公式 pattern / 素材原文塞进 envelope）
//   - 红线命中由作者标注（M0–M2 不依赖自动合规引擎，红线基座见禁忌词清单 v1.0）
//   - 风险等级 / 审核状态 / 质量信号 由作者给出（M0–M2 无上行反馈，质量信号允许人工估）

import type { EnvelopeMeta, StoryAssets, SoulLayer } from '../contracts/envelope.ts'
import type { RiskLevel, ForbiddenHit } from '../contracts/production.ts'

/** 产品键：waimai / mart / 未来扩展（字符串开放）。 */
export type ProductKey = 'waimai' | 'mart' | (string & {})

/**
 * 一份手动草稿 = 主理人写的一条段子 / 一个活动 / 一组对话分支。
 * 它"引用"了套用的公式与取材的知识库，并携带实际内容 payload。
 */
export interface ContentDraft {
  /** 草稿 ID，如 D-2026-0731-001（仅 [A-Za-z0-9_-]） */
  id: string
  /** 归属产品；同一次 assemble 必须同 product */
  product: ProductKey
  /** 套用的公式 ID（读 FormulaRepo 取快照） */
  formula_id: string
  /** 取材的知识库 ID 列表（读 KnowledgeRepo 取摘录） */
  knowledge_refs: string[]
  /**
   * 实际内容负载。按 product 放置到 envelope 对应槽：
   *   waimai → envelope.food（FoodPayload，含 branches）
   *   mart   → envelope.mart
   *   其他   → envelope.products[product]
   * 多个草稿的 payload 会合并（waimai 的 branches 数组合并）。
   */
  payload: Record<string, unknown>
  /** 5 级风险：1–3 自动发，4–5 高危必人工审 */
  risk_level: RiskLevel
  /** 红线/黄线命中（M0–M2 由作者标注） */
  forbidden_hits: ForbiddenHit[]
  /** 质量信号（M0–M2 允许人工估，可 null） */
  quality_signals: {
    memeability: number | null
    spreadability: number | null
    contrast_intensity: number | null
  }
  /** 审核状态：M0–M2 = 锡哥开 pending 文件批注落盘 */
  audit_state: 'approved' | 'pending' | 'rejected'
  reviewer?: string | null
  reviewed_at?: string | null
  reject_reason?: string | null
  /** 审核台要素④「同类历史」的 M0–M2 替代判据（design D3） */
  substitute_evidence?: {
    formula_pass_rate: number | null
    material_red_level: 'green' | 'yellow' | 'red' | null
  }
}

/** 一次发布的 envelope 级元信息（版本 / 生效期 / 外壳元）。 */
export interface ReleaseMeta {
  /** 形如 2026-07-31.001 */
  version: string
  generated_at: string
  /** 必须晚于 generated_at */
  effective_until: string
  meta: EnvelopeMeta
  ui_meta: {
    ai_story_visible: boolean
    last_brain_run: string
    freshness_hours: number
  }
  story_assets?: StoryAssets
  soul_layer?: SoulLayer
}
