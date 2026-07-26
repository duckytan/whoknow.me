// achievements.ts — 成就目录（数据驱动成就墙）
// ID 与 DRAMA-SEED-v1 分支的 achievements 字段对齐；memory 记录解锁集合。
import type { Personality } from './shops'

export interface AchievementMeta {
  id: string
  name: string
  icon: string
  persona: Personality
  desc: string
  reward: string
}

export const ACHIEVEMENTS: AchievementMeta[] = [
  { id: 'poor_meal', name: '穷鬼套餐大师', icon: '💸', persona: 'angry', desc: '低于 ¥20 还敢点？老板已记住你。', reward: '红包 ¥3' },
  { id: 'cheap_ghost', name: '便宜鬼影', icon: '👻', persona: 'weird', desc: '全是便宜货，骑手都懒得接。', reward: '免配送券' },
  { id: 'bankrupt_legend', name: '破产传说', icon: '👑', persona: 'philo', desc: '一顿吃破产，却吃出了姻缘。', reward: '戏精宇宙·VIP 勋章' },
  { id: 'overeat_warn', name: '暴饮暴食警告', icon: '🍔', persona: 'gentle', desc: '今天第 N 顿外卖，老板心疼你。', reward: '溏心蛋券' },
  { id: 'dark_chef', name: '黑暗料理鉴定师', icon: '🧪', persona: 'weird', desc: '老板私房菜没敢给员工试吃。', reward: '神秘菜谱' },
  { id: 'fate_bound', name: '宿世姻缘', icon: '💞', persona: 'rider', desc: '旧识重逢，订单已送达。', reward: '专属骑手绑定' },
  { id: 'reconciled', name: '冰释前嫌', icon: '🤝', persona: 'angry', desc: '拉黑解除，这次你赢了。', reward: '和解红包' },
  { id: 'spicy_soul', name: '辣度灵魂', icon: '🌶️', persona: 'angry', desc: '辣到你今天少喝两杯水。', reward: '辣度勋章' },
  { id: 'peace_please', name: '和平使者', icon: '🕊️', persona: 'gentle', desc: '备注别骂了，老板今天憋着。', reward: '宁静头像框' },
  { id: 'lost_rider', name: '迷路骑手', icon: '🧭', persona: 'lazy', desc: '奇葩地址，骑手靠问路才找到。', reward: '导航神券' },
  { id: 'regular', name: '老主顾', icon: '🤝', persona: 'philo', desc: '同店连下 3 单，老板记住了你。', reward: '常客徽章' },
  { id: 'vip_fan', name: '铁粉 VIP', icon: '👑', persona: 'philo', desc: '同店连下 5 单，隐藏菜单向你敞开。', reward: 'VIP 勋章' },
  { id: 'local_regular', name: '本店老主顾', icon: '🏠', persona: 'philo', desc: '同一家店连下 3 单，老板记住了你。', reward: '熟客徽章' },
  { id: 'old_shop_roast', name: '老店吐槽王', icon: '🔥', persona: 'angry', desc: '老店熟客，被老板反吐槽了。', reward: '吐槽勋章' },
  { id: 'rider_buddy', name: '骑手老友', icon: '🛵', persona: 'rider', desc: '同一骑手送你第 2 单，认出你了。', reward: '默契券' },
]

export function getAchievement(id: string): AchievementMeta | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
