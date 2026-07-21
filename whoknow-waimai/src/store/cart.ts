import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Dish } from '@/types'

const STORAGE_KEY = 'chaos_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
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

  function clearCart() {
    items.value = []
    currentShopId.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { items, currentShopId, totalCount, totalPrice, isEmpty, addItem, removeItem, getItemCount, clearCart }
})
