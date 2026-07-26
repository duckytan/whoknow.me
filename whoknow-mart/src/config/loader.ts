// loader.ts — 信封 loader（04 · 零改写消费，ADR-003）
//
// 仅「取 mart 子树 + 校验信封 6 字段 + forbidden_check 红灯门控」，不改写任何共享字段。
// 横切接线点（否决#3）：信封 forbidden_check.red_light_count>0 → 整包拒绝（L4 降级）。

import { validateMatrix1Plus1Plus2 } from '../core/matrix.ts'
import type { SharedEnvelope, L1Mart, ForbiddenCheckResult } from '../types/contract.ts'

export type LoadStatus = 'OK' | 'REJECT' | 'INVALID'

export interface LoadResult {
  status: LoadStatus
  config?: L1Mart
  reason?: string
  forbiddenCheck?: ForbiddenCheckResult
}

const ENVELOPE_FIELDS: (keyof SharedEnvelope)[] = [
  'version',
  'generated_at',
  'effective_until',
  'meta',
  'mart',
  'forbidden_check',
]

/**
 * 加载并校验共享信封，取出 mart 子树。
 * 顺序：① 信封 6 字段存在性 → ② 红灯门控（先于一切渲染）→ ③ 矩阵 1+1+2 兜底。
 */
export function loadMartConfig(env: SharedEnvelope): LoadResult {
  // ① 信封 6 字段存在性（零改写前置）
  for (const f of ENVELOPE_FIELDS) {
    if (env[f] === undefined) {
      return { status: 'INVALID', reason: `信封缺字段: ${String(f)}` }
    }
  }
  // ② 红灯门控（否决#3）：red_light_count>0 → 整包拒绝，不返回敏感内容
  if (env.forbidden_check.red_light_count > 0) {
    return {
      status: 'REJECT',
      forbiddenCheck: env.forbidden_check,
      reason: 'forbidden_check.red_light_count>0 整包拒绝',
    }
  }
  // ③ 取 mart 子树 + 矩阵 1+1+2 校验（否决#2 兜底）
  const mart = env.mart
  const v = validateMatrix1Plus1Plus2(mart.matrix)
  if (!v.ok) {
    return {
      status: 'INVALID',
      forbiddenCheck: env.forbidden_check,
      reason: `mart 矩阵不满足 1+1+2 锁: ${v.errors.join('; ')}`,
    }
  }
  return { status: 'OK', config: mart, forbiddenCheck: env.forbidden_check }
}
