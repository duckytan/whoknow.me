/**
 * feedEngine.ts
 * v18 胡闹动态引擎 · 从订单生成假社交动态
 *
 * 每次刷新动态页时重新生成，包括随机 NPC 赞/评。
 * 不存 localStorage，纯实时生成。
 */
import type { Order } from '@/types'

// ======== NPC 文案池 ========

const COMMENT_POOL: string[] = [
  '这客人有品味 👍',
  '这菜我也爱点',
  '年轻人别熬夜',
  '我怀疑你在监视我的菜单',
  '老板今天心情不错啊',
  '这备注我服',
  '好家伙 又来了',
  '明天我也整一个',
  '深夜放毒是吧',
  '你点的我也点了',
  '这搭配 绝了',
  '笑死 老板骂得对',
  '这骑手我认识的',
  '胡闹爱好者 +1',
  '我上次也点的这个',
]

const COMMENT_AUTHOR_POOL = [
  { name: '老王烧烤', icon: '🍖' },
  { name: '佛系大叔', icon: '☕' },
  { name: '暴躁老李', icon: '🔥' },
  { name: '深夜食堂', icon: '🌙' },
  { name: '胡闹骑手小张', icon: '🏍️' },
  { name: '神秘食客', icon: '🥷' },
  { name: '煎饼侠', icon: '🥞' },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

export interface FeedComment {
  author: string
  icon: string
  text: string
}

export interface FeedItem {
  id: string
  orderId: string
  dishName: string
  dishIcon: string
  shopName: string
  shopType: string
  bossQuote: string | null
  riderQuote: string | null
  remark: string | null
  timestamp: number
  likes: number
  comments: FeedComment[]
}

/**
 * 从订单列表生成动态列表
 * 按真实时间倒序排列（最新的在前）
 */
export function generateFeed(orders: Order[]): FeedItem[] {
  // 过滤掉太旧的订单（最多显示最近 50 单）
  const recent = orders.slice(0, 50)

  return recent
    .map((o) => {
      // 找老板和骑手的 NPC 对话
      const bossTimeline = o.timeline?.find(t => t.npcQuote && ['accepted', 'cooking', 'boss_complaining'].includes(t.action as string))
      const riderTimeline = o.timeline?.find(t => t.npcQuote && ['delivering', 'rider_lost'].includes(t.action as string))
      const firstItem = o.items?.[0]

      // 随机偏移时间（±2 小时内，让动态看起来不集中在同一秒）
      const timeOffset = Math.floor(Math.random() * 7200000) - 3600000
      const displayTime = Math.max(o.createdAt + timeOffset, Date.now() - 86400000 * 7) // 最多 7 天前

      return {
        id: `feed_${o.id}`,
        orderId: o.id,
        dishName: firstItem?.name || '神秘菜品',
        dishIcon: firstItem?.image || '🍜',
        shopName: o.shopName || '某家店',
        shopType: o.shopName || '',
        bossQuote: bossTimeline?.npcQuote || null,
        riderQuote: riderTimeline?.npcQuote || null,
        remark: o.remark || null,
        timestamp: displayTime,
        likes: Math.floor(Math.random() * 8) + 1, // 1-8 个赞
        comments: generateComments(o),
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp)
}

function generateComments(order: Order): FeedComment[] {
  const count = Math.floor(Math.random() * 3) + 1 // 1-3 条评论
  const authors = pickN(COMMENT_AUTHOR_POOL, count)

  return authors.map(a => ({
    author: a.name,
    icon: a.icon,
    text: pick(COMMENT_POOL),
  }))
}

/**
 * 格式化时间显示
 */
export function formatFeedTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return `${Math.floor(days / 7)} 周前`
}
