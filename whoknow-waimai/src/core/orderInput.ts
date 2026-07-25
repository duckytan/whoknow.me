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

/** 备注关键词 → remarkTag（对齐 SEED: remarkTag = more_spicy / no_scold）。 */
export function classifyRemark(remark?: string): string | undefined {
  if (!remark) return undefined
  if (remark.includes('别骂')) return 'no_scold'
  if (remark.includes('辣')) return 'more_spicy'
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
