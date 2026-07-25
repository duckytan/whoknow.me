# 🔗 胡闹导购 · 复用契约对齐清单

> **版本**：v0.1 · 2026-07-25
> **主责**：游承峰（Yoan Summit，本会话主理人代行）
> **状态**：🟡 对齐备料（冻结期，M1 解冻前生效）
> **唯一权威**：`whoknow-waimai/docs/specs/DATA-STRUCTURE-v1`（字段）· `whoknow-brain/docs/api-spec.md`(v2.2)（契约）
> **目的**：划清 **mart 直接复用什么 / mart 自己定义什么**，避免重演 v1 字段二义坑（`mood`/`moodDelta`、`speaker`/`actor`、分支 6≠7）。

---

## 0. 为什么需要这份清单

- 外卖那边（`engineering-lead` / 另一 workbuddy）正在把 `DATA-STRUCTURE-v1` 字段权威落定。
- mart 与 waimai **共用同一 brain 信封、同一 localStorage schema、同一图鉴成就结构**。
- **风险**：若 mart 抢先另起字段命名，会与外卖权威冲突 → 重演 v1 二义。
- **裁定**：mart 的所有字段，凡外卖已有权威的，**直接复用，零改写**；mart 独有概念（选招制 / 好感度）才自建，且命名对齐权威风格。

---

## 1. 直接复用（照搬，不改）

| 层 | 复用对象 | 权威出处 | mart 落地备注 |
|---|---|---|---|
| **L1 信封** | `version` / `generated_at` / `effective_until` / `meta` / `mart` / `soul_layer` / `ui_meta` / `story_assets` / `forbidden_check` / `fallback` | api-spec §JSON Schema / DATA-STRUCTURE §2.1 | `mart` 是信封内并列 product key（同 `food`），目前 api-spec 示例 `mart:{}` 空，**M1-a 填** |
| **L1 信封 6 字段** | meta/soul_layer/ui_meta/story_assets/forbidden_check/fallback | api-spec v2.2 | mart 与 food 同信封，零差异 |
| **L3 UserStats** | `shopVisit`/`dishOrders`/`totalOrders`/`totalSpent`/`todayOrderCount`/`todayOrderDate`/`lastFiveOrders`/`currentStreak`/`canceledOrders`/`affinity`/`riderHistory`/`memoryTier`/`flags`/`shopsSeen`/`ridersSeen`/`branchesSeen`/`achievements` | DATA-STRUCTURE §5.1 | **键名前缀改 `whoknow:mart:`**（food 用 `whoknow:waimai:`）；`affinity` 在 mart 语义 = **导购好感**（非老板）；`memoryTier` 派生自「同导购博弈次数」 |
| **L4 图鉴成就** | `Achievement` 结构 / `shopsSeen`·`ridersSeen`·`branchesSeen` 桶 / `Rarity` 枚举 | DATA-STRUCTURE §4 | mart 图鉴桶改为「导购见过 / 招式见过 / 弱点击中」；成就 icon 禁食物 emoji 占位 |
| **条件串语法** | `> < >= <= = != ? ! & | ()` + `flag(name)` / `hasTag(name)` | DATA-STRUCTURE §3.7 | mart 的「导购性格隐藏弱点」判定直接复用此语法 |
| **forbidden_check** | `{ version, red_light_count, yellow_light_count, passed }` | DATA-STRUCTURE §2.7 | `red_light_count > 0` → 整包拒绝，mart 走 L4 降级 |
| **4 级降级** | 今日 / 昨日 / 静态 fallback / L4 诚实告知 | api-spec §降级策略 / §P0-3 | mart 同套；fallback.mart 形状 == `L1.mart`（M1-a 填） |
| **ui_meta 水印** | `ai_story_visible` / `last_brain_run` / `freshness_hours` | DATA-STRUCTURE §2.5 | 驱动 mart 页脚水印，**永远显示，绝不覆盖戏精弹层**（截图爆点保持干净电商伪装） |
| **Rarity 枚举** | `common`/`uncommon`/`rare`/`epic`/`legendary` | DATA-STRUCTURE §3.6 | mart 的导购性格 / 招式 / 吐槽分支用同枚举做图鉴稀有度 |
| **chain[] 内联链表** | 分支用内联 `chain[]`，节点 `next`/`nextWeights` 串接；**弃用 `firstEvent` + 独立 `DramaEvent[]`** | DATA-STRUCTURE §3.6（DRAMA 原写法已作废） | mart 的导购事件链**同样用 `chain[]`**，不自创间接寻址 |

---

## 2. 字段命名权威（避免二义重演）

| 权威字段 | ❌ 禁用旧名（v1 坑） | 含义 | mart 用法 |
|---|---|---|---|
| `actor` | `speaker` | 事件说话者枚举 `boss\|kitchen\|guide\|system` | mart 用 `guide`（导购）替代 `boss`/`rider` 语义；枚举值需对齐外卖风格 |
| `moodDelta` | `mood` | 对好感/心情的增量 | mart 的「好感度 delta」用 `moodDelta` 字段名（语义 = 导购 affinity 增量） |
| `next` + `nextWeights` | — | 多分支链路 | 导购多轮博弈的「下一轮选项链」用同结构 |
| `id` | — | 唯一 ID | 导购 / 招式 / 分支 / 弱点 一律 `id` 唯一 |

> 🔴 红线字段（DATA-STRUCTURE §5.2 / §7 已退役，**mart 永不出现**）：`food_poison_*` / `bomb_survivor` / `icu_survivor` / `bomb_order` / `haunted_boss_*` / `addressTag: icu|bermuda|toilet`（mart 无地址维度，直接不需）。

---

## 3. mart 自己定义（待补，M1-a 填）

> 以下 mart 独有，**不与其他产品冲突**，但命名须对齐 §2 风格。当前 api-spec `mart:{}` 空，本清单即其草案。

### 3.1 `L1.mart` 内部结构（M1-a 必填）
```
mart: {
  "guide": {                          // 导购池，按 guideId 索引（对齐 food.boss 的 Record<id, Lines>）
    "g001-毒舌导购": {
      "personality": "poison_tongue",  // 对齐 BRAND 角色色枚举
      "first":   ["首触毒舌..."],
      "regular": ["回头客毒舌..."],
      "vip":     ["真爱粉毒舌..."]
    }
  },
  "moves": {                         // 招式池（4 选项内容源）
    "need":    { "text": "我需要！", "persona_weak": "rational|dark" },  // 命中弱点 +40
    "compare": { "text": "我比过价了", "persona_weak": "poison_tongue|dark" },
    "poor":   { "text": "求求了", "persona_weak": "lazy|dark" },
    "rebel":  { "text": "爱卖不卖", "persona_weak": "philosopher|poison_tongue" }
  },
  "affinity_init": 50,               // 好感度初始（[PLACEHOLDER]）
  "round_cap": [PLACEHOLDER],        // 轮次上限防死循环
  "branches": []                    // 可选：导购吐槽分支（形状同 DATA-STRUCTURE §3.6）
}
```

### 3.2 `L2` 运行时（mart 独有）
- **不复用 waimai 的 `DramaState`（bossMood/riderMorale/totalDelay）**。
- mart 运行时 = **选招制博弈状态机**（见 `mart-MVP-概念设计-v0.1.md` §3）：
  - 状态量：`affinity`（0~100）、`round`（当前轮次）、`tags`（博弈叙事标签）。
  - 每轮：出 4 选项（位置随机）→ 用户选招 → 查克制矩阵（§3.3）→ `affinity += moodDelta`。
  - 流转：`affinity>=100` → 放行；`<=0` → 劝退；否则下一轮。
- **字段命名对齐 §2**：矩阵 delta 用 `moodDelta`；多轮链用 `chain[]`+`next`。

### 3.3 好感度模型参数（[PLACEHOLDER]）
| 参数 | 初始 | 待标定 |
|---|---|---|
| `affinity_init` | 50 | playtest 说服爽度 |
| 单轮 ±delta | +40 / -10 | 矩阵手感 |
| `round_cap` | — | 防死循环 |
| vip 阈值 | 10 次 / affinity≥? | 回访率 |

---

## 4. 当前缺口（必须 M1-a 消除）

| 缺口 | 现状 | 消除动作 | 责任人 |
|---|---|---|---|
| `mart:{}` 空 | api-spec 示例未填 | M1-a 按 §3.1 填 `L1.mart` | 本主理人（mart） |
| `L2` 博弈状态机未定义 | 仅概念 | 按 `mart-MVP-概念设计` §3 实现 | 本主理人（mart） |
| `fallback.mart` 空 | 降级 L3 无料 | 填静态兜底（branches 非空） | 本主理人（mart） |
| 导购 persona 枚举对齐 BRAND | 概念 5 型 | 对齐 BRAND 角色色 enum | 本主理人（mart） |

---

## 5. 红线校验（mart 同样 0 容忍）

- 所有 mart 话术（导购台词 / 招式文案 / 吐槽分支）**必须过 `forbidden_check`**（红灯 0 容忍）。
- 行动项 A 已洗 mart 红线台词（钱多 / 工资 / 人傻钱多 / 真实明星点名）→ 见总纲 §5 + `whoknow-mart/docs/`。
- 禁忌词分级见 `whoknow-brain/docs/禁忌词清单-v1.0.md`：
  - 🔴 红灯（绝对禁止）：政治敏感 / 色情暴力 / 歧视 / 威胁违法 / 真实信息 / 虚假宣传。
  - 🟡 黄灯（关键词过滤）：竞品品牌（美团→某团）/ 真实现代人名（→某明星）/ 真实地名（→京城）。
  - 🟢 绿灯：天气 / 节日 / 虚构 NPC / 抽象情感。

---

## 6. 跨实例协作提醒（给外卖那边的 note）

- **mart 不抢先定义外卖已有字段**：若 `DATA-STRUCTURE-v1` 后续增补（如 `memoryTier` 阈值、新 `Rarity`），mart 直接跟，不另起。
- **brain 信封 `mart` key 由 mart 主责人填**（M1-a），外卖侧只保证信封机制通用。
- **`actor` 枚举**：mart 用 `guide` 代表导购；若外卖侧 `actor` 枚举扩展（如加 `guide`），双方同步，避免解析器分歧。
- **同步点**：每周对齐一次 `DATA-STRUCTURE-v1` 变更，mart 据此刷新本清单 §1/§2。

---

_对齐备料 · 待外卖字段落定后 M1 生效 · 主理人代行 · 2026-07-25_
