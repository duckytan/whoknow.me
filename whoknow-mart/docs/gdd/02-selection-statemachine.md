# 🛒 胡闹导购 · 系统 GDD 02 · 选招制博弈状态机（L2 运行时）

> **版本**：v1.0 · 2026-07-26 · design-strategist
> **层**：L2（运行时状态机）· MVP 必做 · **mart 独有，不复用 waimai `DramaState`**
> **上游**：`00-CONCEPT.md` §3.1（选招制/克制矩阵）§4.3（状态机）§6.4（否决标准）· `mart-MVP-概念设计-v0.1.md` §3
> **下游**：`03-break-defense-engine.md`（破防度）· `04-memory-tier.md`（记忆输入）· `05-codex.md`（图鉴写回）· `06-drama-dialog-ui.md`（渲染）

---

## 1. 机制（Mechanics）

选招制博弈是核心循环运行时：4 个招式选项每轮出现、**位置随机**（防肌肉记忆，P4），玩家选 1 招 → 查该导购克制矩阵 → 破防度按 `moodDelta` 增减 → 判定胜负态或进入下一轮。

- **位置随机**：每轮 4 选项的物理位置 shuffle（seed 来自 `Math.random` 或等价），4 招全出现、不重复。
- **克制矩阵查表**：`delta = matrix[guideArchetype][moveId]`；命中隐藏弱点 `+40` / 踩雷 `−10` / 平手 `+10`。
- **双胜利判定**：
  - `affinity >= 100` → 破防态（导购叹气「服了，下单吧」= 掌控爽）。
  - `affinity <= 0` → 反消费胜利态（导购「省钱了，下次别来」= 省了钱也是赢）。
  - 二者**均为 success 语义**（ART-BIBLE §2.4），归零态非「失败」。
- **防死循环**：`round >= round_cap` 仍未决 → 默认劝退（反消费胜利态），不卡死。
- **保底轮次**：N 轮内必破（轮次内确保至少存在可达破防态的路径，防「逼半天还不卖」被耍感，§5.2）。

## 2. 数据（Data）

**L2 运行时状态（仅内存，不落盘）**：

```jsonc
MartRoundState = {
  "guideId": "guide_wanger_ma",       // 当前导购（REVIEW §5 规范 id）
  "guideArchetype": "poison_tongue",  // 查矩阵用（规范 id）
  "affinity": 50,                      // 破防度 0~100（来自 03）
  "round": 1,                          // 当前轮次
  "roundCap": "[待测试]",              // 防死循环上限
  "tags": [],                          // 叙事标签（跨轮传递）
  "selectedHistory": [],               // 已选 moveId 序列（图鉴/复盘）
  "positionSeed": 0x...,               // 本轮 4 选项位置随机种子
  "optionsThisRound": [                // 本轮 4 选项（moveId 已 shuffle）
    "move_compare", "move_firm", "move_poison", "move_pity"
  ]
}
```

- **4 招固定**（L1.mart.moves）：`move_firm`(我需要！💪) / `move_compare`(我比过价了📊) / `move_pity`(求求了🥺) / `move_poison`(爱卖不卖🤬)（见 REVIEW §5）。
- **矩阵**：`matrix[archetype][moveId] = delta`，5 型 × 4 招 = 20 格（§9.2）。

## 3. 状态（State）

```
[CHECKOUT_TRIGGER] ──(来自 01)──▶ INTRO（导购闪现首爆点, P6）
   │
   ▼
ROUND: 生成 optionsThisRound(shuffle) → 渲染 4 选项(06)
   │
   ▼ 玩家选招 moveId
EVALUATE: delta = matrix[archetype][moveId]
   │  affinity += delta（clamp[0,100]）
   │
   ├─ affinity >= 100 ─▶ WIN_BREAK（破防态·放行）
   ├─ affinity <= 0  ─▶ WIN_ANTI（反消费胜利态·劝退）
   ├─ round >= roundCap ─▶ WIN_ANTI（默认劝退·防死循环）
   └─ 否则 ─▶ round++ → ROUND（位置重随机）
```

- **WIN_BREAK / WIN_ANTI 均终止博弈**，写回 04（记忆）/ 05（图鉴），移交 06/08 渲染结局卡。

## 4. 边界（Boundaries）

- **不复用 waimai `DramaState`**（bossMood/riderMorale/totalDelay）——mart 自建 `MartRoundState`（§4.3 / §9.2 明确）。
- `affinity` 永不越界：每次增减后 `clamp(affinity, 0, 100)`。
- 位置随机 seed 必须真随机（不可预测顺序），且每轮重随机。
- 记忆输入来自 04（同导购博弈次数 → 台词桶），不在此系统内计算记忆。

## 5. 失败模式（Failure modes）

| 失败 | 表现 | 处置 |
|------|------|------|
| 矩阵查不到 | `matrix[archetype][moveId]` 缺失 | 默认 `+10` 平手，不崩；记 warn |
| delta 累加越界 | 破防度 <0 或 >100 | `clamp` 到 `[0,100]` |
| 死循环 | 玩家一直选 −10 且未到 cap | `round_cap` 到达强制 WIN_ANTI（劝退） |
| 选项位置冲突 | shuffle 出重复 move | 重 shuffle 至 4 招去重全出现 |
| 导购 archetype 无效 | `guideArchetype` 不在 5 规范 id | 回退默认 `poison_tongue`，记 warn |

## 6. 数值占位（[待测试] · 依 00-CONCEPT §10）

| 项 | 占位 | 标定 |
|----|------|------|
| `affinity` 初始 | `50*`（反骨建议 30~40） | H2 笑率 |
| 单轮 delta | `+40 / −10 / +10` | 矩阵手感 |
| `round_cap` | `[待测试]` | 单局 5–15min（§6.4 防死循环） |
| 保底轮次 N | `[待测试]` | 防被耍感（§5.2） |

## 7. 契约对齐（Contract alignment）

- **mart 自建 L2**：`MartRoundState` 不复用 `DramaState`（§9.2）。
- **字段命名权威**（§9.3）：delta 语义沿用 `moodDelta`（mart 目标=affinity，非 bossMood → **EVOL-6 NEW**，见 REVIEW §4）；未来 brain 生成事件链用 `next`+`nextWeights` 与 `id`（L1-T4）。
- **EVOL-1**：v2 接 brain 后导购事件 `actor: "guide"`（当前 MVP 不产 DramaEvent，仅消费 L1.mart 自建矩阵）。
- **矩阵模式待确认**：本 GDD 采用 **1 隐藏弱点(+40) + 1 踩雷(−10) + 2 平手(+10)** 的规范模式（满足 §6.4 否决#2「不全 +40/全 −10」）。⚠️ L1 draft §1 示例为 2 弱点+2 踩雷（无 neutral），属漂移，见 REVIEW §6。

## 8. 验收（Acceptance）

- [ ] 每轮 4 选项位置随机且 4 招全出现（连续 10 轮位置分布无 >50% 单招，H5）。
- [ ] `affinity >= 100` → 破防态文案「服了，下单吧」；`<= 0` → 反消费胜利态「省钱了，下次别来」。
- [ ] `round_cap` 到达 → 默认劝退（WIN_ANTI），无死循环。
- [ ] 归零态在 06/08 渲染为 success 语义（绿框，非红叉/失败，双胜利）。
- [ ] 任一导购矩阵不存在全 +40 或全 −10 轮次（§6.4 否决#2 机检通过）。
- [ ] 不引用 waimai `DramaState` 任何字段。

---

_系统 GDD 02 · 选招制博弈状态机 v1.0 · design-strategist · 2026-07-26_
