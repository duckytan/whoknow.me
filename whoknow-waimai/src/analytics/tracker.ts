// src/analytics/tracker.ts
// 胡闹外卖 · 轻量客户端埋点（上线后验证钩子，替代笑率闸门）
//
// 设计原则（主理人拍板"前期能省则省"）：
//   - 纯前端、零第三方依赖、不引分析库。
//   - 事件先落 localStorage；可选 beacon 到后端（默认关闭）。
//   - 无 localStorage 环境（如 node 测试）自动回退内存，保证可测、不崩。
//
// 跨项目配合：事件 schema 预留 app + context（地址×备注），
//   未来 whoknow-brain 的"反馈加权自我进化"可直接消费这批信号。

export type WaimaiEvent = 'share_click' | 'replay'

export interface TrackContext {
  addressTag?: string
  remarkTag?: string
  [key: string]: unknown
}

// 后端接入点：前期留空（不接）；后期"该花就花"时填 Vercel/自建端点。
// 填了之后，每次 track 会用 navigator.sendBeacon 异步上报（失败静默）。
const ANALYTICS_ENDPOINT = ''

const STORAGE_KEY = 'whoknow_waimai_events_v1'

interface StoredEvent {
  t: number
  e: WaimaiEvent
  ctx?: TrackContext
}

// 内存回退存储（node / 隐私模式用），模块级单例，跨调用共享。
let memStore: string | null = null

function read(): StoredEvent[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : memStore
    return raw ? (JSON.parse(raw) as StoredEvent[]) : []
  } catch {
    return []
  }
}

function write(events: StoredEvent[]): void {
  const payload = JSON.stringify(events)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, payload)
    } else {
      memStore = payload
    }
  } catch {
    // 隐私模式 / 容量满 / 无存储：静默丢弃，不影响主流程
  }
}

export function track(event: WaimaiEvent, ctx?: TrackContext): void {
  const next = read()
  next.push({ t: Date.now(), e: event, ctx })
  if (next.length > 500) next.splice(0, next.length - 500) // 控制体积
  write(next)

  if (
    ANALYTICS_ENDPOINT &&
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function'
  ) {
    try {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify({ app: 'waimai', event, ctx, t: Date.now() }))
    } catch {
      // 上报失败静默
    }
  }
}

export interface EventStats {
  share_click: number
  replay: number
  total: number
}

export function getStats(): EventStats {
  const events = read()
  const stats: EventStats = { share_click: 0, replay: 0, total: events.length }
  for (const ev of events) stats[ev.e] += 1
  return stats
}

export function clearStats(): void {
  write([])
}
