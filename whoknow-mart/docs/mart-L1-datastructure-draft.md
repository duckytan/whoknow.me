# 🛒 胡闹导购 · L1.mart 数据结构骨架（M1-a 备料）

> **主责**：游承峰（Yoan Summit，本会话主理人代行；spawn 工具开放后由 `design-strategist` 正式接管）
> **状态**：🟡 骨架草案 · **字段值待对齐外卖 `DATA-STRUCTURE-v1` 后填**
> **铁律**：mart 字段命名权威必须复用 waimai（`actor` 非 `speaker`、`moodDelta` 非 `mood`、`next`+`nextWeights`、`id`），**严禁抢先另起命名**（重演 v1 二义坑）。本草案只给结构，不给与外卖冲突的字段名。

---

## 0. 缘起

`mart-MVP-概念设计-v0.1.md` §0 已点明：brain `api-spec` 示例里 `mart: {}` 仍是空的。mart 的 **L1 内部结构（导购池 / 招式池 / 破防度）与 L2 运行时（选招制博弈状态机）尚未定义**——这是 M1 解冻必填项。

但复用契约清单（`mart-复用契约对齐清单.md` §6）铁律：**mart 字段必须等外卖 `DATA-STRUCTURE-v1` 字段权威落定后一次性对齐填充，禁止提前赋值**（否则重演 v1 的 `mood`/`moodDelta`、`speaker`/`actor`、分支 6≠7 二义坑）。

→ 本文件做**骨架 + 待填标注**，外卖字段一落定，mart 立刻能填，零返工。

---

## 1. 导购 Persona 池（L1.mart.guides）

```jsonc
guides: [
  {
    "id": "guide_wanger_ma",        // 待对齐外卖 id 命名权威
    "name": "毒舌·王二麻",
    "archetype": "poison_tongue",     // 规范英文 id（见 REVIEW.md §5.1 C2 表：poison_tongue/rational/lazy/philosopher/dark）；禁用中文型名
    "motive": "B",                  // 动机 A-E（反骨双主打 B+C），见《反骨定义与动机设定》§七
    "hiddenWeakness": ["比价"],            // 命中 +40（1 弱点，余 2 招为中性 +10）
    "thunderMine": ["装可怜"],            // 踩雷 -10（1 踩雷，余 2 招为中性 +10）
    "lineBuckets": {                // 复用 waimai L3 记忆分级桶
      "first":   [ "…首触台词…" ],  // 待填（禁提前赋值）
      "regular": [ "…回头客…" ],
      "vip":     [ "…真爱粉…" ]
    },
    // ↓ 以下字段待对齐外卖 DATA-STRUCTURE-v1 字段权威后填
    "rarity": "R?",                 // 复用 Rarity 枚举
    "avatar": "?"                   // v2 立绘资产
  },
  // …其余 4 型：rational·李算盘 / lazy·赵拖拖 / philosopher·钱满满 / dark·周暗暗（archetype 一律用规范英文 id，见 REVIEW.md §5.1）
]
```

---

## 2. 招式池（L1.mart.moves）

```jsonc
moves: [
  { "id": "move_firm",    "label": "我需要！",   "archetype": "坚定" },
  { "id": "move_compare", "label": "我比过价了", "archetype": "比价" },
  { "id": "move_pity",    "label": "求求了",     "archetype": "装可怜" },
  { "id": "move_poison",  "label": "爱卖不卖",   "archetype": "以毒攻毒" }
]
```
> 4 招式固定；**位置随机由运行时（L2）控制，不在 L1 存**（防肌肉记忆）。

---

## 3. 克制矩阵（L1.mart.matrix）

```jsonc
matrix[archetype][move] = delta   // 每导购：1 弱点 +40 / 1 踩雷 −10 / 2 中性 +10（规范 1+1+2，见 REVIEW.md §6 D2）
// 5 型 × 4 招 = 20 格，v1 草案见概念设计 §3.3，值待 playtest 标定
```
> ⚠️ 矩阵是 `[PLACEHOLDER]`：禁止在 playtest 前硬编码手感值（见 playtest 计划 §5 / §6）。

---

## 4. 破防度字段（L1.mart.affinity / 反骨版）

```jsonc
affinity: {
  "initial": 50,          // v1 占位；反骨建议更低起点（30~40），待 playtest
  "min": 0,
  "max": 100,
  "winState": "破防态",    // >=100 叹气放行
  "loseState": "反消费胜利态"  // <=0 劝退 = 省了钱（非失败）
}
```
> 字段名复用 `affinity`（waimai 同根），mart 语义 = **破防度**（反骨版 affinity）。

---

## 5. 与 waimai 复用边界（抄契约清单）

- **直接复用（照搬不改）**：L1 信封 6 字段、L3 `UserStats`（前缀 `whoknow:mart:`）、L4 图鉴成就、`forbidden_check`、4 级降级、`ui_meta` 水印、`Rarity` 枚举、`chain[]` 内联链表。
- **mart 自建（本 §1~§4）**：`guides` / `moves` / `matrix` / `affinity`。
- **所有 `[待填]` 字段必须等外卖 `DATA-STRUCTURE-v1` 落定后一次性对齐，禁止提前赋值。**

---

_主理人代行 · 2026-07-25 · M1-a 备料（非实现）_
