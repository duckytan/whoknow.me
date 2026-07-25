# 胡闹外卖 v2 · 设计审计报告（design-auditor / 文策渊）

**任务**：ANL-DESIGN-01（P0）｜**评审强度**：lean/solo（1 人 / Vercel / 纯广告）
**日期**：2026-07-25｜**依据**：总纲 v3、GDD v2.2.2、DATA-STRUCTURE v1、DRAMA-ENGINE v2.1、DRAMA-SEED v1、brain api-spec v2.2、BRAND.md（均已 Read 核实）

## 总判定：🔶 CONCERNS
设计方向正确——三铁律未被违反，fun hypothesis 可证伪且有 playtest 硬闸门；但 **M1 写 DramaBranch 解析器 / 拉取 SEED 前，必须清除 5 项 P0 跨文档冲突 + 1 项核心乐趣缺口**。非 FAIL：所有缺陷均为可修的文档对齐与种子内容补全。

## 一、跨文档一致性审计（逐条）
1. **`mood` vs `moodDelta`**：GDD §9.4 链节点用 `"mood":-30`；DATA-STRUCTURE §3.3/§3.6 与 SEED 用 `moodDelta`。总纲 §8 行动项 B 称"已修"，但 GDD §9.4 残留未改。**以 DATA-STRUCTURE 为准 → GDD §9.4 改 `mood`→`moodDelta`**。（P0）
2. **`speaker` vs `actor`**：SEED 与 DRAMA-ENGINE §6.4 用 `speaker`；DATA-STRUCTURE §3.3 `DramaEvent` 用 `actor`。权威为 `actor`，但**可交付种子 SEED 用 `speaker`** → 二选一并对齐 SEED。（P0）
3. **分支目录 6≠7**：GDD §9.4 列 6 分支（poor/bankrupt_love/overeat/dark_dish/old_acquaintance/complaint）；SEED/DATA/DRAMA §6.4 为 7 分支（多 cheap_no_rider、fate_reunion、blacklist_reunion，无 complaint/old_acquaintance）。M1 消费 SEED → **GDD §9.4 须对齐 7 分支**。flag 名 `dark_survivor_{shopId}`（GDD/SEED）vs `dark_dish_{shopId}`（DATA §5.2）冲突，按权威统一为 `dark_dish`。（P0）
4. **`flag()` 语法冲突**：逗号双参 `flag(dark_survivor, s001)`（GDD §5.2、SEED old_acquaintance）vs 花括号单参 `flag(married_{riderId})`（DATA §3.7、SEED fate_reunion）。DATA 文法仅定义 `flag(name)`（1 参），逗号式不可解析 → **统一为 `flag({name}_{id})` 单参式**。（P0）
5. **persona 枚举**：DATA §2.2 用 `philosopher`，GDD §9.1 用 `philosophical` → 统一。（P1）
6. **`achievementUnlocked` vs `achievements`**：DRAMA-ENGINE §八 用 `achievementUnlocked`，DATA §5.1 用 `achievements` → 统一 `achievements`。（P1）
7. **`neverExpire`**：仅 GDD §9.4 有，DATA/SEED 无 → 纳入权威或删除。（P1）
8. **rarity 枚举**：common/uncommon/rare/epic/legendary 三处完全一致 ✓。

## 二、过度设计风险（solo / MVP）
- **35 维参数池**（DRAMA §五）实际 OrderInput≈10 维，种子分支仅用 orderTotal/avgDishPrice/todayOrderCount/hasTag/flag。timeSlot/weekday/isPayday/orderDuration/varietyScore/totalSpent/avgOrderValue/reviewTendency/canceledOrders/lastRemark/bossStoryFlags/consecutiveBadOrders/phaseOfMoon/userIdHash 共 14 维被丢弃，DRAMA §三"凌晨/饭点 bossMood-10"失去数据支撑。（P1）
- **成就墙 / 社交 Feed / 图鉴隐藏线 / 零卡 / 客服喜剧**：GDD 已正确推迟至 M2+；但 DRAMA-ENGINE §八/§九 仍按完整版（Feed 4 Tab、勋章墙）设计，属超 MVP 旧稿，应标"仅思路、非构建 spec"。
- **4 级降级**：MVP 早期用内置 seed（无 brain）时，L1(seed)+L4(空) 足够，L2/L3 粒度可延后。
- **MVP 最小可玩**：7 页 + DramaState 4 阶段（bossMood/riderMorale/totalDelay 流动）+ 消费 SEED 的解析器 + localStorage 记忆（shopVisitCount + first/regular/vip + 1–2 flag）+ 首页 persona 标签（P6）+ 截图弹层（P2）。暂不做成就/Feed/图鉴/零卡。

## 三、三铁律 + P6 + 痛点滤网落地性
- **P1「因你不同」存核心缺口**：SEED 7 分支**无一消费 `remarkTag`/`addressTag`**，而 P4 与 fun hypothesis 核心是"因你的备注/选择看到 NPC 跌宕反应"。当前种子只能按金额/次数/flag 反应，"写了备注 vs 没写"无差异 → **P1/P4 未兑现**。须补 2–3 条 remarkTag/addressTag 触发分支（如 show_time/no_scold/weird）。（P0）
- **P6 前 3 秒爆点**：persona 标签 + 老板开场白清单具体，可落地 ✓；其"同店第 5 单≠第 1 单"broken 标准依赖记忆引擎 + remark 分支生效，与 P0-1/⑤ 联动。
- **P2 截图即胜利**：戏精弹层 + 手写体 + 无水印（§9.5 裁定）✓。
- **fun hypothesis 可证伪**：总纲行动项 C 定义"笑率 + 同店第 5 单差异"为发布硬闸门，GDD §11 列 broken 标准 → 可验证；但阈值仍 `[待测试]`，需 M1 后补基线。
- **痛点滤网**：无聊→想笑 / 没钱也想消费（虚拟 0 成本）/ 管不住手（图鉴，M2）映射合理 ✓。

## 四、设计风险清单
| 等级 | 项 |
|---|---|
| **P0** | ①mood/moodDelta 残留 ②speaker/actor 无名冲突 ③分支目录 6≠7 + dark_survivor/dark_dish ④flag() 语法 ⑤种子无分支消费 remark/address（核心乐趣缺口） |
| **P1** | persona 枚举、achievementUnlocked、neverExpire、35 维缺口、complaint 变量未入 schema、shopVisit/shopVisitCount 混用 |
| **P2** | GDD§9.4 缺可选 cooldown、DRAMA firstEvent/addressTag 过时、DRAMA§八/§九 超 MVP、分支 id 漂移 |

## 五、给主理人的结论与建议
**判定：CONCERNS**。骨架（铁律、P6、fun hypothesis、playtest 闸门）健全，可推进 M1，但**写解析器前须先修 P0 五项**（尤其 ⑤ 备注驱动缺口——否则 M1 跑通也验证不了核心乐趣）。建议：① 以 DATA-STRUCTURE v1 为唯一权威，强制 GDD §9.4 / SEED / DRAMA 三处对齐（moodDelta、actor、7 分支、flag() 单参、dark_dish）；② M1 种子至少补 2 条 remarkTag 分支；③ DRAMA-ENGINE-v2.md 降权为"引擎思路"，删 Feed/成就墙构建预期；④ 真机 playtest（笑率 + 第 5 单差异）作唯一发布闸门，先定基线阈值。
