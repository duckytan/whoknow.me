# DRAMA-SEED 评审报告（AI 自检）

> 范围：`docs/specs/DRAMA-SEED-v1-2026-07-24.json`（22 分支）
> 时间：2026-07-25 · 评审：主理人编排层（基于 dramaEngine 实态核验，非项目自述）
> 目的：补齐缺失环节后，对完整 SEED 做一致性 / 可达性 / 好玩度扫描。

## 1. 结构概览

| 维度 | 数量 | 说明 |
|---|---|---|
| 总分支 | 22 | 含 1 个 default 兜底 |
| 店间专属 | 5 | shop_s01~s05_angry/philo/gentle/weird/lazy |
| 同店递进 | 2 | regular_3rd(第3单) / vip_5th(第5单) |
| 骑手专属 | 3 | rider_r001_fast / r002_slow / r003_lost |
| 通用 | 12 | poor / cheap_no_rider / bankrupt_love / overeat_cares / odd_eats / fate_reunion / blacklist_reunion / remark_more_spicy / remark_no_scold / boss_blacklist / address_weird / default |
| 成就 | 12 | 全部有对应解锁分支 |

## 2. 字段一致性 ✅

- 全部 22 分支经 `parseBranches` 校验：每个 chain 节点含 `phase/actor/text`。
- `assertNoPlaceholderLeak` 通过：无 `{price}`/`{fee}` 等旧占位符；合法白名单含 `shopVisitCount`（本轮补全）。
- `default` 为唯一 `isFallback`，保证每单必有反应。

## 3. 可达性核对 ✅（每个分支都可触发）

| 分支 | 触发条件 | 可达性 |
|---|---|---|
| 店间 5 | `shopId = s0X` | ✅ 该店下单恒真，prob 0.6 |
| regular_3rd | `shopVisitCount >= 3` | ✅ 同店连下第 3 单（含本次计数） |
| vip_5th | `shopVisitCount >= 5` | ✅ 同店连下第 5 单 |
| 骑手 3 | `riderId = r00X` | ✅ 分配后恒真，prob 0.5 |
| odd_eats | `remarkTag=odd \| flag(...)` | ✅ 备注「私房菜」首次可达（P0-1 已修） |
| blacklist_reunion | `flag(blacklisted_{shopId})` | ✅ boss_blacklist 播种后回访可达（P0-1 已修） |
| 其余通用 | 金额/备注/地址/flags | ✅ 条件明确 |

**无死分支**：相比三司会审前的 2 个死锁分支（odd_eats 自锁、blacklist_reunion 无 setter），现已全部可达。

## 4. 成就解锁核对 ✅（12/12 均可解锁）

| 成就 | 解锁分支 |
|---|---|
| poor_meal / cheap_ghost / bankrupt_legend / overeat_warn | poor / cheap_no_rider / bankrupt_love / overeat_cares |
| dark_chef / fate_bound / reconciled / spicy_soul / peace_please / lost_rider | odd_eats / fate_reunion / blacklist_reunion / remark_more_spicy / remark_no_scold / address_weird |
| regular（新）/ vip_fan（新） | regular_3rd / vip_5th |

成就墙不再是「假满」——全部可解锁。

## 5. 差异感评估（核心乐趣维度）

- **店间差异 ✅**：5 家店各有专属人格段子，选店不再只是换皮。
- **同店递进 ✅**：第 3 单认老主顾、第 5 单 VIP 隐藏菜单，重复游玩有回报。
- **骑手差异 ✅**：3 骑手随机分配 + 专属台词（闪电/慢工/路痴）。

## 6. 风险与改进清单（「好不好笑」后续调优点，非阻塞）

| 级别 | 项 | 说明 |
|---|---|---|
| P2 | 店间/骑手专属分支各仅 1 个变体 | 同店多单会重复同一段子；建议每专属分支加 2-3 个变体（按 `probability` 多权重或 `next` 随机）。 |
| P2 | 店间(prob 0.6) 可能压制同店递进(prob 0.7/0.85) | 同店高单数时偶被店间覆盖；可在 `shopVisitCount>=5` 时调低店间概率或提高 vip 权重。 |
| P2 | baseline(default) 曝光偏低 | 店间+骑手专属常命中，日常基线段子少露脸；可接受（多样性优先），后续按需提权。 |
| P3 | 文案风味一致性 | 部分分支台词偏「说明式」而非「戏精式」，待真机 playtest 后按笑率精修。 |
| P3 | 无障碍回归 | 品牌色/手写体已落地，但对比度与字号尚未做专项回归（遗留 M2）。 |

## 7. 结论

SEED 当前 **结构合法、全可达、成就全可解锁、差异感三维（店间/同店/骑手）已落地**。内容量已铺满，满足「游戏过程完整可玩」目标。剩余为「好不好笑」的调优（变体丰富度、概率平衡、文案风味），属非阻塞的打磨项，按用户意向「先铺满、慢慢调」即可推进发布。

> 评审方法说明：本报告基于实际读取 `dramaEngine.ts` / `loader.ts` / `memory.ts` 的运行时行为核对，非依赖项目自述，避免「名实不符」误判。
