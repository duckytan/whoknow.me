/**
 * localStorage key 集中管理（v11 · 单点真理）
 *
 * 之前分散在多个 store/utils 里的硬编码 key：
 *   - 'chaos_orders' (store/order.ts)
 *   - 'chaos_cart' (store/cart.ts)
 *   - 'chaos_demo_speed' (utils/cookingTime.ts)
 *
 * 引入此文件后，所有写 key 的地方统一从这取，避免拼写不一致和后期重构不便。
 */
export const STORAGE_KEYS = {
  orders: 'chaos_orders',
  cart: 'chaos_cart',
  demoSpeed: 'chaos_demo_speed',
  onboarded: 'chaos_onboarded', // v14 P0-5 onboarding 是否已看过
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]
