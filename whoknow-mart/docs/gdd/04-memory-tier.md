# 🛒 胡闹导购 · 系统 GDD 04 · 记忆分级（L3 · localStorage）

> **版本**：v1.0 · 2026-07-26 · design-strategist
> **层**：L3（玩家持久化）· MVP 必做
> **上游**：`00-CONCEPT.md` §3.1（记忆分级）§6.1（记忆分级）§6.4（否决#1）· `DATA-STRUCTURE-v1` §2.3（memoryTier 桶）§5（UserStats）
> **下游**：`02-selection-statemachine.md`（台词桶输入）· `05-codex.md`（图鉴写回）

---

## 1. 机制（Mechanics）

记忆分级让 NPC「记得玩家」：按**同导购博弈次数**（mart 派生源）切换导购台词池，使第 N 次遇同导购时态度软化（P1 支柱「因你不同」）。

- **派生源**：`guideVisit[guideId]` = 同导购博弈次数（**非** waimai 的 `shopVisitCount`）。
- **桶切换**：`first`（=1）/ `regular`（≥3）/ `vip`（≥10 或 affinity≥阈值）。
- **台词池**：`L1.mart.guides[].lineBuckets{first,regular,vip}` 按桶选台词；首触毒舌 → 回头客软化 → 真爱粉调侃。
- **第 ≥5 次差异**：同店第 5 单 ≠ 第 1 单（附加否决，总纲 L2-C6）。

## 2. 数据（Data）

`UserStats`（mart 扩展，键前缀 `whoknow:mart:`）复用 waimai 结构（DATA-STRUCTURE §5.1）：

```jsonc
{
  "schemaVersion": 1,
  "guideVisit": Record<guideId, number>,   // { "guide_wanger_ma": 5 }
  "memoryTier": Record<guideId, 'first'|'regular'|'vip'>,  // 派生缓存
  "affinity":  Record<guideId, number>,    // 来自 03
  // …图鉴/flags 见 05
}
```

- **L1 台词桶**：`L1.mart.guides[].lineBuckets{first,regular,vip: string[]}`（mart 自建，§9.2）。

## 3. 状态（State）

| 桶 | 触发（玩家视角） | 数据来源 |
|----|------------------|----------|
| `first` | `guideVisit[guideId] === 1` | L3 |
| `regular` | `guideVisit[guideId] >= 3` | L3 |
| `vip` | `>= 10` 或 `affinity[guideId] >= 阈值` | L3 |

- 派生缓存 `memoryTier` 避免每次重算（DATA-STRUCTURE §5.1 同构）。

## 4. 边界（Boundaries）

- 计数**仅**按同导购博弈次数（P1 派生源），与 waimai `shopVisitCount` 语义隔离（EVOL-3 标注）。
- 记忆失效即 P1 破裂（否决#1）→ 整包不可接受。
- `reset` 入口藏深（P3 零负担，不主动清，DATA-STRUCTURE §5.3）。

## 5. 失败模式（Failure modes）

| 失败 | 表现 | 处置 |
|------|------|------|
| 记忆失效 | 同导购第 ≥5 次台词/弱点无差异 | 否决#1 → 回炉（视为 P1 破裂，§6.4） |
| localStorage 损坏 | 读 `UserStats` 失败 | 重置默认空结构（零负担，§8.3） |
| 跨会话丢失 | 计数未持久 | 写回时机：每局结束（02 终止时）写 `guideVisit++` |
| schemaVersion 低 | 旧结构缺字段 | 迁移补齐（缺字段默认，不丢已有计数，§8.3） |

## 6. 数值占位（[待测试] · 依 00-CONCEPT §10）

| 项 | 占位 | 标定 |
|----|------|------|
| 记忆分级阈值 | `3 / 10` | P1 记忆感知（第 5 单差异） |
| vip affinity 阈值 | `[待测试]` | 回访率 H6 |

## 7. 契约对齐（Contract alignment）

- **复用**：waimai `memoryTier` 桶键 `first/regular/vip` + 阈值语义（§9.1）；`UserStats` 结构 + 键前缀 `whoknow:mart:`（§9.1）。
- **EVOL-3**：DATA-STRUCTURE 注明 `memoryTier` 派生源可产品化——waimai=`shopVisitCount`，mart=同导购博弈次数；无新字段。
- **不修改 waimai 文件**（L1-T5）。

## 8. 验收（Acceptance）

- [ ] 同导购第 ≥5 次博弈台词/弱点与第 1 次有可感知差异（P1，H6 通过）。
- [ ] 首触毒舌 → 回头客软化 → 真爱粉调侃 三桶切换正确。
- [ ] localStorage 损坏不自崩，重置为零负担空结构。
- [ ] `memoryTier` 键前缀 `whoknow:mart:`，与 waimai 不混。
- [ ] `EVOL-3` 派生源标注在 DATA-STRUCTURE 落地。

---

_系统 GDD 04 · 记忆分级 v1.0 · design-strategist · 2026-07-26_
