// dishLabel.ts — 菜品卡片文案纯函数（拟真外壳 · 视图层）
//
// 背景：P1 审计 D1（折扣角标错 10 倍：渲染"低至67折"）/ D2（月售标签精确匹配失败）。
// 这两段逻辑原本内联在 ShopView.vue 模板里，node:test 只匹配 .ts，物理上够不着
// → 缺陷活跃与 61 测试全绿长期共存。抽到此处即为"装传感器"。
//
// 铁律：纯函数、无副作用、不读全局；脏输入一律降级为空串（空串 = 调用方不渲染该行）。

/** 折扣角标阈值：原价 > 现价 × 1.3 才挂角标（沿用改造前的曝光口径，不扩大展示面）。 */
const DISCOUNT_THRESHOLD = 1.3

function isPositive(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0
}

/**
 * 折扣角标文案，如「低至6.7折」。
 *
 * 真美团口径：折扣 = 现价 / 原价 × 10，保留 1 位小数；整数不带小数点（"5折" 而非 "5.0折"）。
 * 改造前写的是 × 100 → "低至67折"，是真美团永远不会出现的文案（D1）。
 *
 * 不满足阈值 / 脏输入 / 无折扣 → 返回 ''。
 */
export function discountLabel(price?: number, originalPrice?: number): string {
  if (!isPositive(price) || !isPositive(originalPrice)) return ''
  if (originalPrice <= price * DISCOUNT_THRESHOLD) return ''
  const tenths = Math.round((price / originalPrice) * 100) / 10
  if (!Number.isFinite(tenths) || tenths <= 0 || tenths >= 10) return ''
  return `低至${Number.isInteger(tenths) ? tenths : tenths.toFixed(1)}折`
}

/** 取标签数组里第一个包含关键词的标签；找不到返回 ''。非字符串元素直接跳过。 */
function findTag(tags: string[] | undefined, keyword: string): string {
  if (!Array.isArray(tags)) return ''
  for (const t of tags) {
    if (typeof t === 'string' && t.includes(keyword)) return t
  }
  return ''
}

/**
 * 月售副标题：数据里有「月售28」「月售100+」就原样显示真数据；没有就返回 ''（绝不编造）。
 *
 * D2 根因：改造前写的是 tags.includes('月售')，那是数组元素精确相等匹配，
 * 而数据里存的是「月售28」→ 永远 false；于是有真数据的菜不显示、无标签的菜反而
 * 用 Math.random 派生值编出一个"月售xx+"。此处只做"有则显示、无则留白"。
 */
export function monthlyLabel(tags?: string[]): string {
  return findTag(tags, '月售')
}

/** 好评副标题：与 monthlyLabel 同口径，匹配「N人觉得好吃」这类标签；无数据返回 ''。 */
export function reviewLabel(tags?: string[]): string {
  return findTag(tags, '人觉')
}
