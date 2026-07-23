import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order } from '@/types'
import { sanitizeQuote } from '@/utils/npcEngine'
import { STORAGE_KEYS } from '@/utils/storageKeys'

const STORAGE_KEY = STORAGE_KEYS.orders

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: Order[] = raw ? JSON.parse(raw) : []
    // 启动时清洗历史脏数据（v10 防御性兜底）
    return list.map(o => ({
      ...o,
      timeline: o.timeline?.map(t => ({
        ...t,
        npcQuote: t.npcQuote ? sanitizeQuote(t.npcQuote) : t.npcQuote,
      })) || [],
    }))
  } catch {
    return []
  }
}

function saveOrders(orders: Order[]) {
  // v18 P0 bug fix（7-23 锡哥拍板）· 实测 QuotaExceededError 真实抛错
  // 加 try/catch：localStorage 写满 / 隐私模式 / 不能用 → 静默丢弃，不冒泡到 UI
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch (e) {
    console.warn('[order] localStorage 写失败:', (e as Error).name)
  }
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>(loadOrders())
  const currentOrderId = ref<string | null>(null)

  const currentOrder = () =>
    orders.value.find(o => o.id === currentOrderId.value) || null

  function createOrder(order: Order) {
    orders.value.unshift(order)
    currentOrderId.value = order.id
    saveOrders(orders.value)
  }

  function updateOrderStatus(orderId: string, status: Order['status'], npcQuote?: string) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return
    order.status = status
    order.timeline.push({
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: statusLabel(status),
      npcQuote: npcQuote ? sanitizeQuote(npcQuote) : npcQuote,
    })
    saveOrders(orders.value)
  }

  function getOrderById(id: string) {
    return orders.value.find(o => o.id === id) || null
  }

  function assignRider(orderId: string, riderId: string) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return
    order.riderId = riderId
    saveOrders(orders.value)
  }

  function addReview(orderId: string, review: import('@/types').Review) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return
    order.review = review
    saveOrders(orders.value)
  }

  return { orders, currentOrderId, currentOrder, createOrder, updateOrderStatus, getOrderById, assignRider, addReview }
})

function statusLabel(status: Order['status']): string {
  const map: Record<Order['status'], string> = {
    pending: '等待商家接单',
    accepted: '商家已接单',
    cooking: '正在出餐',
    delivering: '骑手配送中',
    completed: '已送达',
    boss_complaining: '老板在叨叨',
    rider_lost: '骑手迷路了',
  }
  return map[status] || status
}
