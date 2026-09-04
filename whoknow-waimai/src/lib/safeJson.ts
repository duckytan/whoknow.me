// safeJson.ts — localStorage 安全解析（P1 审计 D7）
//
// 背景：memory.ts 有 5 处裸 JSON.parse。用户手改 / 插件写脏 / 旧版本残留数据，
// 都会让 JSON.parse 抛异常并冒泡到 setup()，直接白屏订单页与客服页。
// 铁律：坏数据只降级，不抛异常、不白屏；形状不对也按"没有数据"处理。

/** 是不是一个普通对象（非 null、非数组）。 */
export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 有限数字取值，脏值回落 fallback（默认 0）——挡住 undefined/NaN 参与 += 的连锁污染。 */
export function toFiniteNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

/**
 * 安全解析 JSON：空值 / 语法错误 / 形状不符 → 返回 fallback，绝不抛。
 * @param guard 可选形状校验；不通过按脏数据处理。
 */
export function safeParse<T>(
  raw: string | null | undefined,
  fallback: T,
  guard?: (v: unknown) => boolean,
): T {
  if (typeof raw !== 'string' || raw.trim() === '') return fallback
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return fallback
  }
  if (parsed === null || parsed === undefined) return fallback
  if (guard && !guard(parsed)) return fallback
  return parsed as T
}

/**
 * 安全解析 JSON 数组：非数组一律回落空数组；给了 itemGuard 就顺手滤掉脏元素。
 * 用于成就 id 列表与订单历史——这两处一旦返回非数组，调用方的 unshift/includes 会直接炸。
 */
export function safeParseArray<T>(
  raw: string | null | undefined,
  itemGuard?: (v: unknown) => boolean,
): T[] {
  const parsed = safeParse<unknown[]>(raw, [], Array.isArray)
  if (!Array.isArray(parsed)) return []
  return (itemGuard ? parsed.filter((v) => itemGuard(v)) : parsed) as T[]
}
