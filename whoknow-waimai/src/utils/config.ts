/**
 * 配置加载器 · 胡闹大脑接入点
 *
 * 职责：
 * 1. 加载 src/data/config.json
 * 2. 校验关键字段（轻量 schema，不引 zod）
 * 3. 提供类型安全的 getXxx() 函数
 * 4. 预留胡闹大脑远程覆盖接口（v2 启用）
 *
 * v2 接入流程（胡闹大脑上线后）：
 * - 启动 → 调 /api/chaos-brain/config → 返回最新配置
 * - 失败 → fallback 到本地 config.json
 * - 5 分钟轮询刷新
 * - overrideKeys 指定的字段优先用远程
 *
 * @author 码农虾 💻
 * @date 2026-07-22
 */

import configData from '@/data/config.json'

// ============ 类型 ============

interface CuisineRange {
  [cuisine: string]: [number, number] | string[]
}

interface Meta {
  label: string
  emoji: string
}

interface DemoSpeedOption {
  label: string
  value: number
  desc: string
}

interface LifestyleBracket {
  maxMinutes: number
  text: string
}

interface ChipStyle {
  bg: string
  fg: string
  label: string
}

// ============ Schema 校验（轻量，无依赖）============

const VALIDATION_ERRORS: string[] = []

function validateRequired(obj: any, key: string, type: 'string' | 'number' | 'object' | 'array' | 'boolean'): void {
  if (!(key in obj)) {
    VALIDATION_ERRORS.push(`❌ Missing required field: ${key}`)
    return
  }
  const val = obj[key]
  const actualType = Array.isArray(val) ? 'array' : typeof val
  if (actualType !== type) {
    VALIDATION_ERRORS.push(`❌ ${key}: expected ${type}, got ${actualType}`)
  }
}

function validateAll(): void {
  // 必填字段
  validateRequired(configData, 'cuisineCookTime', 'object')
  validateRequired(configData, 'cuisineEmoji', 'object')
  validateRequired(configData, 'riderSpeedMult', 'object')
  validateRequired(configData, 'addressTimeOffset', 'object')
  validateRequired(configData, 'addressMeta', 'object')
  validateRequired(configData, 'remarkTimeOffset', 'object')
  validateRequired(configData, 'remarkMeta', 'object')
  validateRequired(configData, 'bossSpeedMult', 'object')
  validateRequired(configData, 'bossLabels', 'object')
  validateRequired(configData, 'demoSpeedOptions', 'object')
  validateRequired(configData, 'lifestyleMap', 'object')

  // 数值范围校验
  const cuisine = configData.cuisineCookTime as any
  for (const [k, v] of Object.entries(cuisine)) {
    if (k.startsWith('_')) continue
    if (!Array.isArray(v) || v.length !== 2) {
      VALIDATION_ERRORS.push(`❌ cuisineCookTime.${k}: must be [min, max]`)
      continue
    }
    const [min, max] = v
    if (min >= max) {
      VALIDATION_ERRORS.push(`❌ cuisineCookTime.${k}: min (${min}) must be < max (${max})`)
    }
    if (min < 0) {
      VALIDATION_ERRORS.push(`❌ cuisineCookTime.${k}: min cannot be negative`)
    }
  }

  // 倍率必须 > 0
  const rider = configData.riderSpeedMult as any
  for (const [k, v] of Object.entries(rider)) {
    if (k.startsWith('_')) continue
    if (typeof v !== 'number' || v <= 0) {
      VALIDATION_ERRORS.push(`❌ riderSpeedMult.${k}: must be positive number, got ${v}`)
    }
  }

  const boss = (configData.bossSpeedMult as any) as Record<string, number>
  for (const [k, v] of Object.entries(boss)) {
    if (k.startsWith('_')) continue
    if (typeof v !== 'number' || v <= 0) {
      VALIDATION_ERRORS.push(`❌ bossSpeedMult.${k}: must be positive number, got ${v}`)
    }
  }

  if (VALIDATION_ERRORS.length > 0) {
    console.error('🚨 [config] 校验失败：')
    VALIDATION_ERRORS.forEach(e => console.error(e))
  } else {
    console.log('✅ [config] config.json 校验通过')
  }
}

// 模块加载时跑一次校验
validateAll()

// ============ 类型化 Getter ============

export function getCuisineCookTime(cuisine: string): [number, number] {
  const t = (configData.cuisineCookTime as any)[cuisine]
  if (Array.isArray(t) && typeof t[0] === 'number') {
    return t as [number, number]
  }
  return (configData.cuisineCookTime as any)._default
}

export function getCuisineEmoji(cuisine: string): string {
  const map = configData.cuisineEmoji as Record<string, string>
  return map[cuisine] || map._default || '🍳'
}

export function getRiderSpeedMult(riderId: string): number {
  const mult = (configData.riderSpeedMult as Record<string, number>)[riderId]
  return mult || 1.0
}

export function getAddressTimeOffset(address: string): number {
  return (configData.addressTimeOffset as Record<string, number>)[address] || 0
}

export function getAddressMeta(address: string): Meta {
  const map = configData.addressMeta as Record<string, Meta>
  return map[address] || { label: address, emoji: '📍' }
}

export function getRemarkTimeOffset(remark: string): number {
  if (!remark) return 0
  return (configData.remarkTimeOffset as Record<string, number>)[remark] || 0
}

export function getRemarkMeta(remark: string): Meta {
  if (!remark) return { label: '', emoji: '' }
  const map = configData.remarkMeta as Record<string, Meta>
  return map[remark] || { label: remark, emoji: '💬' }
}

export function getBossSpeedMult(personality: string): number {
  const map = configData.bossSpeedMult as Record<string, number>
  // 先查主表，再查 legacy 兼容表
  if (map[personality] !== undefined) return map[personality]
  if (map._legacy?.[personality] !== undefined) return map._legacy[personality]
  return 1.0
}

export function getBossLabel(personality: string): string {
  return (configData.bossLabels as Record<string, string>)[personality] || personality
}

export function getBossEmoji(personality: string): string {
  return (configData.bossEmoji as Record<string, string>)[personality] || '🤔'
}

export function getDemoSpeedOptions(): DemoSpeedOption[] {
  return (configData.demoSpeedOptions as any).options
}

export function getDefaultDemoSpeed(): number {
  return (configData.demoSpeedOptions as any).defaultValue
}

export function getLifestyle(realSeconds: number): string {
  const minutes = realSeconds / 60
  const brackets = configData.lifestyleMap.brackets as LifestyleBracket[]
  for (const b of brackets) {
    if (minutes < b.maxMinutes) return b.text
  }
  return (configData.lifestyleMap as any).defaultText
}

export function getChipStyle(factor: number): ChipStyle {
  if (factor > 1.05) return (configData.factorChipStyle as any).slow
  if (factor < 0.95) return (configData.factorChipStyle as any).fast
  return (configData.factorChipStyle as any).neutral
}

export function getRiderChipEmoji(mult: number): string {
  const map = configData.riderChipEmoji as Record<string, string>
  if (mult > 1.05) return map.slow
  if (mult < 0.95) return map.fast
  return map.neutral
}

// ============ 业务兜底时长（v11）============
export function getEmptyOrderSeconds(): number {
  return (configData.timingDefaults as any).emptyOrderSeconds
}
export function getCoordinationSecondsPerDish(): number {
  return (configData.timingDefaults as any).coordinationPerDishSeconds
}
export function getDoorbellSeconds(): number {
  return (configData.timingDefaults as any).doorbellSeconds
}
export function getAcceptWindow(): { min: number; random: number } {
  const t = (configData.timingDefaults as any)
  return { min: t.acceptWindowMinSeconds, random: t.acceptWindowRandomSeconds }
}
export function getComplainDurationSeconds(): number {
  return (configData.timingDefaults as any).complainDurationSeconds
}
export function getDeliveryMidProgressRatio(): number {
  return (configData.timingDefaults as any).deliveryMidProgressRatio
}
export function getImpactShow(key: 'boss' | 'rider', dir: 'slow' | 'fast'): number {
  return (configData.timingDefaults as any).impactShow[key][dir]
}

// ============ 调试 Hook ============

export function getDebugOverrides() {
  return (configData._debugHooks as any) || {}
}

export function getMeta() {
  return configData._meta as any
}

export function getBrainHooks() {
  return configData._brainHooks as any
}

// ============ 胡闹大脑接入（v2 占位）============

/**
 * v2 启用：从胡闹大脑拉远程配置
 * 当前实现：始终返回本地配置
 */
export async function fetchRemoteConfig(): Promise<any> {
  const hooks = getBrainHooks()
  if (!hooks.enabled) {
    return configData
  }

  try {
    const res = await fetch(hooks.endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const remote = await res.json()

    // 合并 overrideKeys
    const merged = { ...configData }
    if (Array.isArray(hooks.overrideKeys)) {
      for (const key of hooks.overrideKeys) {
        if (key in remote) {
          merged[key] = remote[key]
        }
      }
    }
    console.log('✅ [config] 已加载胡闹大脑远程配置', Object.keys(hooks.overrideKeys || {}))
    return merged
  } catch (err) {
    console.warn('⚠️ [config] 远程配置拉取失败，使用本地', err)
    return configData
  }
}

/**
 * v2 启用：5 分钟轮询刷新
 */
export function startConfigPolling(): () => void {
  const hooks = getBrainHooks()
  if (!hooks.enabled || !hooks.refreshIntervalSec) {
    return () => {} // noop
  }

  const interval = hooks.refreshIntervalSec * 1000
  const timer = setInterval(() => {
    fetchRemoteConfig().catch(() => {})
  }, interval)

  return () => clearInterval(timer)
}