import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AchievementConfig, AchievementState, AchievementMap, AchievementWithState } from '@/types/achievement'
import type { Order, Shop } from '@/types'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import rawAchievements from '@/config/achievements.json'

const STORAGE_KEY = STORAGE_KEYS.achievements
const ACHIEVEMENTS = rawAchievements as AchievementConfig[]

function loadState(): AchievementMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveState(state: AchievementMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    console.warn('[achievement] localStorage 写失败')
  }
}

function defState(): AchievementState {
  return { unlocked: false, claimed: false, progress: 0, unlockedAt: null, claimedAt: null }
}

function loadMetrics(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem('chaos_metrics') || '{}')
  } catch { return {} }
}

/**
 * 检测引擎：对每个成就计算进度，返回新解锁的 ID 列表
 */
function detect(
  currentOrder: Order | null,
  allOrders: Order[],
  shops: Shop[],
  currentState: AchievementMap,
): string[] {
  const newly: string[] = []
  const sorted = [...allOrders].sort((a, b) => a.createdAt - b.createdAt)
  const metrics = loadMetrics()

  for (const ach of ACHIEVEMENTS) {
    const st = currentState[ach.id] || defState()
    if (st.unlocked) continue

    const { type, value } = ach.condition
    let progress = 0

    switch (type) {
      case 'order_count':
        progress = allOrders.length
        break
      case 'order_amount':
        progress = Math.floor(allOrders.reduce((s, o) => s + o.totalPrice, 0))
        break
      case 'same_shop':
        if (currentOrder) {
          progress = allOrders.filter(o => o.shopId === currentOrder.shopId).length
        }
        break
      case 'midnight_order': {
        if (currentOrder) {
          const h = new Date(currentOrder.createdAt).getHours()
          if (h >= 0 && h <= 5) progress = 1
        }
        break
      }
      case 'remark_count':
        progress = allOrders.filter(o => o.remark && o.remark.trim().length > 0).length
        break
      case 'review_count':
        progress = allOrders.filter(o => o.review).length
        break
      case 'low_rating_count':
        progress = allOrders.filter(o => o.review && o.review.rating <= 1).length
        break
      case 'boss_anger':
        progress = sorted.filter(o => {
          const shop = shops.find(s => s.id === o.shopId)
          return shop?.bossPersonality === 'angry' && o.timeline?.some(t => t.npcQuote)
        }).length
        break
      case 'chaos_bonus':
        progress = metrics.chaos_bonus ?? 0
        break
      case 'same_dish':
        if (currentOrder) {
          for (const item of currentOrder.items) {
            const c = allOrders.filter(o => o.items.some(i => i.id === item.id)).length
            progress = Math.max(progress, c)
          }
        }
        break
    }

    st.progress = Math.min(progress, value)

    if (progress >= value) {
      st.unlocked = true
      st.unlockedAt = Date.now()
      newly.push(ach.id)
    }

    currentState[ach.id] = st
  }

  return newly
}

export const useAchievementStore = defineStore('achievement', () => {
  const state = ref<AchievementMap>(loadState())

  const list = computed<AchievementWithState[]>(() =>
    ACHIEVEMENTS.map(ach => ({ ...ach, state: state.value[ach.id] || defState() }))
  )

  const common = computed(() => list.value.filter(a => a.tier === 'common'))
  const rare = computed(() => list.value.filter(a => a.tier === 'rare'))
  const hidden = computed(() => list.value.filter(a => a.tier === 'hidden'))

  const totalCount = computed(() => ACHIEVEMENTS.length)
  const unlockedCount = computed(() => list.value.filter(a => a.state.unlocked).length)
  const claimedCount = computed(() => list.value.filter(a => a.state.claimed).length)
  const hasUnclaimed = computed(() => list.value.some(a => a.state.unlocked && !a.state.claimed))

  /**
   * 主入口：在订单/评价等操作后调用，检测成就
   * @returns 新解锁的成就 ID 列表
   */
  function check(currentOrder: Order | null, allOrders: Order[], shops: Shop[]): string[] {
    // 深度 clone 避免污染原对象
    const cloned: AchievementMap = {}
    for (const k in state.value) {
      cloned[k] = { ...state.value[k] }
    }

    const newly = detect(currentOrder, allOrders, shops, cloned)

    // 只写回有变化的
    for (const id of newly) {
      state.value[id] = cloned[id]
    }
    saveState(state.value)

    return newly
  }

  function claim(achievementId: string) {
    const s = state.value[achievementId]
    if (!s || !s.unlocked || s.claimed) return
    s.claimed = true
    s.claimedAt = Date.now()
    saveState(state.value)
  }

  function isUnlocked(id: string) { return !!state.value[id]?.unlocked }
  function isClaimed(id: string) { return !!state.value[id]?.claimed }
  function getProgress(id: string) { return state.value[id]?.progress || 0 }

  return {
    list, common, rare, hidden,
    totalCount, unlockedCount, claimedCount, hasUnclaimed,
    check, claim, isUnlocked, isClaimed, getProgress,
  }
})
