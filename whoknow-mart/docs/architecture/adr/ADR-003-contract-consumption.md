# ADR-003 · 契约消费策略：零改写复用共享信封 + EVOL 演进不破共享解析器

> **状态**：ACCEPTED（Phase 3 评估采纳）
> **日期**：2026-07-26
> **主责**：eng-lead（程基岩）
> **关联**：`00-CONCEPT.md` §0.2/§9 · `00-SYSTEMS-INDEX.md` §0 · `REVIEW.md` §3 · `DATA-STRUCTURE-v1` §1/§2 · `api-spec.md` v2.2 · `EVOL-1-guide-enum-request.md`

---

## 1. 状态（Context）

mart 与 waimai **共用同一 brain 信封**（api-spec §JSON Schema：6 字段 + `mart` + `fallback.mart`）。mart 还必须消费：`forbidden_check`（红灯整包拒）、`Rarity` 枚举、`chain[]` 内联链表、`ui_meta` 水印、4 级降级。

历史上 v1 曾因 `mood`/`moodDelta`、`speaker`/`actor`、分支 6≠7 等**二义坑**返工（见 `mart-L1-datastructure-draft.md` §0、`DATA-STRUCTURE-v1` §0）。当前红线 **L1-T4（字段命名权威）/ L1-T5（不改 waimai 文件）/ 零改写（EVOL 不破共享解析器）** 要求 mart 严格消费而非另起。

决策点：**mart 应如何消费共享契约，既零改写、又能在需要新字段时安全演进（EVOL）？**

## 2. 决策（Decision）

**mart 只读消费共享信封与契约，复制（非 fork）共享解析器代码，新增结构只落在 `mart` 子树；任何新字段一律登记为 EVOL、绝不在 mart 侧抢先落地。**

具体落地：
1. **信封零改写消费**：config loader 仅「取出 `mart` 子树 + 校验信封 6 字段存在性 + 取 `forbidden_check`/`ui_meta`/`fallback.mart`」，不改写任何共享字段名/语义（对齐 `ARCHITECTURE.md` §4.2）。
2. **解析器复制而非改写**：`core/forbiddenCheck.ts` 与 waimai `src/core/forbiddenCheck.ts` **逐字同源**（复制），保证红灯解析一致；mart 不 import waimai 源码（隔离），也不修改它。
3. **mart 自建子集隔离**：`L1.mart = { guides, moves, matrix, affinity, products }` 全部为 `mart` 键下新建，**与 waimai `food.{boss,rider,branches}` 并列不侵入**。
4. **EVOL 只登记不落地**：EVOL-1（actor+guide）/ EVOL-2（affinity 注释）/ EVOL-3（memoryTier 派生源）/ EVOL-6（moodDelta→affinity）均为「共享契约层变更」，mart 侧只留 TODO 注释 + 类型占位，**等 waimai 主责人在 `DATA-STRUCTURE-v1` 落地后一次性对齐**（对齐 `mart-L1-datastructure-draft.md` §0 铁律）。
5. **字段命名权威**：`actor`/`moodDelta`/`next`+`nextWeights`/`id` 严格复用，冲突以 `DATA-STRUCTURE-v1` 胜出。

## 3. 后果（Consequences）

**正面**
- 守住 L1-T4/L1-T5/零改写三条红线，避免 v1 二义坑重演。
- 共享解析器（forbidden_check/Rarity/chain/ui_meta/降级）只维护一份语义，双方解析一致。
- EVOL 演进有清晰闸门：mart 改动等待 waimai 协调，不会造成「两边解析分歧」。

**负面 / 成本**
- 复制 `forbiddenCheck.ts` 等代码意味着双份维护（waimai 修 bug 时 mart 需同步复制）。缓解：该模块为稳定纯函数，变更极低频；CI 可加「两文件 diff 一致」告警。
- EVOL-1 阻塞期（waimai 未加 `guide`），mart v2 事件源适配器需以「枚举未识别则跳过该 actor」容错（§8.4 精神），避免解析器因未知枚举崩溃。

**可接受性**：红线优先级高于 DRY；复制稳定纯函数的成本远低于跨 App 耦合风险。

## 4. 备选方案（Alternatives Considered）

| 方案 | 描述 | 否决理由 |
|---|---|---|
| **A. mart import waimai 源码（共享模块）** | 直接 `import` waimai `forbiddenCheck`/`memory` | 🔴 跨 App 源码耦合，破坏 L1-T5 隔离；waimai 改会引发 mart 不可控变更 |
| **B. fork 改写成 mart 版** | 复制后按 mart 语义改字段名 | 🔴 直接违反 L1-T4 字段命名权威 + 零改写，重演二义坑 |
| **C. 等 waimai 全落定再写 mart** | 完全不碰，等 M1 解冻 | 拖延 MVP；战略 #1 明确 app 优先、可先用静态信封验证 |
| **✅ D. 只读消费 + 复制解析器 + EVOL 登记（采纳）** | 取子树、复制纯函数、新建只落 mart 键、EVOL 只登记 | 零改写、隔离、可演进，符合全部红线 |

---

_eng-lead（程基岩）· 2026-07-26_
