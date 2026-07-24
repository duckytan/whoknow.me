# 🧩 胡闹外卖 v2 · 数据结构规范（DATA-STRUCTURE v1）

> **版本**：v1 · 2026-07-24
> **作者**：玩法师（GameDesigner）
> **状态**：✅ v2 权威数据源（取代散落在 api-spec / DRAMA-ENGINE-V2 / GDD §9 的碎片化定义）
> **作用**：本文件是 waimai v2 全部数据结构的**唯一事实来源**。api-spec 的 §JSON Schema、DRAMA-ENGINE-V2 的 §四/§六、GDD §9 均以本文件为准，冲突时以本文件胜出。

---

## 0. Changelog

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-07-24 | 新建。统一 L1 内容配置 / L2 运行时 / L3 玩家持久化 / L4 图鉴四层数据模型；洗掉 DRAMA 原数据模型里的禁忌词红灯字段（`icu`/`bomb`/`food_poison`/`bomb_survivor`/`icu_survivor`/`bermuda`） |

---

## 1. 数据分层总览

> 设计铁律：**配置与状态分离**。brain 只产出「内容配置」（L1），永远不直接写玩家数据。玩家数据（L3/L4）只存在玩家浏览器 localStorage，brain 触碰不到——这既是隐私，也是「单机 0 成本」的基石。

```
┌─────────────────────────────────────────────────────────────┐
│  L1 · 内容配置 (ContentConfig)                              │
│  brain 生成 / 预制 fallback · 远程 JSON · 全玩家共享        │
│  { meta, food.{boss,rider,branches}, soul_layer,            │
│    ui_meta, story_assets, forbidden_check, fallback }        │
└───────────────────────────┬───────────────────────────────┘
                             │  fetch + 解析（§6 数据流）
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  L2 · 运行时状态 (Runtime)                                  │
│  仅存在于一次订单推演期间（内存，不落盘）                     │
│  OrderInput → DramaState（流动）→ DramaEvent[]（产出）       │
└───────────────────────────┬───────────────────────────────┘
                             │ 推演结束写回
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  L3 · 玩家持久化 (PlayerState · localStorage)               │
│  UserStats：shopVisit / flags / affinity / memoryTier ...    │
│  ← 跨订单、跨会话持久化，NPC「记忆」的数据底座              │
└───────────────────────────┬───────────────────────────────┘
                             │ 解锁 / 累计
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  L4 · 图鉴与成就 (Collection)                               │
│  Achievement 解锁列表 · 店铺/骑手/分支 图鉴（嵌入 L3）      │
└─────────────────────────────────────────────────────────────┘
```

**层间契约**：
- L1 字段改了 → 升级 `configVersion`，L2 解析器按字段存在性容错（§8）。
- L2 产出（DramaEvent[] + 新 flags）→ 落盘进 L3。
- L3 的 `memoryTier` / `flags` / `affinity` → 作为下一次 L1+L2 推演的**历史行为参数**输入（这就是「NPC 记忆」闭环，对应 GDD P1）。

---

## 2. L1 · 内容配置 Schema（brain ↔ waimai 契约）

> 信封 6 字段对齐 `whoknow-brain/docs/api-spec.md` v2.2；`food.branches` 为本规范 §3 的权威形状。

### 2.1 顶层信封

| 字段 | 类型 | 必填 | 来源 | 消费者 | 说明 |
|------|------|:----:|------|------|------|
| `version` | string | ✅ | brain | waimai | 格式 `YYYY-MM-DD.NNN`，配置版本号 |
| `generated_at` | ISO8601 | ✅ | brain | waimai/ui_meta | 生成时间（UTC） |
| `effective_until` | ISO8601 | ✅ | brain | waimai | 失效时间，过期走降级（api-spec §降级策略） |
| `meta` | object | ✅ | collector | 引擎/UI | `{ hot_today, weather, holiday }` 元参数源（§3.5） |
| `food` | object | ✅ | generator | 引擎 | 本规范 §2.2 |
| `mart` | object | ✅ | generator | mart（本期空 `{}`） | 多产品共用信封 |
| `soul_layer` | object | ❌ | generator | 引擎/UI | NPC 人格层（§2.4） |
| `ui_meta` | object | ❌ | deployer | UI | 水印 / 新鲜度（§2.5） |
| `story_assets` | object | ❌ | generator | 引擎 | 当日素材（§2.6） |
| `forbidden_check` | object | ✅ | forbidden | 引擎/审核 | 禁忌词自检结果（§2.7） |
| `fallback` | object | ✅ | deployer | 降级 | 静态兜底配置，形状同 `food`（§2.8） |

### 2.2 `food` 对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `boss` | `Record<shopId, BossLines>` | ✅ | 老板台词池，按店 ID 索引；`BossLines` = `Record<persona, string[]>`（persona ∈ `angry|gentle|lazy|philosopher`，对齐 BRAND 角色色） |
| `rider` | `Record<riderId, string[]>` | ✅ | 骑手吐槽池，按骑手 ID 索引 |
| `branches` | `DramaBranch[]` | ✅ | **DRAMA 引擎核心输入**，本规范 §3 权威形状；MVP 可为空数组（ frontend 用内置 seed 补） |

### 2.3 记忆分级（写入 `boss` 池的约定键）

> 这是 GDD P1「NPC 被记住」的数据落地。老板台词池按 `memoryTier` 分桶，引擎按玩家在该店的 `shopVisitCount` 选桶。

| 桶键 | 触发条件（玩家视角） | 数据来源 |
|------|------------------|---------|
| `first`（首触） | 该店 `shopVisitCount === 1` | L3 |
| `regular`（回头客） | `shopVisitCount >= 3` | L3 |
| `vip`（真爱粉） | `shopVisitCount >= 10` 或 `affinity[shopId] >= 200` | L3 |

`BossLines` 实际结构扩展为：
```json
{
  "s001-老王烧烤": {
    "angry": {
      "first":   ["头回来了？这边请——开玩笑的，第一次吧"],
      "regular": ["又是你？这周第三回了啊"],
      "vip":     ["我的 VIP 来了，今天多给你加个蛋"]
    }
  }
}
```
> `[PLACEHOLDER]`：分级阈值（3 / 10）与 `affinity` 跨度需 playtest 标定。

### 2.4 `soul_layer`

```json
{
  "npc_id": "s001-老王烧烤",
  "personality": "angry",
  "speech_style": "short-punchy",
  "topic_preference": ["weather", "hot_search"],
  "forbidden_words": ["萌", "亲", "宝贝"]
}
```
| 字段 | 类型 | 说明 |
|------|------|------|
| `personality` | enum | 决定 `boss` 池用哪个 persona 桶 |
| `topic_preference` | string[] | 从 `meta` 取素材的方向 |
| `forbidden_words` | string[] | 该 NPC 永不说的词（冗余于全局 `forbidden_check`，但 per-NPC 更细） |

### 2.5 `ui_meta`

```json
{ "ai_story_visible": true, "last_brain_run": "2026-07-24T03:00:00Z", "freshness_hours": 12 }
```
驱动首页/订单页脚水印文案（L1/L2/L3 降级文案映射见 api-spec §P0-3）。

### 2.6 `story_assets`

```json
{ "today_hot_topic": "周一打工人的命", "npc_quotes_today": ["..."] }
```
引擎在 `branches` 条件命中时，可注入当日素材做变量替换（如 `{hot}`）。

### 2.7 `forbidden_check`（红灯 0 容忍）

```json
{ "version": "1.0", "red_light_count": 0, "yellow_light_count": 0, "passed": true }
```
- `red_light_count > 0` → 整包拒绝，waimai 走 L4 降级（api-spec §降级 L4）。
- 本规范所有示例话术与字段名，均已过 `whoknow-brain/docs/禁忌词清单-v1.0.md` 红灯校验。

### 2.8 `fallback`

形状**完全等同** `food`。brain 全挂时 waimai 拉静态兜底（api-spec §降级 L3）。**约束**：fallback 的 `branches` 必须非空（否则 MVP 无戏精），由前端内置 seed 充当。

---

## 3. L2 · 运行时状态（DramaBranch / DramaState / DramaEvent）

> 仅存在于一次订单推演的内存中，推演结束即回收，仅「产出物」（新 flags、affinity 增量、成就）写回 L3。

### 3.1 `OrderInput`（推演输入，下单时收集一次）

| 字段 | 类型 | 值域 / 例 | 流向 |
|------|------|-----------|------|
| `shopId` | string | `s001-老王烧烤` | L1 选 `boss` 池 + L3 记忆 |
| `riderId` | string | `r001` | L1 `rider` 池 + L3 骑手关系 |
| `addressTag` | enum | `home\|school\|company\|weird` | DramaState 初始偏移 |
| `remarkTag` | enum | `none\|more_spicy\|less_spicy\|no_coriander\|no_scold\|show_time\|weird` | DramaState 初始偏移 |
| `orderTotal` | number | ¥5 ~ ¥544 `[PLACEHOLDER]` | 分支条件 |
| `avgDishPrice` | number | ¥5 ~ ¥68 | 分支条件 |
| `dishCount` | number | 1 ~ 15 | 分支条件 |
| `dishCategory` | string[] | 烤串/甜品/... | 混搭吐槽 |
| `deliveryFee` | number | ¥0 ~ ¥6 | 骑手士气 |
| `expectedTime` | number | 18~60 分钟 | 超时焦虑 |
| `history` | `HistoryParams` | 见 §3.4 | 分支条件（来自 L3） |

> ⚠️ **禁忌词清洗**：原 DRAMA §5 的 `addressTag` 含 `toilet`/`bermuda`/`icu`，均改为单一 `weird`（奇葩地址）桶——既避免红线词，也简化引擎（无需为每个荒诞地址写分支）。

### 3.2 `DramaState`（流动状态）

| 字段 | 类型 | 初始 | 范围 | 说明 / 调参杠杆 |
|------|------|:----:|:----:|------|
| `bossMood` | number | 50 | -100~100 | 老板心情；<0 出餐慢+骂人狠，>70 送小菜 |
| `riderMorale` | number | 60 | 0~100 | 骑手士气；低→拒单/冷漠 |
| `totalDelay` | number(ms) | 0 | 0~`[PLACEHOLDER]` | 累计配送延时，驱动结局 |
| `tags` | string[] | [] | — | 阶段间传递的叙事标签（如 `boss_complained`） |

> 引擎每阶段事件可改这些值的子集（通过 DramaEvent 的 `moodDelta` / `delay` / `effect.tags`）。

### 3.3 `DramaEvent`（阶段产出，最小展示单元）

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `phase` | enum | ✅ | `accept\|cook\|deliver\|complete` |
| `actor` | enum | ✅ | `boss\|kitchen\|rider\|system` |
| `text` | string | ✅ | 台词（变量 `{price}`/`{hot}`/`{shop}` 由引擎替换） |
| `moodDelta` | number | ❌ | 对 `bossMood` 的增量 |
| `delay` | number(ms) | ❌ | 本事件耗时，可负（加速） |
| `effect` | object | ❌ | `{ tags?: string[], flags?: string[], affinityDelta?: Record<shopId,number> }` |

### 3.4 `HistoryParams`（来自 L3 的历史行为参数，命名对齐 L3）

| 字段 | 来源（L3） | 用途 |
|------|------------|------|
| `shopVisitCount` | `UserStats.shopVisit[shopId]` | 记忆分级 + 分支条件 |
| `dishRepeatCount` | `UserStats.dishOrders[dishId]` | 「真爱菜品」吐槽 |
| `totalOrders` | `UserStats.totalOrders` | 老顾客 |
| `todayOrderCount` | `UserStats.todayOrderCount` | 连吃预警（§3.6） |
| `currentStreak` | `UserStats.currentStreak` | 真爱粉 |
| `lastShopSame` | 派生 | 「又是你？」 |
| `lastRiderSame` | 派生 | 骑手老友 |
| `flags` | `UserStats.flags` | 跨单叙事触发（§5.2） |

### 3.5 元参数（来自 L1 `meta`）

| 字段 | 来源 | 作用 |
|------|------|------|
| `weather` | `meta.weather` | 雨天 `totalDelay` +20% `[PLACEHOLDER]` |
| `holiday` | `meta.holiday` | 节假日老板懒散 |
| `hot` | `meta.hot_today` | 注入 `{hot}` 变量 |
| `luckToday` | 每日随机 0~1 `[PLACEHOLDER]` | 所有概率 ±10% |

> 元参数由 brain `meta` 在 M1 即提供（api-spec M0 采集器必做），**不 defer 到 M3**。MVP 无 brain 时 frontend 用本地随机兜底。

### 3.6 权威 `DramaBranch` 形状（与 api-spec §JSON Schema 对齐）

```json
{
  "id": "poor",
  "name": "穷鬼套餐",
  "weight": 5,
  "trigger": {
    "condition": "orderTotal < 20",
    "probability": 1.0,
    "probabilityScaling": { "param": "todayOrderCount", "threshold": 3, "rate": 0.2 },
    "cooldownMin": 0,
    "maxPerUser": 0
  },
  "rarity": "common",
  "achievements": ["poor_meal"],
  "chain": [
    { "phase": "accept",   "text": "¥{price}也好意思点？锅都懒得开", "moodDelta": -30 },
    { "phase": "cook",     "text": "老板在躺椅上玩手机，厨房没动静", "delay": 15000 },
    { "phase": "deliver",  "text": "骑手：等了好久才出餐，这单亏了" },
    { "phase": "complete", "text": "下次低于这个数，我建议你还是好好吃饭", "effect": { "tags": ["boss_complained"] } }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | string | ✅ | 分支唯一 ID |
| `name` | string | ✅ | 展示用（图鉴） |
| `weight` | number | ✅ | 多分支同命中时的权重池 |
| `trigger.condition` | string | ✅ | 条件串（语法见 §3.7） |
| `trigger.probability` | number 0~1 | ✅ | 命中后触发概率 |
| `trigger.probabilityScaling` | object | ❌ | `{param, threshold, rate}`，参数越极端概率越高 |
| `trigger.cooldownMin` | number | ❌ | 冷却（分钟），防短时重复 |
| `trigger.maxPerUser` | number | ❌ | 每用户上限，0=不限 |
| `rarity` | enum | ✅ | `common\|uncommon\|rare\|epic\|legendary`（成就/图鉴/社交动态筛选用） |
| `achievements` | string[] | ❌ | 完成后解锁的成就 ID（§4） |
| `chain` | `DramaEvent[]`（含 `next`） | ✅ | **自包含事件链**，节点用 `next` 串接 |

**`chain` 节点扩展字段**（超出 §3.3 基础 DramaEvent）：
- `next`：string | null —— 下一节点 ID；省略/null = 本阶段结束。

> 🔧 **与 DRAMA-ENGINE-V2 的取舍**：原文档用 `firstEvent`（id 引用）+ 独立 `DramaEvent[]` 数组。本规范改为**分支内联 `chain`**（自包含链表），理由：brain 生成单条 JSON 更简单、frontend 解析零间接寻址、降级 fallback 自洽。**DRAMA-ENGINE-V2 §四/§六 的 `firstEvent` 写法即日起作废**，以本规范为准（见该文档顶部注记）。

### 3.7 条件串语法（引擎解析，非写死）

```
操作符:  >  <  >=  <=  =  !=    ?(数组包含)  !(数组不包含)
逻辑:     & (AND)   | (OR)   () (分组)
函数:     flag(name)           跨单叙事标记
          hasTag(name)         DramaState.tags
示例:
  "orderTotal < 20"
  "avgDishPrice < 10 & dishCount > 3"
  "shopVisitCount >= 3 & !flag(boss_fan_{shopId})"
  "todayOrderCount >= 3"
  "flag(married_{riderId}) & riderId = {riderId}"
```

---

## 4. L4 · 图鉴与成就（Collection）

> 长期留存脊柱。嵌入 L3（`UserStats` 内），不单独落盘。

### 4.1 `Achievement`

```json
{
  "id": "poor_meal",
  "name": "穷鬼套餐",
  "description": "触发穷鬼分支",
  "rarity": "uncommon",
  "icon": "🥈",
  "condition": "branch.poor.completed",
  "hidden": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一 |
| `name` | string | 展示 |
| `rarity` | enum | 同 §3.6，决定墙上的颜色/排序 |
| `icon` | string | emoji 或图片 URL（**禁 emoji 食物占位**仅限 UI 资产，非玩法） |
| `condition` | string | 达成条件（引擎判定） |
| `hidden` | boolean | 隐藏成就（图鉴半透明，达成才显） |

### 4.2 图鉴（Collection）桶

`UserStats` 内新增三个图鉴数组，记录「见过什么」：
- `shopsSeen: string[]` —— 去过的店
- `ridersSeen: string[]` —— 遇过的骑手
- `branchesSeen: string[]` —— 触发过的分支（含 rarity，用于「集齐 legendary」类成就）

> 图鉴是「截图传播 + 回访」的轻量替代（避开 GDD 审计删除的「胡闹等级 XP」包袱）：玩家想集齐，就会回来点不同店/写不同备注。

---

## 5. L3 · 玩家持久化（PlayerState · localStorage）

> 全游戏唯一「记忆」底座。键名全局前缀 `whoknow:waimai:`。

### 5.1 `UserStats` 权威结构（清洗禁忌词后）

```typescript
interface UserStats {
  // —— 计数 ——
  shopVisit:    Record<string, number>   // { "s001-老王烧烤": 5 }
  dishOrders:   Record<string, number>   // { "d001": 3 }
  totalOrders:  number
  totalSpent:   number
  todayOrderCount: number
  todayOrderDate:  string                // "2026-07-24"，跨天归零
  lastFiveOrders: string[]               // 最近 5 单 ID
  currentStreak:  number                 // 连续点餐天数
  canceledOrders: number

  // —— 关系（NPC 记忆底座）——
  affinity:     Record<string, number>   // { shopId: -500~500 } 老板好感
  riderHistory: Record<string, number>   // { riderId: 次数 }
  memoryTier:   Record<string, 'first'|'regular'|'vip'>  // 派生缓存，避免每次算

  // —— 跨单叙事 ——
  flags:        string[]                 // 见 §5.2 合规词表

  // —— 图鉴（§4.2）——
  shopsSeen:    string[]
  ridersSeen:   string[]
  branchesSeen: string[]
  achievements: string[]                  // 已解锁成就 ID
}
```

### 5.2 合规 `flags` 词表（**禁忌词红线已洗**）

| flag 模板 | 触发 | 后续影响 | 红灯状态 |
|-----------|------|---------|:--------:|
| `married_{riderId}` | 破产救赎→结缘 | 下次同骑手触发「宿世姻缘」 | ✅ 合规（喜剧恋爱） |
| `boss_fan_{shopId}` | `affinity[shopId] >= 200` | 老板：「我的真爱粉来了」 | ✅ 合规 |
| `dark_dish_{shopId}` | 黑暗料理分支 | 下次点该店：「这味儿……又是你？」 | ✅ 合规（非投毒） |
| `blacklisted_{shopId}` | 连续差评 ≥3 | 暂不能点这家（喜剧拉黑） | ✅ 合规 |
| `saved_{riderId}` | 被骑手帮过 | 下次见面：「最近还好吗？」 | ✅ 合规 |
| `fate_reunion` | 宿世姻缘达成 | 图鉴彩蛋 | ✅ 合规 |

> 🔴 **已退役（原 DRAMA 红灯字段，禁止再用）**：
> `food_poison_*` / `bomb_survivor` / `icu_survivor` / `bomb_order` / `haunted_boss_*`
> 理由：对应「投毒 / 炸弹 / ICU / 诈尸」均为 `禁忌词清单-v1.0` 红灯。引擎条件串里若见这些词，解析器应**直接拒绝该分支**。

### 5.3 持久化规则

| 项 | 规则 |
|----|------|
| 键名 | `whoknow:waimai:stats`（单键存整个 `UserStats` JSON） |
| 写入时机 | 每单推演结束 + 成就解锁时 |
| 版本 | `UserStats` 带 `schemaVersion: 1`，读时若低版本走迁移（§8.3） |
| 上限 | 单键 < 50KB（图鉴/flags 自然封顶，无无限增长风险） |
| 清理 | 不自动清；「重置进度」入口手动清（GDD P3 零负担，入口藏深） |

---

## 6. 跨层数据流（一次订单的生命周期）

```
① 启动: waimai fetch L1 Config (brain 或 fallback)
        ↓
② 浏览: 玩家选店/加菜 → 写入临时 OrderInput (部分)
        ↓
③ 下单: 补全 OrderInput (address/remark/total...) + 注入 L3.HistoryParams
        ↓
④ 推演: OrderInput + L1.branches + L1.meta(元参数) → DramaState 4 阶段流动
        ↓ (产出 DramaEvent[] + 新 flags/affinity/成就)
⑤ 写回: 新 flags → L3.flags；affinity 增量 → L3.affinity；
        branchesSeen / achievements 更新 → L3 图鉴
        ↓
⑥ 展示: DramaEvent[] 渲染为戏精弹层/气泡/结局卡（截图爆点，无水印）
⑦ 回访: 下次 L3.memoryTier/shopVisitCount/flags 成为新推演输入 → NPC「记得你」
```

---

## 7. 禁忌词合规总表（数据结构层一次洗清）

| 原 DRAMA 字段 / 值 | 层 | 问题 | 本规范替换 |
|---------------------|----|------|------------|
| `addressTag: icu` | L2 | ICU 红灯 | 并入 `weird` |
| `addressTag: bermuda` | L2 | 异次元/荒诞易擦边 | 并入 `weird` |
| `addressTag: toilet` | L2 | 公厕粗鄙 | 并入 `weird` |
| `flag: food_poison_*` | L3 | 投毒红灯 | `dark_dish_*` |
| `flag: bomb_survivor` | L3 | 炸弹红灯 | 退役（删） |
| `flag: icu_survivor` | L3 | ICU 红灯 | 退役（删） |
| `tag: bomb_order` | L2 | 炸弹红灯 | 退役（删） |
| `flag: haunted_boss_*` | L3 | 诈尸红灯 | 退役（删） |
| `DramaBranch.firstEvent` + 独立 `DramaEvent[]` | L1/L2 | 间接寻址冗余 | 内联 `chain[]` 链表 |

> 内容层（具体台词文本）的红灯清洗见 `GDD-v2` §9.4 合规示例 + `禁忌词清单-v1.0`；本规范只负责**结构层**不出现红灯词。

---

## 8. Edge Cases & 降级数据一致性

### 8.1 brain 降级时 L1 形状必须一致
- L4 降级（api-spec）拉 `fallback.food`，其 `branches` 形状 == §3.6，前端无感切换。
- 若 `fallback.food.branches` 也为空 → frontend 注入内置 seed（§2.8 约束），**绝不**让引擎因缺 branches 崩溃。

### 8.2 `forbidden_check.red_light_count > 0`
- 整包拒绝；走 L4 诚实告知「今天没新段子」（api-spec §P0-3 L4）。
- 已落盘 L3 的旧 flags/affinity **不受影响**（玩家记忆不丢）。

### 8.3 localStorage 损坏 / 版本迁移
- 读 `UserStats` 失败 → 重置为默认空结构（玩家重头开始，零负担）。
- `schemaVersion` 低于当前 → 跑迁移函数补齐缺失字段（缺字段用默认值，不丢已有计数）。

### 8.4 条件串解析失败
- 某 `branch.trigger.condition` 语法错 → 该分支**静默跳过**（不阻断其他分支），记 console.warn。
- 含退役红灯词（`bomb`/`icu`/`food_poison`/`haunted`）→ 直接拒该分支（§5.2）。

### 8.5 同一单多分支命中
- 全部命中条件的分支入「权重池」，按 `weight` 随机选 1 个执行（§3.6）。
- `cooldownMin` / `maxPerUser` 在选前过滤（冷却中/超次的不入池）。

---

## 9. Open Questions / `[PLACEHOLDER]` 清单

| 项 | 当前值 | 待标定 | 方法 |
|----|--------|--------|------|
| `bossMood` 初始 | 50 | `[PLACEHOLDER]` | playtest 笑率 |
| `riderMorale` 初始 | 60 | `[PLACEHOLDER]` | playtest |
| 记忆分级阈值 | 3 / 10 | `[PLACEHOLDER]` | 回访率 |
| `affinity` VIP 阈值 | 200 | `[PLACEHOLDER]` | 回访率 |
| `totalDelay` 上限 | — | `[PLACEHOLDER]` | 超时焦虑边界 |
| 雨天延时增幅 | +20% | `[PLACEHOLDER]` | 真实感 |
| `luckToday` 波动 | ±10% | `[PLACEHOLDER]` | 随机感 |
| 分支权重池 | 按 `weight` | 需标定 | 首触新鲜感 |

> 所有数值为假设，定义「坏长什么样」：① 同店第 5 单台词与第 1 单无差异 = 记忆失效，立刻否决；② 连续 10 单无任何 `branches` 命中 = 引擎死，立刻否决；③ 任意红线词出现在运行时 = 配置污染，立刻否决。

---

_权威数据源 · 取代 api-spec/DRAMA/GDD 的碎片化定义 · 玩法师 2026-07-24_
