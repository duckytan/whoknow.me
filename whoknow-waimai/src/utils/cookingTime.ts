/**
 * 真实时间系统 —— 出餐/配送按真实时间计算，胡闹因素影响快慢
 *
 * 设计：现实外卖 30-45 分钟，这里用真实秒数（demo 可调速）
 * - 1 倍速 = 真实秒数
 * - 30 倍速 = 1/30 秒数（demo 默认加速）
 * - 100 倍速 = 1/100 秒数（快速预览）
 *
 * v4 重构（7-22 · 接入胡闹大脑）：
 * - 所有参数从 config.json 读取
 * - 业务代码不写死任何倍率/时间
 * - 预留胡闹大脑 v2 接口
 */

import type { Dish } from '@/types'
import ridersData from '@/data/riders.json'
import {
  getCuisineCookTime,
  getCuisineEmoji,
  getRiderSpeedMult,
  getAddressTimeOffset,
  getAddressMeta,
  getRemarkTimeOffset,
  getRemarkMeta,
  getBossSpeedMult,
  getBossLabel,
  getBossEmoji,
  getLifestyle as _getLifestyle,
  getChipStyle,
  getRiderChipEmoji,
  getDefaultDemoSpeed,
  getDemoSpeedOptions,
} from './config'

// ============ 骑手姓名（从 riders.json 读取，避免重复）============
const RIDER_NAMES: Record<string, string> = {}
for (const r of ridersData as any[]) {
  RIDER_NAMES[r.id] = r.name
}

// ============ 计算单菜出餐时间 ============
export function getDishCookTime(dish: Dish): number {
  const [min, max] = getCuisineCookTime(dish.category)
  return min + Math.random() * (max - min)
}

// ============ 计算订单总出餐时间 ============
export function getOrderCookTime(dishes: Dish[], bossPersonality: string): number {
  if (dishes.length === 0) return 300
  const maxCookTime = Math.max(...dishes.map(getDishCookTime))
  const coordinationTime = (dishes.length - 1) * 30
  const bossMult = getBossSpeedMult(bossPersonality)
  return Math.round((maxCookTime + coordinationTime) * bossMult)
}

// ============ 计算配送时间 ============
export function getDeliveryTime(
  distance: number,
  riderId: string,
  address: string,
  remark: string,
): number {
  const baseTimePerKm = 120 + Math.random() * 60
  const baseTime = distance * baseTimePerKm
  const riderMult = getRiderSpeedMult(riderId)
  const addrOffset = getAddressTimeOffset(address)
  const remarkOffset = getRemarkTimeOffset(remark)
  return Math.round(baseTime * riderMult + addrOffset + remarkOffset)
}

// ============ 计算完整时间线 ============
export interface OrderTimeEstimate {
  accept: number
  cooking: number
  riderGrab: number
  delivery: number
  doorbell: number
  total: number
}

export function calcOrderTime(
  dishes: Dish[],
  bossPersonality: string,
  distance: number,
  riderId: string,
  address: string,
  remark: string,
): OrderTimeEstimate {
  const accept = 30 + Math.random() * 60
  const cooking = getOrderCookTime(dishes, bossPersonality)
  const riderGrab = 60 + Math.random() * 120
  const delivery = getDeliveryTime(distance, riderId, address, remark)
  const doorbell = 30

  return {
    accept: Math.round(accept),
    cooking,
    riderGrab: Math.round(riderGrab),
    delivery,
    doorbell,
    total: Math.round(accept + cooking + riderGrab + delivery + doorbell),
  }
}

// ============ 格式化 mm:ss ============
export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0
  const mm = Math.floor(seconds / 60)
  const ss = Math.floor(seconds % 60)
  return `${mm}:${ss.toString().padStart(2, '0')}`
}

// ============ 估算总时长（分钟）============
export function estimateTotalMinutes(
  dishes: Dish[],
  bossPersonality: string,
  distance: number,
  riderId: string,
  address: string,
  remark: string,
): number {
  const est = calcOrderTime(dishes, bossPersonality, distance, riderId, address, remark)
  return Math.ceil(est.total / 60)
}

// ============ 5 维影响因子（chip 文案）============
export interface FactorItem {
  key: string
  label: string
  impact: number
  emoji: string
  mult?: number
}

export function getTimeOffsetExplanation(
  dishes: Dish[],
  bossPersonality: string,
  address: string,
  remark: string,
  riderId: string,
): FactorItem[] {
  const factors: FactorItem[] = []

  // 1. 菜系（最长一道的影响）
  if (dishes.length > 0) {
    const longest = dishes.reduce((a, b) =>
      getDishCookTime(a) > getDishCookTime(b) ? a : b
    )
    const cookTime = Math.round(getDishCookTime(longest))
    factors.push({
      key: 'cuisine',
      label: `${longest.name}（${longest.category}）`,
      impact: cookTime,
      emoji: getCuisineEmoji(longest.category),
    })
  }

  // 2. 老板性格
  const bossMult = getBossSpeedMult(bossPersonality)
  if (bossMult !== 1.0) {
    factors.push({
      key: 'boss',
      label: `${getBossLabel(bossPersonality)}老板 ×${bossMult}`,
      impact: bossMult > 1 ? 60 : -30,
      emoji: getBossEmoji(bossPersonality),
      mult: bossMult,
    })
  }

  // 3. 地址偏移
  const addrOffset = getAddressTimeOffset(address)
  if (addrOffset > 0) {
    const meta = getAddressMeta(address)
    factors.push({
      key: 'address',
      label: `${meta.label} +${addrOffset / 60} 分钟`,
      impact: addrOffset,
      emoji: meta.emoji,
    })
  }

  // 4. 备注偏移
  if (remark) {
    const remarkOffset = getRemarkTimeOffset(remark)
    if (remarkOffset !== 0) {
      const meta = getRemarkMeta(remark)
      const sign = remarkOffset > 0 ? '+' : ''
      const unit = Math.abs(remarkOffset) >= 60 ? `${remarkOffset / 60} 分钟` : `${remarkOffset} 秒`
      factors.push({
        key: 'remark',
        label: `${meta.label} ${sign}${unit}`,
        impact: remarkOffset,
        emoji: meta.emoji,
      })
    }
  }

  // 5. 骑手
  const riderMult = getRiderSpeedMult(riderId)
  if (riderMult !== 1.0) {
    const riderName = RIDER_NAMES[riderId] || '骑手'
    factors.push({
      key: 'rider',
      label: `${riderName} ×${riderMult}`,
      impact: riderMult > 1 ? 120 : -90,
      emoji: getRiderChipEmoji(riderMult),
      mult: riderMult,
    })
  }

  return factors
}

// ============ demo 加速倍率（可由用户调整）============
// 兼容旧名导出（OrderDetail.vue 用了）
export const DEMO_SPEED_OPTIONS = getDemoSpeedOptions()
export { getDemoSpeedOptions }

export function getDemoSpeed(): number {
  try {
    const stored = localStorage.getItem('chaos_demo_speed')
    if (!stored) return getDefaultDemoSpeed()
    const speed = parseInt(stored)
    return speed > 0 ? speed : getDefaultDemoSpeed()
  } catch {
    return getDefaultDemoSpeed()
  }
}

export function setDemoSpeed(speed: number) {
  if (speed <= 0 || !Number.isFinite(speed)) return
  try {
    localStorage.setItem('chaos_demo_speed', String(speed))
  } catch {}
}

// ============ 真实秒数 → demo 秒数（应用倍率）============
export function applyDemoSpeed(realSeconds: number): number {
  const speed = getDemoSpeed()
  return Math.max(1, Math.round(realSeconds / speed))
}

// ============ 生活映射（戏剧反差 · P0-D）============
export function getDemoLifestyle(realSeconds: number): string {
  return _getLifestyle(realSeconds)
}
