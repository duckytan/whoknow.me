// dishes.ts — 每家店的菜单（美团 Lite 下单流数据源）
// 仅提供"菜 + 价格"，剧情分支仍由 orderInput 数值驱动，不直接进引擎判定。

export interface Dish {
  id: string
  shopId: string
  name: string
  emoji: string
  price: number
  desc?: string
  /** 分类名：用于店铺页左侧分类侧栏，未定义时默认"招牌" */
  category?: string
  /** 原价（划线价），用于菜品卡片展示 */
  originalPrice?: number
  /** 标签数组：招牌 / 买贵必赔 / 月售N 等 */
  tags?: string[]
}

// 5 家店各 6 道，价格区间贴合各店客单价
export const DISHES: Dish[] = [
  // s01 老王烧烤（暴躁）
  { id: 's01_d1', shopId: 's01', name: '羊肉串', emoji: '🍢', price: 6, desc: '三瘦两肥，炭火现烤', category: '招牌', tags: ['招牌', '月售28'], originalPrice: 9 },
  { id: 's01_d2', shopId: 's01', name: '烤茄子', emoji: '🍆', price: 12, desc: '蒜蓉打底，油润喷香', category: '烤串', originalPrice: 16 },
  { id: 's01_d3', shopId: 's01', name: '烤冷面', emoji: '🍜', price: 10, desc: '东北街头味', category: '主食' },
  { id: 's01_d4', shopId: 's01', name: '烤鸡翅', emoji: '🍗', price: 8, desc: '蜜汁微甜', category: '招牌', tags: ['买贵必赔'], originalPrice: 12 },
  { id: 's01_d5', shopId: 's01', name: '冰啤酒', emoji: '🍺', price: 5, desc: '解腻必备', category: '饮品' },
  { id: 's01_d6', shopId: 's01', name: '蒜蓉粉丝', emoji: '🧄', price: 14, desc: '金针菇同款底', category: '小食', originalPrice: 18 },

  // s02 孔子饺子馆（哲学）
  { id: 's02_d1', shopId: 's02', name: '猪肉白菜饺', emoji: '🥟', price: 18, desc: '家常味，皮薄馅大', category: '招牌水饺', tags: ['招牌', '月售100+'], originalPrice: 22 },
  { id: 's02_d2', shopId: 's02', name: '韭菜鸡蛋饺', emoji: '🥟', price: 16, desc: '素而不寡', category: '招牌水饺' },
  { id: 's02_d3', shopId: 's02', name: '三鲜饺', emoji: '🥟', price: 22, desc: '虾仁入魂', category: '招牌水饺', tags: ['买贵必赔'], originalPrice: 28 },
  { id: 's02_d4', shopId: 's02', name: '饺子汤', emoji: '🍲', price: 6, desc: '原汤化原食', category: '汤品' },
  { id: 's02_d5', shopId: 's02', name: '蒜泥', emoji: '🧄', price: 2, desc: '解腻提香', category: '蘸料' },
  { id: 's02_d6', shopId: 's02', name: '老陈醋', emoji: '🍶', price: 3, desc: '山西十年', category: '蘸料' },

  // s03 佛系粥铺（佛系）
  { id: 's03_d1', shopId: 's03', name: '皮蛋瘦肉粥', emoji: '🥣', price: 12, desc: '温润养胃', category: '招牌粥品', tags: ['招牌', '月售50+'], originalPrice: 15 },
  { id: 's03_d2', shopId: 's03', name: '小米粥', emoji: '🥣', price: 8, desc: '朴素即福', category: '粥品' },
  { id: 's03_d3', shopId: 's03', name: '南瓜粥', emoji: '🥣', price: 10, desc: '微甜暖胃', category: '粥品' },
  { id: 's03_d4', shopId: 's03', name: '茶叶蛋', emoji: '🥚', price: 2, desc: '入味不急', category: '小食' },
  { id: 's03_d5', shopId: 's03', name: '青菜包', emoji: '🥟', price: 4, desc: '一口一个', category: '主食' },
  { id: 's03_d6', shopId: 's03', name: '凉拌黄瓜', emoji: '🥒', price: 6, desc: '清口解腻', category: '小食' },

  // s04 怪味研究所（怪）
  { id: 's04_d1', shopId: 's04', name: '香菜冰淇淋', emoji: '🍦', price: 15, desc: '爱与恨的分界线', category: '招牌怪味', tags: ['招牌', '月售30+'], originalPrice: 20 },
  { id: 's04_d2', shopId: 's04', name: '榴莲披萨', emoji: '🍕', price: 28, desc: '气味霸主', category: '招牌怪味', tags: ['买贵必赔'], originalPrice: 38 },
  { id: 's04_d3', shopId: 's04', name: '臭豆腐', emoji: '🧈', price: 10, desc: '闻着跑，吃着回', category: '怪味' },
  { id: 's04_d4', shopId: 's04', name: '蓝色可乐', emoji: '🥤', price: 8, desc: '喝了会不会变蓝？', category: '饮品' },
  { id: 's04_d5', shopId: 's04', name: '辣椒巧克力', emoji: '🍫', price: 12, desc: '甜辣交锋', category: '甜品' },
  { id: 's04_d6', shopId: 's04', name: '折耳根奶昔', emoji: '🥤', price: 14, desc: '勇者特调', category: '饮品' },

  // s05 懒人便当（懒）
  { id: 's05_d1', shopId: 's05', name: '招牌便当', emoji: '🍱', price: 20, desc: '懒得选就它', category: '招牌', tags: ['招牌', '月售80+'], originalPrice: 26 },
  { id: 's05_d2', shopId: 's05', name: '照烧鸡腿饭', emoji: '🍗', price: 22, desc: '一口肉一口饭', category: '便当' },
  { id: 's05_d3', shopId: 's05', name: '咖喱饭', emoji: '🍛', price: 18, desc: '搅一搅更香', category: '便当' },
  { id: 's05_d4', shopId: 's05', name: '泡面', emoji: '🍜', price: 9, desc: '开水一冲就行', category: '速食' },
  { id: 's05_d5', shopId: 's05', name: '火腿三明治', emoji: '🥪', price: 12, desc: '手都不用洗', category: '轻食' },
  { id: 's05_d6', shopId: 's05', name: '冰可乐', emoji: '🥤', price: 4, desc: '快乐水', category: '饮品' },
]

export function getMenu(shopId: string): Dish[] {
  return DISHES.filter((d) => d.shopId === shopId)
}

export function getDish(shopId: string, dishId: string): Dish | undefined {
  return DISHES.find((d) => d.shopId === shopId && d.id === dishId)
}
