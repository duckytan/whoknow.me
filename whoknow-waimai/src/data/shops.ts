// shops.ts — 商店目录 + 骑手目录（原型图选店层数据源）
// personality 仅作视觉 flavor（persona 徽章 + 开场白），不进入引擎分支判定。

export type Personality = 'angry' | 'gentle' | 'weird' | 'lazy' | 'philo' | 'rider'

export type BossPersonality = Exclude<Personality, 'rider'>

export interface Shop {
  id: string
  name: string
  emoji: string
  personality: BossPersonality
  score: number
  monthlySales: string
  deliveryTime: string
  minOrder: number
  deliveryFee: number
  distance: string
  promo: string
  badge?: string
  greeting: string
}

export interface Rider {
  id: string
  name: string
  emoji: string
  personality: 'rider'
  sub: string
}

export const PERSONA_LABEL: Record<Personality, string> = {
  angry: '暴躁',
  gentle: '佛系',
  weird: '怪',
  lazy: '懒',
  philo: '哲学',
  rider: '闪电骑手',
}

export const PERSONA_CLASS: Record<Personality, string> = {
  angry: 'persona--angry',
  gentle: 'persona--gentle',
  weird: 'persona--weird',
  lazy: 'persona--lazy',
  philo: 'persona--philo',
  rider: 'persona--rider',
}

export const RIDERS: Rider[] = [
  { id: 'r001', name: '雷速飞', emoji: '⚡', personality: 'rider', sub: '全勤王 · 1000+ 单 / 0 投诉' },
  { id: 'r002', name: '李慢慢', emoji: '🐢', personality: 'rider', sub: '慢工出细活 · 准时率 99%' },
  { id: 'r003', name: '张迷路', emoji: '🧭', personality: 'rider', sub: '路痴担当 · 靠问路送达' },
]

// 5 家店覆盖全部 5 种老板人格（暴躁/哲学/佛系/怪/懒）
export const SHOPS: Shop[] = [
  {
    id: 's01',
    name: '老王烧烤',
    emoji: '🍢',
    personality: 'angry',
    score: 4.9,
    monthlySales: '月售 5600+',
    deliveryTime: '28分钟',
    minOrder: 30,
    deliveryFee: 3,
    distance: '1.2km',
    promo: '满50减15 | 满100减30',
    badge: '招牌',
    greeting: '大暑天吃烧烤？行，你开心就好。',
  },
  {
    id: 's02',
    name: '孔子饺子馆',
    emoji: '🥟',
    personality: 'philo',
    score: 4.7,
    monthlySales: '月售 2200+',
    deliveryTime: '22分钟',
    minOrder: 20,
    deliveryFee: 2,
    distance: '800m',
    promo: '满30减8 | 满60减18',
    badge: '新店',
    greeting: '食不厌精，脍不厌细——你这单，我包了。',
  },
  {
    id: 's03',
    name: '佛系粥铺',
    emoji: '🥣',
    personality: 'gentle',
    score: 4.8,
    monthlySales: '月售 1800+',
    deliveryTime: '25分钟',
    minOrder: 15,
    deliveryFee: 2,
    distance: '600m',
    promo: '满20减6',
    greeting: '偶尔也自己煮顿热的，别总点外卖。',
  },
  {
    id: 's04',
    name: '怪味研究所',
    emoji: '🧪',
    personality: 'weird',
    score: 4.6,
    monthlySales: '月售 900+',
    deliveryTime: '30分钟',
    minOrder: 25,
    deliveryFee: 4,
    distance: '1.5km',
    promo: '满40减12',
    greeting: '你点的东西，我也不敢问。',
  },
  {
    id: 's05',
    name: '懒人便当',
    emoji: '🛋️',
    personality: 'lazy',
    score: 4.5,
    monthlySales: '月售 3000+',
    deliveryTime: '20分钟',
    minOrder: 20,
    deliveryFee: 3,
    distance: '700m',
    promo: '满25减10',
    greeting: '能不动手就不动手，这单我躺送。',
  },
]

export function getShop(id?: string): Shop | undefined {
  return SHOPS.find((s) => s.id === id)
}

export function getRider(id?: string): Rider | undefined {
  return RIDERS.find((r) => r.id === id)
}
