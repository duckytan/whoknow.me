// orderInput.ts — 下单输入播种（M1）
// 把表单 → OrderInput；备注/地址关键词分类为 remarkTag / addressTag（与 SEED 分支条件对齐）。
import type { OrderInput } from '../engine/dramaEngine'

export interface OrderForm {
  shopId?: string
  riderId?: string
  orderTotal?: number
  avgDishPrice?: number
  dishCount?: number
  deliveryFee?: number
  remark?: string
  address?: string
}

/** 备注关键词 → remarkTag（对齐 SEED: remarkTag = more_spicy / no_scold / odd / blacklist）。 */
export function classifyRemark(remark?: string): string | undefined {
  if (!remark) return undefined
  // 拉黑/差评类 → boss_blacklist 分支（播种 blacklisted_{shopId}，后续可和解）
  if (['拉黑', '差评', '再也不点', '投诉', '拉黑你'].some((k) => remark.includes(k))) return 'blacklist'
  if (remark.includes('别骂')) return 'no_scold'
  if (remark.includes('辣')) return 'more_spicy'
  // 私房菜/黑暗料理类 → odd_eats 分支（隐藏私房菜，首次经备注可达，不再自锁）
  if (['私房菜', '黑暗料理', '随便做', '老板做主', '神秘菜'].some((k) => remark.includes(k))) return 'odd'
  return undefined
}

/** 地址关键词 → addressTag（对齐 SEED: addressTag = weird）。 */
export function classifyAddress(address?: string): string | undefined {
  if (!address) return undefined
  if (['奇葩', '地球', '迷路', '找不到', '导航'].some((k) => address.includes(k))) return 'weird'
  return undefined
}

export function buildOrderInput(form: OrderForm): OrderInput {
  return {
    shopId: form.shopId,
    riderId: form.riderId,
    orderTotal: form.orderTotal,
    avgDishPrice: form.avgDishPrice,
    dishCount: form.dishCount,
    deliveryFee: form.deliveryFee,
    remarkTag: classifyRemark(form.remark),
    addressTag: classifyAddress(form.address),
  }
}
