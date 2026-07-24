/**
 * metrics.ts · v17 数据指标自埋点（7-23 锡哥拍板 · 决策 #023）
 *
 * 决策：localStorage 自埋点 4 维指标，零成本、零后端、零合规风险
 *
 * 用法：
 *   import { track, trackEvent } from '@/utils/metrics'
 *   track('onboarding_complete')
 *   trackEvent('shop_click', { shopId: 's001' })
 *
 * 看数据：
 *   DevTools → Application → LocalStorage → chaos_metrics → 截图
 *
 * 关键事件清单（7 个）：
 * - onboarding_complete    （v14 OnboardingGuide）
 * - shop_click             （ShopCard 点击）
 * - dish_add               （DishList 加购）
 * - order_submit           （Checkout 提交）
 * - review_submit          （ReviewModal 提交）
 * - review_share           （ReviewModal 分享）
 * - page_error             （全局错误捕获）
 */

const STORAGE_KEY = 'chaos_metrics'

interface MetricsData {
  [event: string]: number | Record<string, any> | undefined
}

/**
 * 读取 metrics 对象
 */
function readMetrics(): MetricsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as MetricsData
  } catch {
    return {}
  }
}

/**
 * 写入 metrics 对象（原子）
 */
function writeMetrics(data: MetricsData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    // localStorage 满（5MB 上限）或不可用
    return false
  }
}

/**
 * 追踪事件（无附加数据）
 */
export function track(event: string): void {
  const data = readMetrics()
  const current = (data[event] as number) || 0
  data[event] = current + 1
  // v17 同时更新最后访问时间
  data['_last_event'] = { event, ts: Date.now() }
  writeMetrics(data)
}

/**
 * 追踪事件（带附加数据）
 */
export function trackEvent(
  event: string,
  payload?: Record<string, any>
): void {
  const data = readMetrics()
  const current = (data[event] as number) || 0
  data[event] = current + 1
  data[`${event}_last`] = { ...payload, ts: Date.now() }
  writeMetrics(data)
}

/**
 * 读取所有 metrics（用于 DevTools 调试或导出）
 */
export function getAllMetrics(): MetricsData {
  return readMetrics()
}

/**
 * 清空 metrics（仅调试用）
 */
export function clearMetrics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * 导出为可读字符串（DevTools 直接看）
 */
export function dumpMetrics(): string {
  const data = readMetrics()
  const lines: string[] = []
  lines.push('=== 胡闹外卖 · 埋点数据 ===')
  lines.push(`更新于：${new Date().toLocaleString('zh-CN')}`)
  lines.push('')

  // 排序输出
  const events = Object.keys(data).sort()
  for (const key of events) {
    if (key.startsWith('_')) continue
    lines.push(`${key}: ${data[key]}`)
  }

  lines.push('')
  lines.push('=== 事件详情（最近一次）===')
  for (const key of events) {
    if (key.endsWith('_last') && typeof data[key] === 'object') {
      lines.push(`${key}: ${JSON.stringify(data[key])}`)
    }
  }
  return lines.join('\n')
}

/**
 * 全局错误捕获（在 main.ts 一次性注册）
 */
export function installErrorTracking(): void {
  if (typeof window === 'undefined') return

  // 捕获 JS 运行时错误
  window.addEventListener('error', (e) => {
    trackEvent('page_error', {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
    })
  })

  // 捕获 Promise 未处理拒绝
  window.addEventListener('unhandledrejection', (e) => {
    trackEvent('page_error', {
      type: 'unhandledrejection',
      reason: String(e.reason),
    })
  })
}