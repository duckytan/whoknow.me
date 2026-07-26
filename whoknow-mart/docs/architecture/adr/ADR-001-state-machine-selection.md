# ADR-001 · 选招制状态机选型：自建 `MartRoundState` 查表，不复用 waimai `DramaState`

> **状态**：ACCEPTED（Phase 3 评估采纳）
> **日期**：2026-07-26
> **主责**：eng-lead（程基岩）
> **关联**：`00-CONCEPT.md` §4.3 · `02-selection-statemachine.md` §4/§9.2 · `mart-L1-datastructure-draft.md` §9.2 · `DATA-STRUCTURE-v1` §3.2

---

## 1. 状态（Context）

mart 的运行时核心是「选招制博弈」：每轮出 4 选项（位置随机）→ 玩家选招 → 查克制矩阵 → 破防度按 `moodDelta` 增减 → 双胜利判定。该机制与 waimai 的「订单推演」（`DramaState`：bossMood/riderMorale/totalDelay + 四阶段 chain 流动）**语义与形状完全不同**：

- waimai：外部订单（地址/备注/金额）驱动四阶段线性推演，目标是「出餐延时 + 老板心情」叙事。
- mart：玩家主动选招驱动多轮博弈，目标是「破防度 0~100 双胜利」，无订单、无延时、无骑手。

决策点：**mart 运行时状态机应复用 waimai `DramaState`/dramaEngine，还是自建 `MartRoundState` 查表模型？**

## 2. 决策（Decision）

**自建 `MartRoundState` 选招制查表模型，不复用 waimai `DramaState` 及 dramaEngine。**

- L2 运行时仅持有 `MartRoundState = { guideId, guideArchetype, affinity(0~100), round, roundCap, tags, selectedHistory, positionSeed, optionsThisRound }`，**仅内存不落盘**。
- 状态机核心 = `矩阵查表 + 双胜利判定 + 位置随机 shuffle + 防死循环 roundCap`（详见 `ARCHITECTURE.md` §3）。
- waimai 的 `dramaEngine.ts`（条件串解析 / 权重池 / 四阶段 chain / next 跳转）**不引入** mart——mart 无 branch/condition 概念，引入即过度设计且触碰 waimai 文件风险（L1-T5）。

## 3. 后果（Consequences）

**正面**
- 状态形状与业务语义 1:1 对齐，无「破防度 vs bossMood」语义污染（呼应 EVOL-2/6 同类坑）。
- 零依赖 waimai 运行时，杜绝改 waimai 文件（L1-T5 红线天然守住）。
- 选招制可独立单测（位置随机分布、双胜利边界、防死循环），机检否决#1/#2 更聚焦。

**负面 / 成本**
- 两套状态机代码（waimai dramaEngine + mart martStateMachine）并存，概念层不共享。
- v2 接 brain 时，brain 产出的 `DramaEvent`（`actor:'guide'`）需经一层 adapter 映射为 mart 内部事件流（已在 `ARCHITECTURE.md` §9.2 预留 `MartEventSource` 扩展点），而非直接喂 `DramaState`。

**可接受性**：MVP 纯前端、不接 brain，两套并存成本可控；语义清晰优先于代码复用，符合「配置与状态分离」「mart 自建 L2」的 GDD 铁律。

## 4. 备选方案（Alternatives Considered）

| 方案 | 描述 | 否决理由 |
|---|---|---|
| **A. 复用 waimai `DramaState`** | mart 把破防度塞进 `bossMood`、把选招映射成「branch 条件串」驱动 chain | ① 语义污染（破防度≠老板心情，重演 EVOL-2 坑）；② 为迁就四阶段 chain 扭曲选招制多轮模型；③ 必须读/改 waimai 类型或 fork，触发 L1-T5 红线 |
| **B. 复用 waimai `dramaEngine` 解析器** | mart 复用条件串/权重池逻辑 | 选招制无 condition/probability/weight 概念，引入后 80% 逻辑是空转；且跨 App import waimai 源码破坏隔离 |
| **C. 自建但落盘 MartRoundState** | 把状态写 localStorage 以支持「中途退出续玩」 | P3 零负担（affinity 仅内存不落盘为进度）；落盘增加复杂度与重置负担，否决 |
| **✅ D. 自建 `MartRoundState` 查表（采纳）** | 仅内存 + 矩阵查表 + 双胜利 + 防死循环 | 语义 1:1、零 waimai 依赖、可独立机检 |

---

_eng-lead（程基岩）· 2026-07-26_
