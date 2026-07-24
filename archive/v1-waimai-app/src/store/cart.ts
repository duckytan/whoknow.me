import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Dish } from '@/types'
import { STORAGE_KEYS } from '@/utils/storageKeys'

const STORAGE_KEY = STORAGE_KEYS.cart

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  // v18 P0 bug fix（7-23 锡哥拍板）· 实测 QuotaExceededError 真实抛错
  // 加 try/catch：localStorage 写满 / 隐私模式 / 不能用 → 静默丢弃，不冒泡到 UI
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    // 静默失贩 · UI 层跟据 in-memory `items` 状态继续走
    // localStorage 可能未同步但用户不至于白屏
    console.warn('[cart] localStorage 写失败:', (e as Error).name)
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadCart())
  const currentShopId = ref<string | null>(null)

  const totalCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const isEmpty = computed(() => items.value.length === 0)

  function addItem(dish: Dish) {
    // 切换商家时清空购物车
    if (currentShopId.value && currentShopId.value !== dish.shopId) {
      items.value = []
    }
    currentShopId.value = dish.shopId

    const existing = items.value.find(i => i.id === dish.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...dish, quantity: 1 })
    }
    saveCart(items.value)
  }

  function removeItem(dishId: string) {
    const existing = items.value.find(i => i.id === dishId)
    if (!existing) return
    if (existing.quantity > 1) {
      existing.quantity--
    } else {
      items.value = items.value.filter(i => i.id !== dishId)
    }
    saveCart(items.value)
  }

  function getItemCount(dishId: string): number {
    return items.value.find(i => i.id === dishId)?.quantity || 0
  }

  function increment(dishId: string) {
    const existing = items.value.find(i => i.id === dishId)
    if (existing) {
      existing.quantity++
      saveCart(items.value)
    }
  }

  function decrement(dishId: string) {
    const existing = items.value.find(i => i.id === dishId)
    if (!existing) return
    if (existing.quantity > 1) {
      existing.quantity--
      saveCart(items.value)
    } else {
      removeItem(dishId)
    }
  }

  function clearCart() {
    items.value = []
    currentShopId.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { items, currentShopId, totalCount, totalPrice, isEmpty, addItem, removeItem, increment, decrement, getItemCount, clearCart }
})
