// ============ 商家 ============
export interface Shop {
  id: string
  name: string
  avatar: string
  type: string
  rating: number
  monthlySales: number
  deliveryFee: number
  deliveryTime: number
  distance: number
  bossPersonality: 'angry' | 'gentle' | 'weird' | 'lazy' | 'philosophical'
  bossMottos: string[]
  menus?: Dish[]
}

// ============ 菜品 ============
export interface Dish {
  id: string
  shopId: string
  name: string
  price: number
  image: string
  description: string
  monthlySales: number
  category: string
}

// ============ 购物车 ============
export interface CartItem extends Dish {
  quantity: number
}

// ============ 骑手 ============
export interface Rider {
  id: string
  name: string
  avatar: string
  vehicle: 'bike' | 'ebike' | 'motor' | 'rickshaw'
  mottos: string[]
  speed: number
}

// ============ 订单 ============
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'cooking'
  | 'delivering'
  | 'completed'
  | 'boss_complaining'
  | 'rider_lost'

export interface OrderTimeline {
  time: string
  action: string
  npcQuote?: string
}

export interface Order {
  id: string
  shopId: string
  shopName: string
  bossPersonality: 'angry' | 'gentle' | 'weird' | 'lazy' | 'philosophical'
  riderId: string
  riderName: string
  riderAvatar: string
  items: CartItem[]
  status: OrderStatus
  timeline: OrderTimeline[]
  totalPrice: number
  address: string
  remark: string
  createdAt: number
  review?: Review
}

// ============ 评价 ============
export interface Review {
  rating: number
  tags: string[]
  text: string
  bossReply: string
  createdAt: string
}
