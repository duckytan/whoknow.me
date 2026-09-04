// errors.ts — 大脑骨架统一错误类型
// 设计约束：错误必须"可判别"（有 code），不靠字符串匹配；每个错误对应一条工程不变量。

export type BrainErrorCode =
  | 'IMMUTABILITY_VIOLATION' // I1 只增不删改：试图覆盖已存在的不可变记录
  | 'CHECKSUM_MISMATCH' // I4 内容校验失败（落盘损坏 / 被篡改 / 传输截断）
  | 'RECORD_NOT_FOUND'
  | 'RECORD_EXISTS'
  | 'INVALID_ID' // 输入校验：ID 不合法（含路径穿越防护）
  | 'INVALID_CONTRACT' // 契约结构不合法（envelope 校验未过）
  | 'PUBLISH_BLOCKED' // 发布闸门拦截（红线 / 未审 / 契约不合法）

export class BrainError extends Error {
  readonly code: BrainErrorCode
  readonly detail: Record<string, unknown>

  constructor(code: BrainErrorCode, message: string, detail: Record<string, unknown> = {}) {
    super(message)
    this.name = 'BrainError'
    this.code = code
    this.detail = detail
  }
}

export function isBrainError(e: unknown, code?: BrainErrorCode): e is BrainError {
  if (!(e instanceof BrainError)) return false
  return code === undefined || e.code === code
}

export const immutabilityViolation = (path: string): BrainError =>
  new BrainError('IMMUTABILITY_VIOLATION', `不可变记录已存在，禁止覆盖：${path}`, { path })

export const checksumMismatch = (expected: string, actual: string, path?: string): BrainError =>
  new BrainError('CHECKSUM_MISMATCH', `校验和不匹配：期望 ${expected}，实际 ${actual}`, {
    expected,
    actual,
    path,
  })

export const recordNotFound = (store: string, id: string, version?: number): BrainError =>
  new BrainError('RECORD_NOT_FOUND', `记录不存在：${store}/${id}${version ? `@v${version}` : ''}`, {
    store,
    id,
    version,
  })

export const recordExists = (store: string, id: string): BrainError =>
  new BrainError('RECORD_EXISTS', `记录已存在，请用 addVersion 追加新版本：${store}/${id}`, { store, id })

export const invalidId = (id: string): BrainError =>
  new BrainError('INVALID_ID', `非法记录 ID（仅允许 [A-Za-z0-9_-]，长度 1–64）：${JSON.stringify(id)}`, { id })

export const invalidContract = (issues: string[]): BrainError =>
  new BrainError('INVALID_CONTRACT', `数据契约校验未通过（${issues.length} 项）`, { issues })

export const publishBlocked = (reasons: string[]): BrainError =>
  new BrainError('PUBLISH_BLOCKED', `发布闸门拦截（${reasons.length} 条）：${reasons.join('；')}`, { reasons })
