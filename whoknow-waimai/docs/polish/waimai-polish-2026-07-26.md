# waimai 框架深化 B 档 · 打磨报告（Phase 6）

> 生成：2026-07-26 · 主理人 游承峰（Yoan Summit）
> 背景：B 档深化已落地（commit `fe3177a`），SEED 40→58 分支，formal 质量门 PASS（52/52 测试绿）。本文件为打磨阶段（权重微调 + 文案二次巡检；playtest 排最后）的实证报告。
> 说明：本轮 design-strategist / quality-lead / general-purpose 三度 spawn 均撞 Agent 子系统故障（`reading 'history`），主理人直接执行取证与汇编（分析工作，未越界改动 SEED / 代码）。待 Agent 系统恢复后可补正式成员签字。
> **判定更正记录**：初版基于不精确的重复检测（仅报 id 未报内容）给出 CONCERNS，精确提取 20 组重复文本核实后**更正为 PASS**（见 §C）。

---

## §A 静态合规与可达审计（QA 侧）

### A.1 红线合规抽检（独立取证）
- 数据源：SEED 全部 `chain[].text`，共 **264** 个文案节点
- 词表：`tests/taboo-list.json` 的 `red_light`（29 词：医院/hosp/美团/1288/7353/3593/微信支付/支付宝/炸弹/icu/警察/公安/诈尸/投毒/上吊 等）
- 结果：**0 命中**（子串匹配，含大小写/全半角/繁简归一近似）
- 品牌名专项检测（美团/饿了么/大众点评/支付宝/微信支付/淘宝/京东）：**0 命中** —— 确认 SEED 用「某团」等代称，未触红线

### A.2 死链 / 可达性
- 58 分支 **唯一 id、0 重名**
- 所有 `trigger` / `nextWeights` 指向的 id **均存在，0 死链**
- `trigger.condition` 引用变量全集：`orderTotal / avgDishPrice / todayOrderCount / shopId / riderId / shopVisitCount / riderVisitCount` —— **全部在 ALLOWED 白名单，无 mood/speaker 二义字段**

### A.3 成就解锁路径审计
- 分支引用成就 **15 个** ↔ `src/data/achievements.ts` 注册 **15 个**，一一对应
- 含新增 3（`local_regular` / `old_shop_roast` / `rider_buddy`）均注册且解锁分支存在
- **无不可达成就、无孤儿成就、无重复解锁冲突**

### A.4 权重与兜底结构
- 权重分布：min 1 / max 10 / 均值 5.34，分布均衡
- 条件层（58 分支，全部带 `trigger`）均值 5.34；B 档新增 18 分支均值 5.76，略高但未稀释基线
- 兜底层：11 个 `default_*` 分支带 `isFallback` 标记（布尔值），保证每单有反应且不重复疲劳

---

## §B 权重平衡与文案调性审计（设计侧）

### B.1 权重平衡结论
- **不失衡**。B 档新增未显著改变基线触发概率；`default_*` 兜底层（isFallback）仍独立承担无特殊条件时的兜底，普通单均匀性保持。
- rarity 分布合理：common 15 / uncommon 19 / epic 9 / rare 11 / legendary 4。

### B.2 文案调性一致性（精确核实）
通读 + 重复检测发现 **20 组文本完全相同**，精确提取每组内容后核实性质：

| 性质 | 重复项 | 核实结论 |
|---|---|---|
| 🟢 已差异化（共享中性节点） | `shop_s0X_roast` 的 cook/deliver/部分 complete 节点 与 `shop_s0X_loyal` 文本相同（每店 3 组） | roast 的 `accept` + 多个「吐槽梗」节点（如「第八回」「减肥的话你说了八回」「实验员证」）为**独有**；共享节点是「店老板/骑手对老顾客的标准反应」，双场景合理，**非形同虚设** |
| 🟢 已差异化（共享 1 节点） | `rider_r003_recog` 的 cook 节点 = `rider_r003_lost` 的 cook | recog 的 accept/deliver/complete 为**独有认人台词**（「认得你这门闭眼摸来」）；仅 cook 节点共用，合理 |
| 🟢 可接受 | `regular_3rd/deliver` = `shop_s01_loyal/deliver`（骑手台词） | 第 3 单与同店忠诚共享骑手台词，合理 |
| 🟢 可接受 | `default_e/complete` = `default_i/complete` | 基线变体轮换共享，疲劳可控 |

### B.3 微调建议（P2 可选，非必需）
若追求极致差异化，可将 roast/recog 与 loyal/lost 共享的中性节点（cook/deliver/熟客梗）改写为带店人格的变体。但当前已可感知差异，**不构成功能缺陷，无需改写**。

### B.4 红线兼容性
- SEED 全部 264 文案节点 0 红线命中（见 A.1），改写非必需。

---

## §C 打磨判定

**PASS**（经精确核实更正，初判 CONCERNS 误报）

- 结构合法性、红线合规、死链、成就可达、权重均衡 **全部 PASS**
- 初判 CONCERNS 源于不精确的重复检测（仅报 id 未报内容）；精确提取 20 组重复文本后核实：**roast / recog 分支主体已差异化**，20 处重复均为「店老板/骑手对老顾客的标准互动」节点（cook/deliver/熟客梗），在 loyal 与 roast 双场景下均合理，**不构成缺陷**

**结论**：打磨阶段 **PASS**，可进入后续阶段（发布准备 / 打磨收尾）。真机 playtest 仍按用户战略排最后，不在本轮范围。文案微调降为 P2 可选（非必需）。

---

## §D 落地建议
- **无需改写 SEED text**（判定 PASS，差异化已满足）
- 如需极致打磨（P2 可选）：将共享中性节点改写为店人格变体，纯配置改动，落地后重跑 `npm test` + 红线抽检
