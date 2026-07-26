# 🛒 胡闹导购 · 系统 GDD 05 · 图鉴（L4 · 收集）

> **版本**：v1.0 · 2026-07-26 · design-strategist
> **层**：L4（图鉴与成就）· MVP 必做（基础）
> **上游**：`00-CONCEPT.md` §3.1（P5 图鉴）§6.1（基础图鉴）· `DATA-STRUCTURE-v1` §4（L4 图鉴成就）
> **下游**：`02-selection-statemachine.md`（写回弱点击中/分支）· `08-screenshot-share.md`（成就卡）

---

## 1. 机制（Mechanics）

图鉴是「单机也要有回来理由」（P5）的轻量收集，替代 gacha 计数成就。收集三类桶 + 成就解锁。

- **三桶（MVP 基础）**：导购见过（guidesSeen）/ 招式见过（movesSeen）/ 弱点击中（weakpointsHit）。
- **成就**：`Achievement` 结构复用 waimai（§4.1），用 `Rarity` 枚举做颜色/排序。
- **非计数成就**：图鉴是「见过什么」的集合（P5），非 XP/等级（P3 零负担）。

## 2. 数据（Data）

`UserStats`（mart 扩展，键前缀 `whoknow:mart:`）复用 waimai L4 结构（§4.2 / §5.1）：

```jsonc
{
  "guidesSeen": string[],      // 见过的导购 id
  "movesSeen": string[],       // 见过的招式 id
  "weakpointsHit": string[],  // 命中过的隐藏弱点 (guideId+moveId 组合)
  "branchesSeen": string[],    // 吐槽分支（v2 接入 brain 后）
  "achievements": string[]     // 已解锁成就 id
}
```

- **桶命名对齐 waimai**（`shopsSeen/ridersSeen/branchesSeen` 系列）；mart 用 `guidesSeen/movesSeen/weakpointsHit` 同源扩展。
- **`Achievement`**：`{id,name,description,rarity,icon,condition,hidden}`（§4.1）。

## 3. 状态（State）

| 桶 | 写入时机 | 去重 |
|----|----------|------|
| `guidesSeen` | 进入某导购博弈 | Set 去重 |
| `movesSeen` | 任一轮出现该招选项 | Set 去重 |
| `weakpointsHit` | 命中隐藏弱点(+40) | Set 去重 |
| `achievements` | 达成 condition | Set 去重 |

## 4. 边界（Boundaries）

- 桶命名与 waimai L4 同构，不另起名称（避免解析分歧）。
- 单键 < 50KB 上限（DATA-STRUCTURE §5.3），图鉴/achievements 自然封顶。
- `rarity` 用 waimai `Rarity` 枚举：`common|uncommon|rare|epic|legendary`（§3.6）。

## 5. 失败模式（Failure modes）

| 失败 | 表现 | 处置 |
|------|------|------|
| 计数重复 | 同导购/招式重复入桶 | Set 去重，不重复计数 |
| 存储超限 | 单键 > 50KB | 图鉴自然封顶（无无限增长） |
| 成就误解锁 | condition 误判 | 引擎 condition 判定，单测覆盖 |

## 6. 数值占位（[待测试]）

| 项 | 占位 | 标定 |
|----|------|------|
| 图鉴收集目标（全解锁数） | `[待测试]` | 回访动机 H6 |
| 成就总数 | `[待测试]` | 成就者 Bartle |

## 7. 契约对齐（Contract alignment）

- **复用**：waimai L4 图鉴成就结构（§4）+ `Rarity` 枚举（§3.6）+ `Achievement` 结构（§4.1）；键前缀 `whoknow:mart:`（§9.1）。
- **桶扩展**：`guidesSeen/movesSeen/weakpointsHit` 为 mart 对 L4 桶的同源扩展（不冲突 waimai `shopsSeen/ridersSeen`）。
- **不修改 waimai 文件**（L1-T5）。

## 8. 验收（Acceptance）

- [ ] 导购见过 / 招式见过 / 弱点击中 三桶在图鉴页可视。
- [ ] 成就解锁带 `Rarity` 颜色/排序（复用枚举）。
- [ ] 含「已访问 N 次」标记（v2 接入记忆计数，关联 04）。
- [ ] 桶命名与 waimai L4 同构，键前缀 `whoknow:mart:`。

---

_系统 GDD 05 · 图鉴 v1.0 · design-strategist · 2026-07-26_
