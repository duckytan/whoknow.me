/**
 * 真实时间系统 —— 出餐/配送按真实时间计算，胡闹因素影响快慢
 *
 * 设计：现实外卖 30-45 分钟，这里用真实秒数（demo 可调速）
 * - 1 倍速 = 真实秒数
 * - 30 倍速 = 1/30 秒数（demo 默认加速）
 * - 100 倍速 = 1/100 秒数（快速预览）
 *
 * v3 升级（7-22 · 三司会审后）：
 * - 菜品分类覆盖 25+ 类（保守版）
 * - 老板性格覆盖 5 个真实性格
 * - factors 包含 5 维（菜系/老板/地址/备注/骑手）
 * - 新增 demoLifestyle 生活映射
 */

import type { Dish } from '@/types'
import ridersData from '@/data/riders.json'

// ============ 菜系 → 出餐时间范围（秒）============
const CUISINE_COOK_TIME: Record<string, [number, number]> = {
  "烧烤": [
    480,
    900
  ],
  "烤串": [
    480,
    900
  ],
  "烤肉": [
    600,
    900
  ],
  "烤鱼": [
    720,
    1080
  ],
  "烤海鲜": [
    600,
    1080
  ],
  "烤蔬菜": [
    300,
    480
  ],
  "麻辣烫": [
    300,
    480
  ],
  "香锅": [
    360,
    600
  ],
  "川菜": [
    480,
    720
  ],
  "小炒": [
    300,
    480
  ],
  "小炒鸡": [
    360,
    540
  ],
  "家常菜": [
    360,
    600
  ],
  "便当": [
    180,
    300
  ],
  "盖浇饭": [
    180,
    360
  ],
  "套餐": [
    240,
    420
  ],
  "粥": [
    600,
    900
  ],
  "寿司": [
    480,
    720
  ],
  "刺身": [
    300,
    480
  ],
  "卷物": [
    300,
    480
  ],
  "饭团": [
    180,
    300
  ],
  "料理": [
    600,
    1200
  ],
  "拉面": [
    420,
    720
  ],
  "拌面": [
    300,
    480
  ],
  "面食": [
    360,
    600
  ],
  "饺子": [
    600,
    900
  ],
  "火锅": [
    600,
    1200
  ],
  "汉堡": [
    300,
    480
  ],
  "披萨": [
    600,
    900
  ],
  "三明治": [
    180,
    300
  ],
  "黄焖鸡": [
    720,
    1080
  ],
  "奶茶": [
    120,
    240
  ],
  "茶饮": [
    120,
    240
  ],
  "咖啡": [
    120,
    240
  ],
  "豆浆": [
    120,
    180
  ],
  "热饮": [
    120,
    240
  ],
  "冷饮": [
    60,
    180
  ],
  "甜品": [
    180,
    360
  ],
  "点心": [
    300,
    600
  ],
  "炸鸡": [
    480,
    720
  ],
  "炸物": [
    360,
    600
  ],
  "卤味": [
    300,
    600
  ],
  "凉拌": [
    180,
    300
  ],
  "汤": [
    600,
    900
  ],
  "煲仔饭": [
    720,
    1080
  ],
  "炖肉": [
    900,
    1500
  ],
  "咖喱": [
    480,
    720
  ],
  "米粉": [
    300,
    480
  ],
  "硬菜": [
    600,
    1200
  ],
  "主食": [
    300,
    600
  ],
  "特色": [
    360,
    720
  ],
  "轻食": [
    180,
    360
  ],
  "素菜": [
    240,
    480
  ],
  "素食": [
    360,
    600
  ],
  "零食": [
    60,
    180
  ],
  "丸子": [
    300,
    480
  ],
  "小食": [
    180,
    360
  ],
  "小吃": [
    240,
    480
  ],
  "海鲜饭": [
    600,
    900
  ],
  "其他": [
    300,
    600
  ]
}

// ============ 骑手性格 → 配送速度倍率 ============
const RIDER_SPEED_MULT: Record<string, number> = {
  "r001": 0.7,
  "r002": 1.5,
  "r003": 1.2,
  "r004": 0.85,
  "r005": 1.0
}

// 骑手姓名映射（从 riders.json 直接读取）
const RIDER_NAMES: Record<string, string> = {
  "r001": "雷速飞",
  "r002": "李慢慢",
  "r003": "张迷路",
  "r004": "王大力",
  "r005": "赵飘飘"
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
  "angry": 1.2,
  "lazy": 1.5,
  "gentle": 0.9,
  "weird": 1.5,
  "philosophical": 1.3,
  "zen": 0.9,
  "cool": 1.0,
  "warm": 0.95,
  "silly": 1.1,
  "mystery": 1.0,
  "chaotic": 1.3
}

// ============ 老板性格 → 文案标签 ============
const BOSS_LABELS: Record<string, string> = {
  angry: '暴躁',
  gentle: '温柔',
  lazy: '拖延',
  weird: '诡异',
  philosophical: '哲学',
}

// ============ 计算单菜出餐时间 ============
export function getDishCookTime(dish: Dish): number {
  const [min, max] = CUISINE_COOK_TIME[dish.category] || CUISINE_COOK_TIME.其他
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
  distance: number,
  riderId: string,
  address: string,
  remark: string,
): number {
  const baseTimePerKm = 120 + Math.random() * 60 // 2-3 分钟 = 120-180s
  const baseTime = distance * baseTimePerKm
  const riderMult = RIDER_SPEED_MULT[riderId] || 1.0
  const addrOffset = ADDRESS_TIME_OFFSET[address] || 0
  let remarkOffset = 0
  if (remark) {
    remarkOffset = REMARK_TIME_OFFSET[remark] || 0
  }
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

// ============ 估算总时长 ============
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
  key: string          // 内部键
  label: string        // UI 显示
  impact: number       // 影响秒数（正负都可）
  emoji: string        // 前缀 emoji
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
    const minutes = Math.ceil(cookTime / 60)
    factors.push({
      key: 'cuisine',
      label: `最长 ${longest.category} 菜`,
      impact: cookTime,
      emoji: longest.category === '烧烤' ? '🍢' :
             longest.category === '奶茶' || longest.category === '咖啡' ? '🧋' :
             longest.category === '麻辣烫' ? '🌶️' :
             longest.category === '饺子' ? '🥟' :
             longest.category === '汉堡' ? '🍔' : '🍳',
    })
  }

  // 2. 老板性格
  const bossMult = BOSS_SPEED_MULT[bossPersonality]
  if (bossMult && bossMult !== 1.0) {
    const bossLabel = BOSS_LABELS[bossPersonality] || bossPersonality
    factors.push({
      key: 'boss',
      label: `${bossLabel}老板 ×${bossMult}`,
      impact: bossMult > 1 ? 60 : -30,
      emoji: bossMult > 1 ? '😤' : '😊',
    })
  }

  // 3. 地址偏移
  const addrOffset = ADDRESS_TIME_OFFSET[address]
  if (addrOffset && addrOffset > 0) {
    const addrMap: Record<string, [string, string]> = {
      百慕大: ['跨洋配送', '🗺️'],
      ICU: ['医院门禁', '🏥'],
      公厕: ['骑手犹豫', '🚽'],
      公司: ['前台登记', '💼'],
      学校: ['上楼配送', '🎒'],
    }
    const [label, emoji] = addrMap[address] || [address, '📍']
    factors.push({
      key: 'address',
      label: `${label} +${addrOffset / 60} 分钟`,
      impact: addrOffset,
      emoji,
    })
  }

  // 4. 备注偏移
  if (remark) {
    const remarkOffset = REMARK_TIME_OFFSET[remark]
    if (remarkOffset && remarkOffset !== 0) {
      const remarkMap: Record<string, [string, string]> = {
        表演才艺: ['老板表演才艺', '🎤'],
        多放辣: ['多备辣椒', '🌶️'],
        不要香菜: ['挑选香菜', '🌿'],
        别骂了: ['老板收敛', '🙏'],
        老板辛苦了: ['老板开心', '😊'],
      }
      const [label, emoji] = remarkMap[remark] || [remark, '💬']
      factors.push({
        key: 'remark',
        label: remarkOffset > 0 ? `${label} +${remarkOffset} 秒` : `${label} ${remarkOffset} 秒`,
        impact: remarkOffset,
        emoji,
      })
    }
  }

  // 5. 骑手
  const riderMult = RIDER_SPEED_MULT[riderId]
  if (riderMult && riderMult !== 1.0) {
    const riderName = RIDER_NAMES[riderId] || '骑手'
    factors.push({
      key: 'rider',
      label: `${riderName} ×${riderMult}`,
      impact: riderMult > 1 ? 120 : -90,
      emoji: riderMult > 1 ? '🐢' : '⚡',
    })
  }

  return factors
}

// ============ demo 加速倍率（可由用户调整）============
export const DEMO_SPEED_OPTIONS = [
  { label: '×1 真实', value: 1, desc: '完全真实时间（30-45 分钟）' },
  { label: '×5 快速', value: 5, desc: '压缩到 6-9 分钟' },
  { label: '×30 demo', value: 30, desc: '1 分钟左右看完剧情' },
  { label: '×100 跳过', value: 100, desc: '10 秒走完一单' },
]

export function getDemoSpeed(): number {
  try {
    const stored = localStorage.getItem('chaos_demo_speed')
    if (!stored) return 30
    const speed = parseInt(stored)
    return speed > 0 ? speed : 30
  } catch {
    return 30
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
  const minutes = realSeconds / 60
  if (minutes < 3) return '☕ 一杯咖啡的时间'
  if (minutes < 8) return '📱 刷个短视频'
  if (minutes < 15) return '🍜 一顿饭'
  if (minutes < 25) return '📺 追一集剧'
  if (minutes < 40) return '🎬 看场电影'
  if (minutes < 60) return '🛀 泡个澡'
  if (minutes < 120) return '🛌 睡个午觉'
  return '🌙 半部《甄嬛传》'
}
