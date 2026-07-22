import { useOrderStore } from '@/store/order'
import type { Order } from '@/types'
import quotesData from '@/data/quotes.json'

// ============ 骑手信息 ============
const RIDER_INFO: Record<string, { name: string; avatar: string }> = {
  r001: { name: '雷速飞', avatar: '⚡' },
  r002: { name: '李慢慢', avatar: '🐢' },
  r003: { name: '张迷路', avatar: '🗺️' },
  r004: { name: '王大力', avatar: '💪' },
  r005: { name: '赵飘飘', avatar: '🌸' },
}

// ============ 话术变量填充 ============
interface QuoteVars {
  shopName?: string
  dishName?: string
  riderName?: string
  userName?: string
  orderNum?: string
  eventCount?: string
  address?: string
  remark?: string
}

function fillVars(template: string, vars: QuoteVars): string {
  return template
    .replace(/\{shopName\}/g, vars.shopName || '本店')
    .replace(/\{dishName\}/g, vars.dishName || '美食')
    .replace(/\{riderName\}/g, vars.riderName || '骑手')
    .replace(/\{userName\}/g, vars.userName || '顾客')
    .replace(/\{orderNum\}/g, vars.orderNum || String(Math.floor(Math.random() * 20) + 3))
    .replace(/\{eventCount\}/g, vars.eventCount || '5')
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getBossQuoteFromJson(
  personality: string,
  vars: QuoteVars,
): string {
  const group = (quotesData.boss as Record<string, string[]>)[personality]
    || quotesData.boss.angry
  return fillVars(pickRandom(group), vars)
}

function getAddressReaction(address: string, vars: QuoteVars): string | null {
  const reactions = (quotesData.address_reactions as Record<string, string[]>)[address]
  if (!reactions) return null
  return fillVars(pickRandom(reactions), vars)
}

function getRemarkReaction(remark: string, vars: QuoteVars): string | null {
  const reactions = (quotesData.remark_reactions as Record<string, string[]>)[remark]
  if (!reactions) return null
  return fillVars(pickRandom(reactions), vars)
}

function getBossComplainingFromJson(personality: string, vars: QuoteVars): string {
  const group = (quotesData.boss_complaining as Record<string, string[]>)[personality]
    || quotesData.boss_complaining.angry
  return fillVars(pickRandom(group), vars)
}

function getRiderQuoteFromJson(riderId: string, vars: QuoteVars): string {
  const group = (quotesData.rider as Record<string, string[]>)[riderId]
    || quotesData.rider.r001
  return fillVars(pickRandom(group), vars)
}

function getRiderLostQuote(riderId: string, vars: QuoteVars): string {
  const group = riderId === 'r003'
    ? (quotesData.rider_lost as Record<string, string[]>)['r003']
    : (quotesData.rider_lost as Record<string, string[]>)['default']
  return fillVars(pickRandom(group), vars)
}

function getCompletedQuote(riderId: string, vars: QuoteVars): string {
  const template = (quotesData.completed as Record<string, string>)[riderId]
    || (quotesData.completed as Record<string, string>)['r001']
  return fillVars(template, vars)
}

// ============ NPC 状态机 ============
export function triggerOrderFlow(orderId: string) {
  const orderStore = useOrderStore()

  // 随机选一个骑手
  const riderIds = ['r001', 'r002', 'r003', 'r004', 'r005']
  const riderId = riderIds[Math.floor(Math.random() * riderIds.length)]
  const rider = RIDER_INFO[riderId]

  const order = orderStore.getOrderById(orderId)
  if (!order) return

  const personality = order.bossPersonality || 'angry'

  // 取菜名（第一个菜品）
  const dishName = order.items[0]?.name || '美食'
  const addressName = order.address || '未知地址'
  const remarkText = order.remark || ''

  const vars: QuoteVars = {
    shopName: order.shopName,
    dishName,
    riderName: rider.name,
    userName: '大人',
    orderNum: String(Math.floor(Math.random() * 20) + 3),
    eventCount: '5',
    address: addressName,
    remark: remarkText,
  }

  // 接单 2-5s
  const t1 = 2000 + Math.random() * 3000
  setTimeout(() => {
    let quote = getBossQuoteFromJson(personality, vars)
    // 先看看地址有没有特殊反应
    const addrReaction = getAddressReaction(addressName, vars)
    if (addrReaction) {
      quote = addrReaction + ' ' + quote
    }
    orderStore.updateOrderStatus(orderId, 'accepted', `【老板】${quote}`)
  }, t1)

  // 出餐 5-12s
  const t2 = t1 + 5000 + Math.random() * 7000
  setTimeout(() => {
    // 备注反应（优先于老板抱怨，但笔记版不替换老板情绪）
    const remarkReaction = remarkText ? getRemarkReaction(remarkText, vars) : null
    const isBossComplaining = Math.random() < (remarkReaction ? 0.35 : 0.25)
    if (remarkReaction && isBossComplaining) {
      const complaint = getBossComplainingFromJson(personality, vars)
      orderStore.updateOrderStatus(orderId, 'boss_complaining', `【老板发疯中】${remarkReaction} 「而且」${complaint}`)
      setTimeout(() => {
        orderStore.updateOrderStatus(orderId, 'cooking', '【系统】虽然老板在发疯，但菜还是做好了')
      }, 800)
    } else if (remarkReaction) {
      orderStore.updateOrderStatus(orderId, 'cooking', `【老板看到备注】${remarkReaction}`)
    } else {
      orderStore.updateOrderStatus(orderId, 'cooking', '【厨房】出餐中，香味已飘出三条街')
    }
  }, t2)

  // 骑手抢单 1-3s after cooking
  const t3 = t2 + 1000 + Math.random() * 2000
  setTimeout(() => {
    const quote = getRiderQuoteFromJson(riderId, vars)
    // 骑手对地址的反应
    const riderAddrReaction = addressName === '百慕大'
      ? '（看了地址后沉默了一下）': ''
    orderStore.assignRider(orderId, riderId)
    orderStore.updateOrderStatus(orderId, 'delivering', `【骑手】${quote} ${riderAddrReaction}`)
  }, t3)

  // 配送中途消息 8-15s
  const t4 = t3 + 8000 + Math.random() * 7000
  setTimeout(() => {
    const isRiderLost = riderId === 'r003' || Math.random() < 0.2
    if (isRiderLost) {
      const quote = getRiderLostQuote(riderId, vars)
      orderStore.updateOrderStatus(orderId, 'rider_lost', `【骑手】${quote}`)
    } else {
      // 第二条骑手台词
      const group = (quotesData.rider as Record<string, string[]>)[riderId] || quotesData.rider.r001
      const quote = fillVars(group[Math.min(2, group.length - 1)], vars)
      orderStore.updateOrderStatus(orderId, 'delivering', `【骑手】${quote}`)
    }
  }, t4)

  // 送达 5-10s after last message
  const t5 = t4 + 5000 + Math.random() * 5000
  setTimeout(() => {
    const doneQuote = getCompletedQuote(riderId, vars)
    orderStore.updateOrderStatus(orderId, 'completed', `【骑手】${doneQuote}`)
  }, t5)
}

// ============ 工具函数（供组件使用）============
export function getBossQuote(personality: string): string {
  const vars: QuoteVars = { shopName: '本店', dishName: '美食', riderName: '骑手' }
  return getBossQuoteFromJson(personality, vars)
}

export function getRiderName(riderId: string): string {
  return RIDER_INFO[riderId]?.name || '神秘骑手'
}

export function getRiderAvatar(riderId: string): string {
  return RIDER_INFO[riderId]?.avatar || '🛵'
}
