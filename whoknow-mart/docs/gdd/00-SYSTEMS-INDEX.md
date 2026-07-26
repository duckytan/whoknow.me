# 🛒 胡闹导购 · Phase 2 系统分解与依赖排序（系统索引）

> **文档类型**：Phase 2 系统设计 · 系统分解索引
> **版本**：v1.0 · 2026-07-26
> **主责**：design-strategist（文策渊）
> **上游权威**：`00-CONCEPT.md`（Phase 1 概念 v1.0）· `ART-BIBLE.md`（美术圣经 v0.1）· `whoknow-waimai/docs/specs/DATA-STRUCTURE-v1` · `BRAND.md`
> **下游**：本索引列出的 8 个逐系统 GDD（01–08）· `REVIEW.md`（跨 GDD 一致性评审）

---

## 0. 范围与纪律

本索引仅覆盖 **MVP（纯前端可玩验证版，不接 brain）** 的设计系统分解（§0.2 战略约束 #1、§6.1 MVP 边界）。所有数值为 `[待测试]`，定义「坏长什么样」见 `00-CONCEPT.md` §6.4 / §10。

**铁律重申**（来自 `00-CONCEPT.md` §0.2）：
- 不修改任何 waimai 文件（L1-T5 红线）。
- 新字段走「契约演进」清单（EVOL），不自建命名。
- 字段命名权威：`actor` / `moodDelta` / `next`+`nextWeights` / `id`。
- 禁忌词红线 0 容忍：`forbidden_check.red_light_count > 0` → 整包拒绝。

---

## 1. 系统清单（8 个）

| # | 系统 | GDD 文件 | 层 | 关键机制 |
|---|------|----------|----|----------|
| 01 | 商品舞台 | `01-product-stage.md` | L1（内容/舞台） | 离谱/正常商品；逛→点结算触发博弈（P6 首爆点） |
| 02 | 选招制博弈状态机 | `02-selection-statemachine.md` | L2（运行时） | 4 选项位置随机 + 克制矩阵查表 + 双胜利判定；**不复用** waimai `DramaState` |
| 03 | 破防度引擎（affinity） | `03-break-defense-engine.md` | L1+L2 | 0~100；命中 +40 / 踩雷 −10 / 平手 +10；≥100 破防态，≤0 反消费胜利态 |
| 04 | 记忆分级 | `04-memory-tier.md` | L3（localStorage） | 同导购博弈次数 → first/regular/vip；台词桶切换（P1） |
| 05 | 图鉴（L4） | `05-codex.md` | L4（收集） | 导购见过/招式见过/弱点击中；成就用 `Rarity` 枚举（P5） |
| 06 | 戏精弹层 UI | `06-drama-dialog-ui.md` | UI（L1/L2 渲染） | 戏精弹层 + 选招 4 选项；页脚水印分离（P2）；精确令牌引用（C3） |
| 07 | 禁忌词校验（forbidden_check） | `07-forbidden-check.md` | 契约（共享） | 红线 0 容忍；`red_light_count>0` 整包拒绝 → L4 降级 |
| 08 | 截图分享 | `08-screenshot-share.md` | UI（输出） | 结局卡/段子卡独立可分享视图；水印只进页脚（P2） |

---

## 2. 依赖排序（DAG）

```
L1 内容层（01 商品舞台 · 03 破防度引擎配置 · 04 记忆台词桶 · 05 图鉴桶 · 07 禁忌词）
        │  （L1.mart 配置 + 共享信封）
        ▼
L2 运行时（02 选招制状态机）── 消费 01 商品 / 03 矩阵 / 04 记忆输入 / 05 图鉴写入
        │
        ▼
L3 持久化（04 记忆分级写回 · 05 图鉴写回）── 键前缀 whoknow:mart:
        │
        ▼
UI 渲染（06 戏精弹层 · 08 截图分享）── 消费 02 状态 + 03 破防度 + 05 图鉴
        │
        ▼
07 禁忌词校验 ── 横切所有层文案/资产（红线 0 容忍，先于一切渲染）
```

**依赖要点**：
1. **01 商品舞台**是入口：无商品即无结算、无博弈。先于 02。
2. **03 破防度引擎**的配置（矩阵 delta / 胜负态）是 02 状态机的数值输入。先于 02 的「数值占位」回填。
3. **02 选招制状态机**是运行时核心，消费 01/03/04，写回 05。
4. **04 记忆分级**与 **05 图鉴**是 L3/L4 持久化，被 02 读（记忆输入）写（图鉴解锁）。
5. **06 戏精弹层**与 **08 截图分享**是纯渲染/输出层，依赖 02 的状态与 03 的破防度展示，不反向依赖。
6. **07 禁忌词校验**横切：所有 L1 文案、L2 事件文本、L3/L4 展示文案、UI 微文案均须过 `forbidden_check`，红灯即整包拒绝（L1-T1 / L2-C4）。

---

## 3. 跨系统一致性锚点（贯穿 01–08）

- **支柱 P1–P6**：见 `REVIEW.md` §1 逐条核对。
- **双重胜利**：破防态（affinity ≥ 100）与反消费胜利态（affinity ≤ 0）**均为 success 语义**，归零态绝不可渲染为「失败/红叉」（ART-BIBLE §2.4 / §5.4 / §9.1 #5）。
- **契约复用**：`actor` / `moodDelta` / `next`+`nextWeights` / `id` / `forbidden_check` / `Rarity` / `chain[]` / `ui_meta` 水印 / 4 级降级，全部零改写复用。
- **EVOL 演进项**：EVOL-1（`actor` 增 `guide`）/ EVOL-2（`affinity` 语义标注）/ EVOL-3（`memoryTier` 派生源）/ EVOL-4（archetype 自键承载）/ EVOL-5（填 `mart` 信封）/ **EVOL-6（NEW，`moodDelta` 语义目标标注）**。详见各 GDD §契约对齐 与 `REVIEW.md` §4。
- **C2 规范交叉引用表**（archetype id ↔ 中文型 ↔ `--role-*` token ↔ emoji ↔ 导购名）：见 `REVIEW.md` §5，全系统统一引用。
- **C3 令牌精确引用**：宿主伪装用 `--mart-host`(#FF5000)，胡闹动作/戏精用 `--brand-orange`(#ff7849)，二者分区不混用（ART-BIBLE §2.2）。

---

## 4. 待主理人 / 跨机协调项

| 项 | 性质 | 处理方 | 状态 |
|----|------|--------|------|
| EVOL-1 `actor` 增 `guide` | 共享契约硬演进 | waimai 主责人（DuckyPC）落地，mart 仅消费 | 🟡 待协调（见 `docs/contract/EVOL-1-guide-enum-request.md`） |
| L1 draft §1 用中文 `archetype` | 与概念 doc 英文 id 冲突 | mart 主责人修正为 `poison_tongue` 等 | 🟡 待修正（见 `REVIEW.md` §6） |
| L1 draft §1 矩阵 2+2（无 neutral） | 与概念 doc 1+1+2 漂移 | mart 主责人确认矩阵模式 | 🟡 待确认（见 `REVIEW.md` §6） |

---

_胡闹导购 · Phase 2 系统索引 v1.0 · design-strategist · 2026-07-26_
