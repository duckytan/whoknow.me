/**
 * 真实时间系统 —— 出餐/配送按真实时间计算，胡闹因素影响快慢
 *
 * 设计：现实外卖 30-45 分钟，这里用真实秒数（demo 可调速）
 * - 1 倍速 = 真实秒数
 * - 10 倍速 = 1/10 秒数（demo 默认加速）
 * - 100 倍速 = 1/100 秒数（快速预览）
 */

import type { Dish } from '@/types'
import quotesData from '@/data/quotes.json'

// ============ 菜系 → 出餐时间范围（秒）============
const CUISINE_COOK_TIME: Record<string, [number, number]> = {
  烧烤: [480, 900],     // 8-15 分钟
  麻辣烫: [300, 480],   // 5-8 分钟
  川菜: [480, 720],     // 8-12 分钟
  家常菜: [360, 600],   // 6-10 分钟
  便当: [180, 300],     // 3-5 分钟
  粥: [600, 900],      // 10-15 分钟
  寿司: [480, 720],     // 8-12 分钟
  料理: [600, 1200],    // 10-20 分钟
  汉堡: [300, 480],     // 5-8 分钟
  黄焖鸡: [720, 1080],  // 12-18 分钟
  奶茶: [120, 240],     // 2-4 分钟
  饺子: [600, 900],     // 10-15 分钟
  豆浆: [120, 180],     // 2-3 分钟
  其他: [300, 600],     // 5-10 分钟
}

// ============ 骑手性格 → 配送速度倍率 ============
const RIDER_SPEED_MULT: Record<string, number> = {
  r001: 0.7,  // 雷速飞 ⚡ — 闪电快
  r002: 1.5,  // 李慢慢 🐢 — 慢吞吞
  r003: 1.2,  // 张迷路 🗺️ — 慢 + 容易迷路
  r004: 0.85, // 王大力 💪 — 快
  r005: 1.0,  // 赵飘飘 🌸 — 普通
}

// ============ 地址 → 时间偏移（秒）============
const ADDRESS_TIME_OFFSET: Record<string, number> = {
  家庭: 0,
  学校: 30,         // 上楼 +30s
  公司: 60,         // 前台登记 +1min
  公厕: 180,        // 骑手犹豫 +3min
  百慕大: 600,      // 跨洋 +10min
  ICU: 300,         // 医院门禁 +5min
}

// ============ 备注 → 时间偏移（秒）============
const REMARK_TIME_OFFSET: Record<string, number> = {
  多放辣: 30,       // 多备料 +30s
  少放辣: 0,
  不要香菜: 10,
  别骂了: -20,      // 老板心情好 -20s
  表演才艺: 180,    // 老板演节目 +3min
  老板辛苦了: -30,  // 老板开心 -30s
}

// ============ 老板性格 → 出餐速度倍率 ============
const BOSS_SPEED_MULT: Record<string, number> = {
  angry: 1.2,       // 暴躁老板：骂骂咧咧但手快
  lazy: 1.5,        // 拖延：摸鱼
  zen: 0.9,         // 禅意：从容
  cool: 1.0,        // 酷：标准
  warm: 0.95,       // 暖心：稍快（讨好顾客）
  silly: 1.1,       // 戏精：边演边做
  mystery: 1.0,     // 神秘：标准
  chaotic: 1.3,     // 实验料理：反复尝试
}

// ============ 计算单菜出餐时间 ============
export function getDishCookTime(dish: Dish): number {
  const [min, max] = CUISINE_COOK_TIME[dish.category] || CUISINE_COOK_TIME.其他
  // 同店多菜 → 并行出餐（取最长一道 + 5 分钟）
  return min + Math.random() * (max - min)
}

// ============ 计算订单总出餐时间 ============
export function getOrderCookTime(dishes: Dish[], bossPersonality: string): number {
  if (dishes.length === 0) return 300
  // 多菜并行，取最长 + 协调时间
  const maxCookTime = Math.max(...dishes.map(getDishCookTime))
  const coordinationTime = (dishes.length - 1) * 30 // 每多一道 +30s 协调
  const bossMult = BOSS_SPEED_MULT[bossPersonality] || 1.0
  return Math.round((maxCookTime + coordinationTime) * bossMult)
}

// ============ 计算配送时间 ============
export function getDeliveryTime(
  distance: number,      // km
  riderId: string,
  address: string,
  remark: string,
): number {
  // 基础：每公里 2-3 分钟
  const baseTimePerKm = 120 + Math.random() * 60 // 2-3 分钟 = 120-180s
  const baseTime = distance * baseTimePerKm

  // 骑手倍率
  const riderMult = RIDER_SPEED_MULT[riderId] || 1.0

  // 地址偏移
  const addrOffset = ADDRESS_TIME_OFFSET[address] || 0

  // 备注偏移（重复叠加）
  let remarkOffset = 0
  if (remark) {
    remarkOffset = REMARK_TIME_OFFSET[remark] || 0
  }

  return Math.round(baseTime * riderMult + addrOffset + remarkOffset)
}

// ============ 计算完整时间线 ============
export interface OrderTimeEstimate {
  accept: number         // 商家接单耗时（秒）
  cooking: number        // 出餐耗时（秒）
  riderGrab: number      // 骑手抢单耗时（秒）
  delivery: number       // 配送耗时（秒）
  doorbell: number       // 送达后等门铃（秒）
  total: number          // 总时长（秒）
}

export function calcOrderTime(
  dishes: Dish[],
  bossPersonality: string,
  distance: number,
  riderId: string,
  address: string,
  remark: string,
): OrderTimeEstimate {
  const accept = 30 + Math.random() * 60        // 30-90s 接单
  const cooking = getOrderCookTime(dishes, bossPersonality)
  const riderGrab = 60 + Math.random() * 120   // 1-3 分钟骑手抢单
  const delivery = getDeliveryTime(distance, riderId, address, remark)
  const doorbell = 30                          // 30s 按门铃

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

// ============ 估算总时长（用于 UI 显示）============
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

// ============ 时间偏移解说（用于 UI）============
export function getTimeOffsetExplanation(address: string, remark: string, bossPersonality: string, riderId: string): string[] {
  const explanations: string[] = []

  const addrOffset = ADDRESS_TIME_OFFSET[address]
  if (addrOffset && addrOffset > 0) {
    if (address === '百慕大') explanations.push(`🗺️ 跨洋配送 +${addrOffset / 60} 分钟`)
    else if (address === 'ICU') explanations.push(`🏥 医院门禁 +${addrOffset / 60} 分钟`)
    else if (address === '公厕') explanations.push(`🚽 骑手心理建设 +${addrOffset / 60} 分钟`)
    else if (address === '公司') explanations.push(`💼 前台登记 +${addrOffset / 60} 分钟`)
    else if (address === '学校') explanations.push(`🎒 上楼配送 +${addrOffset / 60} 分钟`)
  }

  if (remark) {
    const remarkOffset = REMARK_TIME_OFFSET[remark]
    if (remarkOffset && remarkOffset > 0) {
      if (remark === '表演才艺') explanations.push(`🎤 老板表演才艺 +${remarkOffset / 60} 分钟`)
      else if (remark === '多放辣') explanations.push(`🌶️ 多备辣椒 +${remarkOffset} 秒`)
    } else if (remarkOffset && remarkOffset < 0) {
      if (remark === '老板辛苦了') explanations.push(`😊 老板开心 ${remarkOffset} 秒`)
      else if (remark === '别骂了') explanations.push(`🙏 老板收敛 ${remarkOffset} 秒`)
    }
  }

  const riderMult = RIDER_SPEED_MULT[riderId]
  if (riderMult && riderMult !== 1.0) {
    const riderName = quotesData.riders?.[riderId as keyof typeof quotesData.riders] as any
    const name = riderName?.name || '骑手'
    if (riderMult > 1) explanations.push(`${name}配送 ×${riderMult}（慢）`)
    else explanations.push(`${name}配送 ×${riderMult}（快）`)
  }

  const bossMult = BOSS_SPEED_MULT[bossPersonality]
  if (bossMult && bossMult !== 1.0) {
    if (bossMult > 1) explanations.push(`老板性格：出餐 ×${bossMult}（慢）`)
    else explanations.push(`老板性格：出餐 ×${bossMult}（快）`)
  }

  return explanations
}

// ============ demo 加速倍率（可由用户调整）============
export const DEMO_SPEED_OPTIONS = [
  { label: '×1 真实', value: 1, desc: '完全真实时间（30-45 分钟）' },
  { label: '×5 快速', value: 5, desc: '压缩到 6-9 分钟' },
  { label: '×30 demo', value: 30, desc: '1 分钟左右看完剧情' },
  { label: '×100 跳过', value: 100, desc: '10 秒走完一单（只看不体验）' },
]

export function getDemoSpeed(): number {
  // 默认 30 倍速 · demo 推荐值
  try {
    const stored = localStorage.getItem('chaos_demo_speed')
    return stored ? parseInt(stored) : 30
  } catch {
    return 30
  }
}

export function setDemoSpeed(speed: number) {
  try {
    localStorage.setItem('chaos_demo_speed', String(speed))
  } catch {}
}

// ============ 真实秒数 → demo 秒数（应用倍率）============
export function applyDemoSpeed(realSeconds: number): number {
  const speed = getDemoSpeed()
  return Math.max(1, Math.round(realSeconds / speed))
}
