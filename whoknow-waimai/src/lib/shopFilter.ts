// shopFilter.ts — 店铺列表筛选 chip 纯函数（拟真外壳 · 视图层）
//
// 背景：P1 审计根因——筛选判定原本内联在 ShopListView.vue 里，node:test 够不着。
// 抽到此处后，"哪个 chip 有没有筛选力"变成可断言事实（见 shopFilter.test.ts）。
//
// 铁律：纯函数、不改入参（排序前先 slice）、脏输入降级不抛。

import type { Shop } from '../data/shops'

export type FilterId = 'all' | 'promo' | 'freeship' | 'sales' | 'distance' | 'new'

export interface FilterMeta {
  id: FilterId
  label: string
  /** 该筛选条件下列表为空时的文案 */
  empty: string
}

export const FILTERS: FilterMeta[] = [
  { id: 'all', label: '全部', empty: '该分类暂未上架胡闹商家' },
  { id: 'promo', label: '满减优惠', empty: '这批老板今天不想打折' },
  { id: 'freeship', label: '免配送费', empty: '暂无免配送费商家 · 老板们都想赚这几块钱' },
  { id: 'sales', label: '销量优先', empty: '该分类暂未上架胡闹商家' },
  { id: 'distance', label: '距离最近', empty: '该分类暂未上架胡闹商家' },
  { id: 'new', label: '新店', empty: '暂无新店 · 老店们还在硬撑' },
]

const DEFAULT_EMPTY_HINT = '该分类暂未上架胡闹商家'

/** 从「月售 5600+」这类文案里取数字；取不到按 0 处理（排最后）。 */
export function salesOf(s: Shop): number {
  const raw = typeof s?.monthlySales === 'string' ? s.monthlySales : ''
  const n = parseInt(raw.replace(/[^\d]/g, ''), 10)
  return Number.isNaN(n) ? 0 : n
}

/** 距离统一折算成米：'1.2km' → 1200，'800m' → 800（混单位下直接 parseInt 会排错序）。 */
export function distanceOf(s: Shop): number {
  const raw = typeof s?.distance === 'string' ? s.distance : ''
  const n = parseFloat(raw.replace(/[^\d.]/g, ''))
  if (Number.isNaN(n)) return Number.MAX_SAFE_INTEGER
  return /km/i.test(raw) ? n * 1000 : n
}

/**
 * 按 chip 筛选 / 排序店铺列表。总是返回新数组，不改入参。
 * 未知 id 按 'all' 处理（降级不抛）。
 */
export function chipFilter(shops: Shop[], id: FilterId): Shop[] {
  const src = Array.isArray(shops) ? shops.slice() : []
  switch (id) {
    case 'promo':
      return src.filter((s) => typeof s?.promo === 'string' && s.promo.includes('减'))
    case 'freeship':
      return src.filter((s) => s?.deliveryFee === 0)
    case 'sales':
      return src.sort((a, b) => salesOf(b) - salesOf(a))
    case 'distance':
      return src.sort((a, b) => distanceOf(a) - distanceOf(b))
    case 'new':
      return src.filter((s) => s?.badge === '新店' || s?.flash === true)
    case 'all':
    default:
      return src
  }
}

/** 空列表时该 chip 对应的提示文案。 */
export function emptyHintFor(id: FilterId): string {
  return FILTERS.find((f) => f.id === id)?.empty ?? DEFAULT_EMPTY_HINT
}
