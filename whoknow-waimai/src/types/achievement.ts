/** 成就类型定义（v18 成就系统）*/
export type AchievementTier = 'common' | 'rare' | 'hidden'

export type ConditionType =
  | 'order_count'      // 累计订单数
  | 'order_amount'     // 累计消费金额
  | 'same_shop'        // 同一商家次数
  | 'same_dish'        // 同一菜品次数
  | 'midnight_order'   // 凌晨下单
  | 'remark_count'     // 有备注的订单数
  | 'review_count'     // 评价数
  | 'low_rating_count' // 低分评价数
  | 'boss_anger'       // 被老板骂的次数
  | 'chaos_bonus'      // 触发胡闹彩蛋
  | 'review_phrase'    // 写了 5 字以上评价

export interface AchievementCondition {
  type: ConditionType
  value: number
}

export interface AchievementConfig {
  id: string
  name: string
  description: string
  tier: AchievementTier
  icon: string
  /** 隐藏成就的模糊提示（普通/稀有 = null）*/
  hint: string | null
  condition: AchievementCondition
}

export interface AchievementState {
  unlocked: boolean
  claimed: boolean
  progress: number
  unlockedAt: number | null
  claimedAt: number | null
}

export type AchievementMap = Record<string, AchievementState>

export interface AchievementWithState extends AchievementConfig {
  state: AchievementState
}
