// cart.ts — 轻量购物车（美团 Lite 下单流）
// 结构：cart[shopId][dishId] = qty。同一店结算后清空。
import { reactive } from 'vue'
import { getDish } from '../data/dishes.ts'

export type CartMap = Record<string, Record<string, number>>

export const cart = reactive<CartMap>({})

export function addItem(shopId: string, dishId: string) {
  if (!cart[shopId]) cart[shopId] = {}
  cart[shopId][dishId] = (cart[shopId][dishId] ?? 0) + 1
}

export function decItem(shopId: string, dishId: string) {
  if (!cart[shopId]) return
  const n = (cart[shopId][dishId] ?? 0) - 1
  if (n <= 0) delete cart[shopId][dishId]
  else cart[shopId][dishId] = n
  if (Object.keys(cart[shopId]).length === 0) delete cart[shopId]
}

export function getItems(shopId: string): Record<string, number> {
  return cart[shopId] ?? {}
}

export function dishCount(shopId: string): number {
  return Object.values(cart[shopId] ?? {}).reduce((a, b) => a + b, 0)
}

export function cartTotal(shopId: string): number {
  const items = cart[shopId] ?? {}
  return Object.entries(items).reduce((sum, [dishId, q]) => {
    const d = getDish(shopId, dishId)
    return sum + (d ? d.price * q : 0)
  }, 0)
}

export function clearShop(shopId: string) {
  delete cart[shopId]
}
