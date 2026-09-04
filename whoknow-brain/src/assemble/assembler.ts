// assembler.ts — 工厂中段：手动草稿 → ProductionRecord（待投影的本地全量）
//
// 这是"生成层"在 M0–M2 的落地形态：**手动触发、锡哥开 pending 文件批注落盘**，
// 不做 LLM 自动生成（那是 M3）。本模块只负责把"配方（公式）+ 原料（知识库）+ 内容（草稿 payload）"
// 组装成一版 ProductionRecord，交给 gate 判、deployer 投影落盘。
//
// 知识产权边界：公式快照只带 pattern（本就是公开框架），素材摘录只带 title（不抄原文）；
// 真正的 pattern 本体 / 素材原文永不以明文进成品 envelope —— 投影在 production.ts 的白名单执行。

import { FormulaRepo } from '../storage/formulaRepo.ts'
import { KnowledgeRepo } from '../storage/knowledgeRepo.ts'
import type { ContentDraft, ReleaseMeta, ProductKey } from './types.ts'
import type {
  ProductionRecord,
  Provenance,
  AuditRecord,
  ForbiddenHit,
  RiskLevel,
} from '../contracts/production.ts'
import type { Envelope, QualitySignals, SoulLayer, ForbiddenCheck } from '../contracts/envelope.ts'

/** 禁忌词清单版本（与 api-spec generator/forbidden.ts 对齐）。 */
const FORBIDDEN_VERSION = '1.0'

/**
 * 把若干手动草稿组装成一版 ProductionRecord。
 * @param dataRoot 公式库/知识库根目录（同 FormulaRepo/KnowledgeRepo 的 dataRoot）
 * @param product  本次发布的产品键（所有草稿必须同 product）
 * @param drafts   主理人撰写的草稿列表（≥1）
 * @param release  envelope 级元信息（版本/生效期/外壳元）
 */
export async function assembleProduct(
  dataRoot: string,
  product: ProductKey,
  drafts: ContentDraft[],
  release: ReleaseMeta,
): Promise<ProductionRecord> {
  if (drafts.length === 0) throw new Error('assembleProduct: 至少需要一条草稿')
  const mismatched = drafts.filter((d) => d.product !== product)
  if (mismatched.length > 0) {
    throw new Error(`草稿 product 不一致（期望 ${product}）：${mismatched.map((d) => d.id).join('、')}`)
  }

  const formulaRepo = new FormulaRepo(dataRoot)
  const knowledgeRepo = new KnowledgeRepo(dataRoot)

  // ── 公式快照（去重，只透明引用 ID@版本 + pattern 框架）──
  const formulaIds = [...new Set(drafts.map((d) => d.formula_id))]
  const formulaSnapshots: Provenance['formula_snapshots'] = []
  for (const fid of formulaIds) {
    const rec = await formulaRepo.latest(fid)
    formulaSnapshots.push({ id: rec.meta.id, version: rec.meta.version, pattern: rec.body.pattern })
  }

  // ── 素材摘录（去重，只带 ID@版本 + title，不抄原文）──
  const matIds = [...new Set(drafts.flatMap((d) => d.knowledge_refs))]
  const materialExcerpts: Provenance['material_excerpts'] = []
  for (const mid of matIds) {
    const rec = await knowledgeRepo.latest(mid)
    materialExcerpts.push({
      id: rec.meta.id,
      version: rec.meta.version,
      title: rec.body.title,
      excerpt: rec.body.title,
    })
  }

  // ── 合并 payload 到 envelope 对应槽 ──
  const combinedPayload = mergePayloads(product, drafts.map((d) => d.payload))

  const envelope: Envelope = {
    version: release.version,
    generated_at: release.generated_at,
    effective_until: release.effective_until,
    meta: release.meta,
    ui_meta: {
      ai_story_visible: release.ui_meta.ai_story_visible,
      last_brain_run: release.ui_meta.last_brain_run,
      freshness_hours: release.ui_meta.freshness_hours,
    },
    forbidden_check: aggregateForbidden(drafts),
  }
  if (release.story_assets) envelope.story_assets = release.story_assets
  if (release.soul_layer) envelope.soul_layer = release.soul_layer as SoulLayer
  if (product === 'waimai') envelope.food = combinedPayload as Envelope['food']
  else if (product === 'mart') envelope.mart = combinedPayload
  else envelope.products = { [product]: combinedPayload }

  const provenance: Provenance = {
    formula_snapshots: formulaSnapshots,
    material_excerpts: materialExcerpts,
    news_ids: matIds,
    generated_by: { model: 'manual-M0', prompt_version: 'brain.assemble/1' },
  }

  const audit: AuditRecord = aggregateAudit(drafts)
  const quality_signals: QualitySignals = aggregateQuality(drafts)

  return { envelope, provenance, audit, quality_signals }
}

/** 合并多草稿 payload：waimai 的 branches 数组合并；其余浅合并。 */
function mergePayloads(product: ProductKey, payloads: Record<string, unknown>[]): Record<string, unknown> {
  if (product === 'waimai') {
    const branches = payloads.flatMap((p) => (Array.isArray(p['branches']) ? (p['branches'] as unknown[]) : []))
    const merged: Record<string, unknown> = {}
    for (const p of payloads) {
      for (const [k, v] of Object.entries(p)) {
        if (k !== 'branches') merged[k] = v
      }
    }
    merged['branches'] = branches
    return merged
  }
  const merged: Record<string, unknown> = {}
  for (const p of payloads) Object.assign(merged, p)
  return merged
}

/** 红线聚合：统计红/黄灯、passed = 无红灯。 */
function aggregateForbidden(drafts: ContentDraft[]): ForbiddenCheck {
  const hits: ForbiddenHit[] = drafts.flatMap((d) => d.forbidden_hits)
  const red = hits.filter((h) => h.level === 'red').length
  const yellow = hits.filter((h) => h.level === 'yellow').length
  return { version: FORBIDDEN_VERSION, red_light_count: red, yellow_light_count: yellow, passed: red === 0 }
}

/**
 * 审核聚合：
 *   - 风险等级取最大（最危险）
 *   - 状态取最严：有 rejected → rejected；否则有 pending → pending；否则 approved
 *   - 红线命中合并；reviewer/reviewed_at 取自首条 approved；reject_reason 取自首条 rejected
 *   - 替代判据（同类历史）取首条带 substitute_evidence 的
 */
function aggregateAudit(drafts: ContentDraft[]): AuditRecord {
  const risk = Math.max(...drafts.map((d) => d.risk_level)) as RiskLevel
  const hits: ForbiddenHit[] = drafts.flatMap((d) => d.forbidden_hits)
  let state: AuditRecord['state'] = 'approved'
  if (drafts.some((d) => d.audit_state === 'rejected')) state = 'rejected'
  else if (drafts.some((d) => d.audit_state === 'pending')) state = 'pending'
  const approved = drafts.find((d) => d.audit_state === 'approved')
  const rejected = drafts.find((d) => d.audit_state === 'rejected')
  const sub = drafts.find((d) => d.substitute_evidence)?.substitute_evidence
  return {
    risk_level: risk,
    forbidden_hits: hits,
    state,
    reviewer: approved?.reviewer ?? null,
    reviewed_at: approved?.reviewed_at ?? null,
    reject_reason: rejected?.reject_reason ?? null,
    substitute_evidence: sub,
  }
}

/** 质量信号聚合：各维取"最大非空"（M0–M2 人工估，取较强信号）。 */
function aggregateQuality(drafts: ContentDraft[]): QualitySignals {
  const pick = (a: number | null, b: number | null): number | null => {
    if (a === null) return b
    if (b === null) return a
    return Math.max(a, b)
  }
  let acc: QualitySignals = { ...drafts[0]!.quality_signals }
  for (const d of drafts.slice(1)) {
    acc = {
      memeability: pick(acc.memeability, d.quality_signals.memeability),
      spreadability: pick(acc.spreadability, d.quality_signals.spreadability),
      contrast_intensity: pick(acc.contrast_intensity, d.quality_signals.contrast_intensity),
    }
  }
  return acc
}
