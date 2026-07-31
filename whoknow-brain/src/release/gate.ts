// gate.ts — 发布闸门（ADR-003：生成失败不发布 / 红线 0 容忍 / 高危必人工审）
//
// 这是"质量 > 数量，宁可没新内容也不出错"的**唯一执行点**。
// 任何部署路径都必须先过本闸门；闸门只做布尔判断，不做内容生成、不做修改。

import { publishBlocked } from '../errors.ts'
import { validateEnvelopeShape } from '../contracts/envelope.ts'
import { HIGH_RISK_MIN, type ProductionRecord } from '../contracts/production.ts'

export interface GateResult {
  ok: boolean
  reasons: string[]
  /** 非阻断提示（例如质量信号缺失 —— M0–M2 允许缺，但要提醒） */
  warnings: string[]
}

/** 只判断、不抛错。用于审核台/报告展示。 */
export function evaluatePublishable(record: ProductionRecord): GateResult {
  const reasons: string[] = []
  const warnings: string[] = []

  // 1. 契约结构合法
  const issues = validateEnvelopeShape(record.envelope)
  for (const i of issues) reasons.push(`契约不合法：${i}`)

  // 2. 红线 0 容忍（禁忌词清单 v1.0 · api-spec forbidden_red_count > 0 立即停）
  const fc = record.envelope.forbidden_check
  if (fc) {
    if (fc.red_light_count > 0) reasons.push(`红线命中 ${fc.red_light_count} 处，禁止发布`)
    if (!fc.passed) reasons.push('forbidden_check.passed = false')
  }
  const redHits = record.audit.forbidden_hits.filter((h) => h.level === 'red')
  if (redHits.length > 0) reasons.push(`审核记录含红线命中：${redHits.map((h) => h.term).join('、')}`)

  // 3. 风险 4–5 级必须人工审通过（你不在时队列堆积、绝不自动发）
  if (record.audit.risk_level >= HIGH_RISK_MIN && record.audit.state !== 'approved') {
    reasons.push(`风险等级 ${record.audit.risk_level}（高危）必须人工审核通过，当前状态：${record.audit.state}`)
  }
  if (record.audit.state === 'rejected') reasons.push('已驳回的内容永不部署')

  // 4. 质量信号（S3「安全但无聊」防御的输入位）—— M0–M2 缺失只告警
  const qs = record.quality_signals
  if (qs.memeability === null && qs.contrast_intensity === null) {
    warnings.push('质量信号（梗性/反差强度）全空：无法参与"安全但无聊"告警判据')
  }
  if (qs.spreadability === null) {
    warnings.push('传播力为空：M0–M2 无上行反馈通道（ADR-004 属 M3），符合预期')
  }

  return { ok: reasons.length === 0, reasons, warnings }
}

/** 判断并在不合格时抛 PUBLISH_BLOCKED。部署脚本必须调用它，而不是自己判。 */
export function assertPublishable(record: ProductionRecord): GateResult {
  const result = evaluatePublishable(record)
  if (!result.ok) throw publishBlocked(result.reasons)
  return result
}
