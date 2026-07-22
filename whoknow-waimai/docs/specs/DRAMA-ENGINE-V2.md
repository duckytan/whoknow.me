# 🎲 胡闹外卖 · 剧情引擎 v2 — 「人生模拟器」式推演

> **版本**: v2.1 · 2026-07-22  
> **核心思想**: 每一个订单都是一段人生，变量决定命运，事件连锁推演

---

## 一、核心理念

### 人生模拟器怎么玩

```
选属性（颜值/智力/家境）
  → 每回合投骰（随机+属性修正）
  → 触发事件（上学/工作/恋爱/事故）
  → 属性变化（智力+1，家境-2）
  → 影响下一回合
  → 结局（不同初始 → 不同人生）
```

### 我们的外卖怎么推演

```
下单（地址/备注/菜品/时间/历史）
  → 接单阶段（老板反应）
  → 出餐阶段（速度/态度） 
  → 配送阶段（骑手/迷路/事故）
  → 送达阶段（结局/彩蛋）
  → 不同变量 → 每次点单都是不同"剧情人生"
```

**关键区别**:  
❌ 旧思路：`条件A → 台词B`（乒乓球）  
✅ 新思路：`变量 → 骰子+概率 → 事件 → 状态变化 → 连锁下一阶段`（人生模拟器）

---

## 二、引擎架构

### 2.1 全局状态流

```
┌────────────────────────────────────────────────┐
│                 OrderInput                      │
│  address / remark / items / time / history       │
└───────────────────┬────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────┐
│              DramaState（流动状态）               │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ bossMood │  │ rider    │  │ delay   tags  │ │
│  │ -100~100 │  │ morale   │  │ (秒)     []   │ │
│  │ 初始=50  │  │  初始=60 │  │ 初始=0        │ │
│  └──────────┘  └──────────┘  └───────────────┘ │
│  ▲ 每阶段事件会改变这些值，并传递给下一阶段 ▲      │
└───────────────────┬────────────────────────────┘
                    │
                    ▼
┌────────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│  阶段 1     │  │  阶段 2    │  │  阶段 3    │  │  阶段 4    │
│  接 单      │→→│  出 餐     │→→│  配 送     │→→│  送 达     │
│            │  │           │  │           │  │           │
│ 老板反应    │  │ 做菜速度   │  │ 骑手状态   │  │ 剧情结局   │
│ 骰子判定    │  │ 骂人程度   │  │ 路线事件   │  │ 彩蛋判定   │
└────────────┘  └───────────┘  └───────────┘  └───────────┘
       │              │             │              │
       ▼              ▼             ▼              ▼
  事件+台词      事件+台词      事件+台词      结局+彩蛋
```

### 2.2 每个阶段的通用结构

```typescript
interface PhaseInput {
  state: DramaState        // 当前状态
  input: OrderInput        // 订单输入
  order: Order             // 订单数据
  dice: () => number       // 骰子函数（可 mock）
}

interface PhaseResult {
  state: DramaState        // 更新后的状态
  events: DramaEvent[]     // 本阶段发生的事件
  delay: number            // 本阶段耗时（毫秒）
}

interface DramaEvent {
  type: 'quote' | 'system' | 'special'
  actor: 'boss' | 'kitchen' | 'rider' | 'system'
  text: string             // 台词（后续胡闹大脑可接管）
  effect: Partial<DramaStateModifier>  // 状态影响
}
```

---

## 三、阶段详细设计

### 阶段 1：接单 — 老板反应

**骰子判定维度**：
- 地址是否奇葩（公厕/百慕大/ICU → bossMood -20~-30）
- 备注是否"刺激"（多放辣/别骂了/才艺 → bossMood 加减）
- 是否老顾客（回头客 → bossMood +10）
- 时间（凌晨/饭点高峰 → bossMood -10）

**状态影响**：
- bossMood 影响出餐速度
- 低 bossMood → 出餐慢，骂人狠
- 高 bossMood → 出餐快，甚至送小菜

### 阶段 2：出餐 — 厨房风云

**骰子判定**：
- bossMood（低→磨蹭，高→利索）
- 菜品数量（多→慢，少→快）
- 老板发疯事件概率（基于剩余 bossMood）

**可能事件**：
- 正常出餐 → delay 正常
- 老板发疯 → delay +5s，附加骂人台词
- 厨房事故 → delay +8s，附加剧情
- 神仙发挥 → delay -3s，老板突然好评

**标签传递**：
- `boss_complained`：老板发疯过（传递到后续）
- `delay_cooking`：出餐延迟

### 阶段 3：配送 — 骑手史诗

**骰子判定**：
- 骑手性格（快/稳/迷路）vs 地址（百慕大自动灾难）
- 路线难度（公司门禁 +10% time）
- 配送中途事件概率

**标签影响**：
- `rider_lost` + `address=bermuda` → 特殊迷路剧情
- `order_large`（很多菜） → 骑手抱怨
- `already_delayed`（前面已经有 delay） → 骑手油门加到底

### 阶段 4：送达 — 结局判定

| 条件 | 结局类型 | 例子 |
|:----:|:--------:|------|
| 所有状态正常 | 平稳送达 | "您的餐到了，祝用餐愉快" |
| bossMood < 0 | 老板还在气头上 | "拿走拿走，下次别点了" |
| 迷路过 + delay 大 | 戏剧性送达 | "我也不知道怎么到的，缘分吧" |
| 完美通关 | 胡闹彩蛋 | "穿越时空送餐百年后到达" |

---

## 四、数据模型

### 订单新增字段

```typescript
interface Order {
  // ...现有字段
  addressTag: 'home' | 'school' | 'company' | 'toilet' | 'bermuda' | 'icu'
  remarkTag: 'none' | 'more_spicy' | 'less_spicy' | 'no_coriander' | 'no_scold' | 'show_time'
  dramaState: {
    bossMood: number
    riderMorale: number
    totalDelay: number
    events: string[]
  }
}
```

### localStorage 统计

```typescript
interface UserStats {
  shopVisit: Record<string, number>   // { s001: 5, s003: 2 }
  dishOrders: Record<string, number>  // { d001: 3 }
  totalOrders: number
  totalSpent: number                   // 累计消费金额
  avgOrderValue: number                // 平均每单金额
  todayOrderCount: number              // 今日下单次数
  todayOrderDate: string               // 记录日期
  lastFiveOrders: string[]             // 最近 5 个订单 ID
  currentStreak: number                // 连续点餐天数
  reviewStats: { good: number, bad: number }  // 好评/差评统计
  lastBossId?: string                  // 上次点的店铺 ID
  lastRiderId?: string                 // 上次遇到的骑手
  canceledOrders: number               // 取消订单次数
  flags: string[]                       // 叙事标记，跨订单持久化
  // 例: ["married_r003", "food_poison_s001", "bomb_survivor"]
}
```

---

### 叙事标记（Flags）系统

> 某些 drama 分支结局会留下**跨订单的叙事标记**。下次回来，引擎发现标记 → 触发专属剧情。
> 这是「人生模拟器连续感」的关键——上一次发生的事，下一次还会记得。

```
订单A → 结婚结局 → 设置 flag "married_r003"
                          ↓
订单B → 又遇到骑手 r003 → 检查 flag → "宿世姻缘" 分支触发
```

| flag 示例 | 来源 | 后续影响 |
|:---------|:-----|:---------|
| `married_{riderId}` | 破产救赎→结婚 | 下次遇到同骑手，触发「宿世姻缘」 |
| `food_poison_{shopId}` | 某店食物中毒 | 下次点该店，老板以为你诈尸，吓进医院 |
| `bomb_survivor` | 炸弹幸存 | 下次点餐，警察上门回访 |
| `icu_survivor` | 暴食进过 ICU | 老板：「又是你？上次吃进医院的？」 |
| `blacklisted_{shopId}` | 差评过多 | 再也点不了这家店 |
| `saved_{riderId}` | 被骑手救过 | 下次见面，骑手：「最近还好吗？」 |

**条件语法**：`flag(married_r003)`、`flag(food_poison, s001)`

**生命周期**：永久 / 单次消耗 / 有时效（如 7 天后忘仇）

---

## 五、参数全表（输入变量池）

> 所有参数在订单提交时收集一次，在推演过程中按需访问。
> 一个订单的「命运」由这些参数的组合决定。

### 5.1 下单参数（用户主动输入）

| # | 参数 | 数据类型 | 值范围 / 例子 | 影响方向 |
|:-:|:----|:--------:|:-------------:|:--------|
| 1 | `address` | 枚举 | 家庭/学校/公司/公厕/百慕大/ICU | bossMood ±30，迷路概率偏移 |
| 2 | `remark` | 枚举 | 多放辣/少放辣/不要香菜/别骂了/才艺 | bossMood ±20 |
| 3 | `orderTotal` | 数字 | ¥5 ~ ¥544 | 低于 20 = 穷鬼，高于 300 = 破产 |
| 4 | `avgDishPrice` | 数字 | ¥5 ~ ¥68 | 低于 10 → 骑手拒单风险 |
| 5 | `dishCount` | 数字 | 1 ~ 15 | 太多 → 老板暴躁，彩蛋率 +30% |
| 6 | `dishCategory` | 数组 | 烤串/甜品/刺身/汉堡... | 混搭 → 老板吐槽 |
| 7 | `deliveryFee` | 数字 | ¥0 ~ ¥6 | 免配送 → riderMorale -10 |
| 8 | `expectedTime` | 数字 | 18~60 分钟 | 超预期 → 用户焦虑，催单概率 |
| 9 | `orderDuration` | 秒数 | 10~600s | 选菜太久 → 老板嫌犹豫 |
| 10 | `varietyScore` | 数字 | 0~1 | 点了多少种不同类别 |

### 5.2 时间参数（自动感知）

| # | 参数 | 值范围 | 影响 |
|:-:|:----|:------:|:-----|
| 11 | `timeSlot` | 凌晨(0-5) / 早晨(6-8) / 午市(11-13) / 下午(14-17) / 晚市(17-19) / 深夜(20-23) | 凌晨/深夜 bossMood -20，饭点 delay +10% |
| 12 | `weekday` | 一~日 | 周末老板懒散，周五晚高峰 |
| 13 | `isHoliday` | true/false | 节假日 → 老板不想上班 |
| 14 | `isPayday` | true/false | 月底/月初 → 用户穷 vs 有钱 |
| 15 | `weather` | 晴/雨/雪/台风（通过 API） | 雨天 delay +20%，骑手抱怨 |

### 5.3 历史行为参数（从 localStorage 统计）

| # | 参数 | 计算方式 | 影响 |
|:-:|:----|:--------:|:-----|
| 16 | `shopVisitCount` | `stats.shopVisit[shopId]` | ≥3 回头客，≥10 VIP |
| 17 | `dishRepeatCount` | `stats.dishOrders[dishId]` | ≥3 "你经常点这个"，≥10 "真爱" |
| 18 | `totalOrders` | `stats.totalOrders` | ≥10 老顾客 |
| 19 | `totalSpent` | `stats.totalSpent` | ≥10000 大客户，≥0 白嫖 |
| 20 | `avgOrderValue` | `stats.avgOrderValue` | 跟本次对比 → 突然大方还是变抠 |
| 21 | `todayOrderCount` | `stats.todayOrderCount` | ≥3 → 暴食预警 |
| 22 | `currentStreak` | `stats.currentStreak` | 连点 7 天 → "你是真爱粉" |
| 23 | `lastShopSame` | 上次是否同一家 | 连吃同家 → "又是你？" |
| 24 | `lastRiderSame` | 上次是否同一骑手 | 缘分 → 骑手老朋友 |
| 25 | `reviewTendency` | 好评/差评比例 | 差评多 → bossMood -20（老板记仇） |
| 26 | `canceledOrders` | `stats.canceledOrders` | 取消多 → 老板："这次不会又取消吧" |
| 27 | `lastRemark` | 上次备注 | 跟本次对比 → 用户"变了" |

### 5.4 关系参数（随时间积累的情感值）

> 这些不是直接存储的，而是**每单推演后的产物**，累积成「你跟这个 NPC 的关系」：

| # | 参数 | 生成方式 | 含义 |
|:-:|:----|:--------:|:-----|
| 28 | `bossAffinity` | 每次 bossMood 变化的累积 | 老板对你的好感度 -500~500 |
| 29 | `riderHistory` | 跟每个骑手的互动记录 | { r001: 3次, r003: 8次 } |
| 30 | `bossStoryFlags` | 数组 | 触发了哪些特殊事件，后续可延续 |
| 31 | `consecutiveBadOrders` | 连续差评数 | 连续 3 次差评 → 老板拉黑 |
| 32 | `blacklistLevel` | 0~3 | 被拉黑的程度 |

### 5.5 元参数（不可预测的调味料）

| # | 参数 | 值范围 | 作用 |
|:-:|:----|:------:|:-----|
| 33 | `luckToday` | 0~1 | 每天重置的随机数，影响所有概率 +±10% |
| 34 | `phaseOfMoon` | 上弦/满月/下弦/新月 | 满月 → 老板更暴躁，骑手更容易迷路 |
| 35 | `userIdHash` | 0~9 | 基于用户 ID 的固定值，制造"有些人就是运气差"的错觉 |

### 参数全景图

```
                         下单参数（10 个）
                         ↓
                        时间参数（5 个）
                         ↓
    历史行为参数（12 个） → 参数收集器 → 关系参数（5 个）
                         ↓
                       元参数（3 个）
                         ↓
                  总参数输入（35 维）→ 进入 4 阶段推演
```

---

## 六、剧情分支系统（DramaBranch）

每个「离谱连锁剧情」注册为一个 DramaBranch，引擎按条件触发并执行链式反应。

### 6.1 条件字符串语法

> 从人生重开模拟器借鉴，所有条件写成字符串，引擎自动解析，不再写死在代码里。
> 好处：胡闹大脑直接改 JSON 就能加新分支，不用碰代码。

```typescript
// 支持的操作符
>  <  >=  <=   =   !=    ?    !
大 小  大  小  等于 不等  包含 不包含
                       (数组) (数组)

// 逻辑组合
&    AND
|    OR
()   分组

// 例子
"orderTotal < 20"                                // 金额小于 20
"avgDishPrice < 10 & dishCount > 3"              // 便宜又多
"bossMood > -30 | hasTag(bermuda)"               // 情绪不差或百慕大
"shopVisitCount >= 3 & !flag(hasHadBomb)"        // 回头客且没点过炸弹
"timeSlot ? [午夜, 深夜] & todayOrderCount >= 3"  // 深夜且今天第 3 单
"luckToday > 0.3"                                 // 运势不错
```

### 6.2 分支定义接口

```typescript
interface DramaBranch {
  id: string
  name: string
  description: string
  weight: number                        // 权重（多个分支同时触发时，按权重随机选）
  neverExpire: boolean                  // 永不过期（如炸弹套餐）

  trigger: {
    condition: string                   // 条件字符串，引擎自动解析
    probability: number                 // 命中条件后，触发概率 0-1
    probabilityScaling?: {              // 概率递增规则（参数越极端，概率越高）
      param: string                     // 关联的参数名
      threshold: number                 // 起始值
      rate: number                      // 每超过 1 单位，提升的概率 0-1
    }
    cooldown: number                    // 冷却分钟（防短时重复触发）
    maxPerUser: number                  // 每个用户最多触发次数
  }

  /**
   * 概率计算公式：
   *   finalProb = probability + max(0, param - threshold) * rate
   *   clamp(finalProb, 0, 1)
   *
   * 示例：暴食分支
   *   probability: 0.2
   *   probabilityScaling: { param: "todayOrderCount", threshold: 3, rate: 0.2 }
   *     todayOrderCount = 3 → 0.2 + 0 × 0.2 = 20%
   *     todayOrderCount = 4 → 0.2 + 1 × 0.2 = 40%
   *     todayOrderCount = 5 → 0.2 + 2 × 0.2 = 60%
   *     todayOrderCount = 7 → 0.2 + 4 × 0.2 = 100%
   */

  rarity: Rarity                       // 本分支的稀有度等级
  achievements?: AchievementId[]         // 完成后解锁的成就 ID
  firstEvent: string                    // 入口事件 ID → 连锁触发
}

enum Rarity {
  COMMON = 'common',         // 普通 — 日常搞怪，人人都会遇到
  UNCOMMON = 'uncommon',     // 稀有 — 需要特定条件
  RARE = 'rare',             // 精良 — 条件组合较难
  EPIC = 'epic',             // 史诗 — 多重条件叠加
  LEGENDARY = 'legendary',   // 传说 — 天时地利人和
}

/**
 * 稀有度示例：
 *   穷鬼套餐        → common   （¥<20 就有，随便触发）
 *   骑手拒单        → uncommon （均价<10 才行）
 *   暴食进 ICU      → rare     （≥3单 + 40%骰子）
 *   破产救赎→结婚   → epic     （¥≥300 + 30% + 30%随机）
 *   炸弹套餐        → legendary（点隐藏炸弹+一命通关）
 *   宿世姻缘        → epic     （上一轮结过婚才行）
 */

interface DramaEvent {
  id: string                            // 事件唯一 ID
  phase: 'accept' | 'cook' | 'deliver' | 'complete'
  text: string                          // 台词（引擎输出）
  condition?: string                    // 额外条件
  stateModifiers?: Partial<DramaStateModifier>
  next?: string | string[]              // 后续事件 ID（支持分支）
  nextWeights?: number[]                // 多分支时的权重
  delay?: number                        // 本事件耗时 ms
}
```

### 6.3 事件链执行逻辑

```
引擎每阶段开始：
  1. 检查所有 DramaBranch 的 trigger.condition → 将命中条件的加入权重池
  2. 权重随机选一个分支 → 获得 firstEvent
  3. 执行 firstEvent → 如有 next → 继续执行下一个事件
  4. 直到事件没有 next → 本阶段结束

                 ┌─────────────┐
                 │ 条件池      │
                 │             │
                 │ 穷鬼(权重 5) │
                 │ 便宜菜(3)   │── 权重随机 → 穷鬼分支
                 │ 破产(1)     │
                 └─────────────┘
                       │
                       ▼
    event_poor_accept ──→ event_poor_cook ──→ event_poor_deliver ──→ event_poor_end
    (next)                (next)                (next)                (end)
```

### 6.4 5 个剧情分支实例（事件链格式）

#### 分支 #1：穷鬼套餐 — 老板摆烂 🗑️

```
条件: "orderTotal < 20"
权重: 5

事件链:
event_poor_accept:
  phase: accept
  text: "¥{price}也好意思点？锅都懒得开"
  stateModifiers: { bossMood: -50 }
  next: event_poor_cook

event_poor_cook:
  phase: cook
  text: "老板在躺椅上玩手机，厨房没动静"
  delay: 15000
  stateModifiers: { bossMood: -10 }
  next: event_poor_deliver

event_poor_deliver:
  phase: deliver
  text: "骑手：等了好久才出餐，这单亏了"
  next: event_poor_end

event_poor_end:
  phase: complete
  text: "下次低于¥20我不接单了"
```

#### 分支 #2：便宜菜多 — 骑手拒单 🛵❌

```
条件: "avgDishPrice < 10"
权重: 3

事件链:
event_cheap_accept:
  phase: accept
  text: "都是便宜货，做起来没劲"
  next: event_cheap_no_rider

event_cheap_no_rider:
  phase: deliver
  text: "系统广播：该订单无人接单"
  stateModifiers: { riderMorale: -40 }
  next: event_cheap_force

event_cheap_force:
  phase: deliver
  text: "系统强行指派——骑手：¥{fee}的配送费？"
  stateModifiers: { riderMorale: -30 }

event_cheap_end:
  phase: complete
  text: "骑手全程冷漠脸，台词都懒得多说一句"
```

#### 分支 #3：破产 → 上吊 → 被救 → 结婚 💍

```
条件: "orderTotal >= 300"
权重: 1
概率: 0.3（只有 30% 触发，其他 70% 正常送达）

事件链:
event_bankrupt:
  phase: complete
  text: "系统：用户因买这顿饭破产，正在家中上吊"
  next: [event_bro, event_love, event_wedding]
  nextWeights: [6, 3, 1]
  ↓
  ├─ 权重 6 → event_bro: 跟骑手成了好兄弟
  ├─ 权重 3 → event_love: 跟骑手在一起了
  └─ 权重 1 → event_wedding: 婚礼上那单外卖被摆 C 位
```

#### 分支 #4：暴饮暴食 → ICU 抢救 🏥

```
条件: "todayOrderCount >= 3"
权重: 3
概率: 0.2
递增: { param: "todayOrderCount", threshold: 3, rate: 0.2 }
  → 3单=20%  4单=40%  5单=60%  6单=80%  7单+=100%

事件链:
event_overeat_warn:
  phase: complete
  text: "系统：用户今天已经吃了 3 顿外卖了"
  next: [event_overeat_ok, event_overeat_icu]
  nextWeights: [6, 4]
  ↓
  ├─ 权重 6 → event_overeat_ok: "还好，年轻，扛得住"
  └─ 权重 4 → event_overeat_icu: "肚子剧痛进 ICU，护士是你小学同学"

#### 分支 #5：炸弹套餐 💣（隐藏菜单）

```
条件: "hasTag(bomb_order)"   ← 点了隐藏菜品「炸弹」
权重: 10（优先触发）
概率: 1.0（必触发）

事件链:
event_bomb_accept:
  phase: accept
  text: "老板看着单子沉默三秒：这是谁点的？"
  stateModifiers: { bossMood: -80 }
  next: event_bomb_cook

event_bomb_cook:
  phase: cook
  text: "厨房爆炸了！老板进 ICU——厨师：我就说那玩意儿不能放厨房"
  next: event_bomb_deliver

event_bomb_deliver:
  phase: deliver
  text: "骑手发现袋子冒烟——路上炸了，骑手进 ICU"
  next: event_bomb_police

event_bomb_police:
  phase: complete
  text: "警察上门调查——用户：我就点了个外卖……"
  next: [event_bomb_friend, event_bomb_love]
  nextWeights: [7, 3]
  ↓
  ├─ 权重 7 → 跟骑手在 ICU 结成生死之交
  └─ 权重 3 → "下次点炸弹提前说一声，我穿防弹衣"
```

#### 分支 #6：宿世姻缘 💕（flags 触发）

```
条件: "flag(married_r003) & riderId = r003"
权重: 8（高权重，优先触发）
概率: 0.6

事件链:
event_fate_accept:
  phase: accept
  text: "骑手 r003 接单了——他愣住了："是您？""
  stateModifiers: { riderMorale: +30 }
  next: event_fate_cook

event_fate_cook:
  phase: cook
  text: "老板：你对象来接单了，菜我做快点儿"
  delay: -5000（出餐加速）
  next: event_fate_deliver

event_fate_deliver:
  phase: deliver
  text: "骑手：好久不见……上次之后我一直想着那顿饭"
  next: event_fate_end

event_fate_end:
  phase: complete
  text: "你们在门口聊了半小时，订单显示已送达"
  effect: { flags: ["fate_reunion"] }
```

#### 分支 #7：诈尸还魂 👻（flags 触发）

```
条件: "flag(food_poison, s001) & shopId = s001"
权重: 10
概率: 0.5

事件链:
event_ghost_accept:
  phase: accept
  text: "老板核对订单：这个用户不是上次吃死那个吗？？"
  stateModifiers: { bossMood: -60 }
  next: event_ghost_cook

event_ghost_cook:
  phase: cook
  text: "老板在厨房哆哆嗦嗦做饭，时不时探头看你是不是还在"
  delay: +10000
  next: event_ghost_deliver

event_ghost_deliver:
  phase: deliver
  text: "骑手取餐时发现老板脸色发白"
  next: event_ghost_end

event_ghost_end:
  phase: complete
  text: "老板终于鼓起勇气开门：你……你不是死了吗？！然后晕了过去"
  effect: { flags: ["haunted_boss_s001"] }
```

---

## 七、台词数据格式

台词库保持独立 JSON，引擎只读、胡闹大脑不定期维护：

```json
{
  "boss": [
    { "text": "催什么催！锅还没热呢！", "moodRange": [-100, -30], "tags": ["any"] },
    { "text": "又是你？第{n}次了",         "moodRange": [-20, 50],  "tags": ["regular"] },
    { "text": "送到公厕？？认真的吗",       "moodRange": [-100, 0],  "tags": ["toilet"] }
  ],
  "rider_lost_extreme": [
    { "text": "我不小心骑进了异次元……不过还是到了", "moodRange": [0, 100], "tags": ["bermuda", "lost"] }
  ]
}
```

**匹配优先级**：`tags 严格匹配 > moodRange 匹配 > tags:["any"] > 默认内容`

---

## 八、成就收集系统 🏆

> **长期规划**，暂时不做，但入口 + 界面框架先搭好，模板数据填充占位。

### 成就勋章类型

```
稀有度      颜色        示例
common      铜色 🥉    "第一次点外卖" "第一次被老板骂"
uncommon    银色 🥈    "穷鬼套餐达成" "连续点餐3天"
rare        金色 🥇    "暴进ICU" "骑手拒单成就"
epic        紫色 💜    "破产救赎" "炸弹幸存者"
legendary   橙色 🔶    "全成就收集" "跟所有骑手结过婚"
```

### 数据模型

```typescript
interface Achievement {
  id: string
  name: string
  description: string
  rarity: Rarity
  icon: string                          // emoji 或图片 URL
  condition: string                     // 达成条件
  hidden?: boolean                      // 隐藏成就
}

// UserStats 已有 flags，加一个
achievementUnlocked: string[]           // 已解锁的 achievement ID 列表
```

### UI 预览

底部 Tab 加「成就」入口，点进去是一个勋章墙：

```
┌─────────────────────────┐
│  🏆 成就 · 0/20 已点亮   │
│                         │
│  🥉 🥉 🥉  🥈  🥇  💜  │
│  第1单 被骂 穷鬼  连3天 ICU   │
│  (亮) (亮) (亮) (暗) (暗) │
│                         │
│  所有成就按稀有度排列      │
│  未解锁的半透明灰色显示    │
└─────────────────────────┘
```

### 模板数据（10 个占位成就）

| ID | 名称 | 稀有度 | 条件 |
|:--|:----|:------:|:-----|
| first_order | 第一次 | common | 完成第一单外卖 |
| first_scold | 初骂体验 | common | 被老板骂一次 |
| poor_meal | 穷鬼套餐 | uncommon | 触发穷鬼分支 |
| streak_3 | 连续三天 | uncommon | 连续点餐 3 天 |
| rider_refuse | 我要投诉 | rare | 触发骑手拒单 |
| icu_visit | ICU 观光 | rare | 暴食进 ICU |
| bankrupt_love | 破产爱情 | epic | 破产救赎→结婚结局 |
| bomb_survivor | 炸弹幸存 | legendary | 触发炸弹结局 |
| all_riders | 骑手全图鉴 | legendary | 遇过全部 5 个骑手 |
| fate_reunion | 宿世姻缘 | epic | 触发宿世姻缘分支 |

---

## 九、社交动态 📢

> **长期规划**，暂时不做，但入口和界面先搭好。

### 设计思路

类似朋友圈/微博的信息流，**其他玩家的高稀有度事件**会出现在这里：

```
┌─────────────────────────┐
│  🔥 最新动态              │
│                         │
│  🏆 用户XXX 达成了       │
│   「炸弹幸存者」传说成就！│
│   · 2分钟前              │
│                         │
│  💍 用户OOO 在 xx烧烤    │
│    触发「破产救赎→结婚」│
│   · 15分钟前             │
│                         │
│  😱 用户XXX 点了 ¥328    │
│    的外卖，倾家荡产！    │
│   · 1小时前              │
│                         │
│  📡 仅展示稀有度≥rare   │
│    的事件和成就          │
└─────────────────────────┘
```

### 底部 Tab 更新

新增两个 Tab，底部导航从 2 个变成 **4 个**：

| Tab | 图标 | 页面 | 状态 |
|:---:|:----:|:----:|:----:|
| 🏠 **首页** | wap-home-o | Home.vue | ✅ 已做 |
| 🏆 **成就** | medal-o | Achievement.vue | 🟡 占位（模板数据） |
| 📢 **动态** | chat-o | Feed.vue | 🟡 占位（模板数据） |
| 📋 **订单** | records-o | OrderHistory.vue | ✅ 已做 |

### 数据流
```
订单完成 → drama 引擎产出事件
                  ↓
          检查事件稀有度
                  ↓
          ≥ rare？→ 计入社交动态池
                  ↓
          Feed.vue 展示最新
```

---

## 十、实现计划

| Phase | 内容 | 依赖 |
|:-----:|------|:----:|
| **P1** | 地址/备注下拉框 + Order 扩展 + localStorage 统计 + 稀有度字段 | 无 |
| **P2** | DramaState 状态流 + 4 阶段推演框架 + 事件链引擎 | P1 |
| **P3** | DramaBranch 分支引擎 + 7 个分支注册 | P2 |
| **P4** | 台词 tags + moodRange 匹配系统 + 稀有度展示 | P3 |
| **P5** | 成就系统 UI + 模板数据 + 社交动态 UI + 模板数据 + 底部 Tab 4 个 | P4（UI 可提前做）|
| **P6** | 胡闹大脑接入（不定期扩充台词、分支、成就） | P5 |

---

## 十一、一句话总结

> **不是"如果地址=公厕，就说公厕台词"**  
> **而是"地址=公厕 → bossMood -30 → 出餐慢 → 配送急 → 一单跌宕起伏的外卖人生"**

命运算出来了，台词自然会生成。
