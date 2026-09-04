# 胡闹外卖 · waimai 框架深化设计草案

> **文档版本**：2026-07-26 · **设计**：design-strategist（文策渊 / Vince Coyer）
> **任务**：DESIGN-WAIMAI-DEEPEN-001 · **优先级**：P0 · **范围**：深化 waimai 单款（playtest 排后）
> **评审强度**：full
> **关联权威文档**：`DATA-STRUCTURE-v1-2026-07-24.md`（字段唯一权威）、`DRAMA-ENGINE-V2.md`、`DRAMA-SEED-v1-2026-07-24.json`（当前 40 分支）、`GDD-v2-2026-07-24.md` §3 乐趣假说、`docs/studio/PROJECT-STATUS.md`

> **文档性质声明**：本草案为设计文档，不含实现代码、不改动 `DRAMA-SEED`、不执行 git 提交/推送。所有新增内容以追加配置形式落位，不影响既有 40 分支与线上运行。字段严格对齐 DATA-STRUCTURE-v1；发现的现有二义仅标注，不擅自改写 SEED。

---

## 0. 现状核对与二义标注（必读前置）

### 0.1 当前 40 分支结构（实读 `DRAMA-SEED-v1-2026-07-24.json`）

| 类别 | 分支 id | 触发要点 | 是否消费 shopVisitCount |
|---|---|---|---|
| 基线变体池（isFallback） | `default` / `default_b`~`h`（共 8） | `1=1` 恒真 | 否 |
| 店专属（每店 2 变体） | `shop_s01_angry`+`_b` … `shop_s05_lazy`+`_b`（共 10） | `shopId = s0X`，prob 0.6 | 否 |
| 同店进阶 | `regular_3rd`、`vip_5th`（共 2） | `shopVisitCount >= 3` / `>= 5` | **是（>=3 / >=5）** |
| 骑手专属（每骑手 2 变体） | `rider_r001_fast`+`_b` … `rider_r003_lost`+`_b`（共 6） | `riderId = r00X`，prob 0.5 | 否 |
| 通用 | `poor`/`poor_b`、`cheap_no_rider`、`bankrupt_love`、`overeat_cares`、`odd_eats`/`_b`/`_c`、`fate_reunion`、`blacklist_reunion`、`remark_more_spicy`、`remark_no_scold`、`boss_blacklist`、`address_weird`（共 14） | 金额/备注/地址/flags | 否 |

合计 8 + 10 + 2 + 6 + 14 = **40 分支**；成就 12 个（`regular`、`vip_fan` 由同店进阶分支设置）。

### 0.2 对 P0-D 前提的修正标注（重要）

任务前提：「当前 40 分支中没有任何分支消费 `shopVisitCount`」。实读 SEED 后，该前提与 SEED 实状不符：

- `regular_3rd`：`trigger.condition = "shopVisitCount >= 3"`（rarity rare，weight 7，prob 0.7），complete 阶段设置 `flag(regular_{shopId})`。
- `vip_5th`：`trigger.condition = "shopVisitCount >= 5"`（rarity epic，weight 8，prob 0.85），complete 阶段设置 `flag(vip_{shopId})`。

即 `shopVisitCount` 已被 2 个分支消费；`SEED-REVIEW-2026-07-25.md` 亦将二者列为「同店递进 ✅」可达分支。`PROJECT-STATUS.md` 第 55 行「P0-D（部分缓解）… `shopVisitCount` 仍未被任何分支消费」措辞与 SEED 实状冲突，属**状态滞后**，建议本设计落地后同步修订该措辞（不擅自改写）。

本草案不修改 SEED，仅基于实状重定义 P0-D 真缺口（§0.3）。

### 0.3 P0-D 真实缺口（重定义）

`shopVisitCount` 的消费现状为「阈值粗、覆盖疏、维度缺」：

1. **阈值粗**：仅 `>=3` 与 `>=5` 两档；第 4、6、7… 单及第 1、2 单均无专门反应。
2. **首→次缺口（最尖锐）**：第 1、2 单在同店语境下表现完全无差异——两者均落入 `default_*`（isFallback）或 `shop_s0X*`（按 `shopId` 命中）池，无任何「认出你」信号，直接破坏 GDD §3「我做什么都有不同反应」假说。
3. **风味缺**：现有 `vip_5th` 为「VIP 庆典」式（隐藏菜单/请客），任务建议的「吐槽老店 / 店员熟客梗」风味缺失。
4. **骑手维度零消费**：`riderHistory`（L3 §5.1）已存储每骑手次数，但无分支消费；3 个 `rider_r00X*` 仅按骑手人格反应，不认人。`DATA-STRUCTURE` §3.4 的 `lastRiderSame` 派生参数亦无消费者。
5. **孤儿 flag**：`regular_{shopId}` / `vip_{shopId}` 被设置但无任何分支读取，形成 setter-only 死链。

### 0.4 字段纪律声明

全部新增分支仅使用 DATA-STRUCTURE-v1 授权字段：

- 分支级：`id` / `name` / `weight` / `trigger.{condition, probability, probabilityScaling?, cooldownMin, maxPerUser}` / `rarity` / `achievements?`
- 链节点：`phase` / `actor` / `text` / `moodDelta?` / `delay?` / `id?` / `next?` / `nextWeights?` / `effect?`
- 条件串语法遵循 §3.7；禁用 §7 退役字段（`mood` / `speaker` / `icu` / `bomb` / `food_poison` / `firstEvent` 旧写法等）。

---

## 1. P0-D 同店差异感机制设计

### 1.1 驱动模型

`shopVisitCount` 经两条互补路径驱动差异感：

- **路径 A（分支阈值，本设计核心）**：新增分支的 `trigger.condition` 直接引用 `shopVisitCount`，在订单推演权重池中按阈值与概率竞争出线。与现有 `regular_3rd` / `vip_5th` 同一机制，纯配置扩展，不改引擎、不改 SEED。
- **路径 B（L1 boss 池分级，§2.3，可选并行）**：`food.boss[shopId][persona][first|regular|vip]` 由引擎按 `shopVisitCount` 选桶，属独立数据路径。M1 是否激活取决于 L1 `food.boss` 是否填三级，属待工程确认项；本草案 §2 P2 提及，核心 P0-D 走路径 A。

### 1.2 阈值解锁方案（三档 + 精确二访）

| 分支 id | 触发条件（condition） | 语义 | 与现有衔接 |
|---|---|---|---|
| `regular_2nd` | `shopVisitCount = 2` | 二访认人（"昨天不是来过？"） | 精确命中第 2 单，不与 `regular_3rd`(`>=3`) 重叠 |
| `regular_3rd` | （现有，保留）`shopVisitCount >= 3` | 老主顾第 3 单 | 设置 `regular_{shopId}` |
| `vip_roast` | `shopVisitCount >= 8 | flag(vip_{shopId})` | 吐槽老店 / 店员熟客梗 | 读取 `vip_{shopId}`（**修复孤儿 flag**）；与 `vip_5th` 风味互补 |
| `vip_5th` | （现有，保留）`shopVisitCount >= 5` | VIP 庆典 | 设置 `vip_{shopId}` |

> 阈值注记：`vip_roast` 取 `>= 8` 为与 DATA-STRUCTURE §2.3 的 vip 档（spec 写 `>= 10`，属 `[PLACEHOLDER]`）精神对齐的折中；若主理人倾向严格对齐 spec，可改 `>= 10`。最终阈值待 playtest 标定（§9 PLACEHOLDER 机制）。

### 1.3 同店进阶（呼应 `default_b/c/d` 变体池）

在现有 `shop_s0X*`（每店 2 变体）基础上，新增**每店人格同店专属进阶**分支 `shop_s0X_loyal`：

- 触发：`shopVisitCount >= 3 & shopId = s0X`（persona 风味化，与通用 `regular_3rd` 并存竞争）。
- 作用：把「店 / 骑手人格成主多样性源」的结论延伸到同店复购场景——复购时仍由该店人格发声，而非通用 `regular_3rd`。
- 命名规范见 §1.5。

### 1.4 骑手认人（复用 `r00X` 体系 + 新增派生参数）

现有 `rider_r00X*` 仅按骑手人格反应。新增 `rider_r00X_recog` 实现「同骑手重复派单触发专属台词」：

- **推荐方案（派生参数，小引擎触点）**：条件 `riderId = r001 & riderVisitCount >= 2`。其中 `riderVisitCount` 为新增**派生 HistoryParam**，定义方式与 `shopVisitCount`（= `UserStats.riderHistory[riderId]`）完全平行，由引擎在推演注入时从 L3 `riderHistory` 派生。**仅新增只读派生，不改动 SEED**；属小引擎触点，需与 engineering-lead（程基岩）对齐（经主理人中转）。
- **备选方案（零引擎改动，flag 法）**：新增首见分支 `rider_r00X_first` 设置 `seen_rider_{riderId}`，再令 `rider_r00X_recog` 条件 `riderId = r001 & flag(seen_rider_r001)`。完全复用现有 flag 机制与引擎，无新参数。代价：需为首次见面播种 flag（新增 3 个 setter 分支；不改动现有 3 个 rider 分支，故不触碰既有 SEED 条目）。

### 1.5 拟新增分支 id 命名规范

| 类别 | 命名模板 | 示例 | 触发变量 |
|---|---|---|---|
| 精确二访 | `regular_2nd` | `regular_2nd` | `shopVisitCount = 2` |
| 老店吐槽 | `vip_roast` | `vip_roast` | `shopVisitCount >= 8 | flag(vip_{shopId})` |
| 每店同店进阶 | `shop_{id}_loyal` | `shop_s01_loyal` … `shop_s05_loyal` | `shopId = s0X & shopVisitCount >= 3` |
| 每店老店吐槽 | `shop_{id}_roast` | `shop_s01_roast` … | `shopId = s0X & shopVisitCount >= 8` |
| 骑手认人 | `rider_{id}_recog` | `rider_r001_recog` … | `riderId = r00X & riderVisitCount >= 2` |
| 骑手首见（setter，仅 flag 法） | `rider_{id}_first` | `rider_r001_first` … | `riderId = r00X & !flag(seen_rider_{riderId})` |

### 1.6 与现有 `nextWeights` 的联动写法

现有 `nextWeights` 用法（链内分叉，权重池随机选 1）：

- `bankrupt_love`·complete：`next:["bk_bro","bk_crush","bk_wed"]`，`nextWeights:[6,3,1]`
- `overeat_cares`·complete：`next:["oe_ok","oe_care"]`，`nextWeights:[6,4]`

本设计对**同店进阶 / 老店吐槽**分支复用同构：在 complete 阶段以 `next` + `nextWeights` 做风味分叉，避免单一台词重复。示例骨架（仅示结构，非最终文案，字段全部合规）：

```json
{
  "id": "vip_roast",
  "name": "老店熟客 · 吐槽老梗",
  "weight": 8,
  "trigger": { "condition": "shopVisitCount >= 8 | flag(vip_{shopId})", "probability": 0.85, "cooldownMin": 0, "maxPerUser": 0 },
  "rarity": "epic",
  "achievements": ["old_shop_roast"],
  "chain": [
    { "phase": "accept",  "actor": "boss", "text": "你又来了——这店招牌都被你坐包浆了", "moodDelta": 10 },
    { "phase": "cook",    "actor": "boss", "text": "老板按老规矩给你做，闭眼都能来" },
    { "phase": "deliver", "actor": "rider", "text": "骑手：这店认你，出餐快" },
    { "phase": "complete", "actor": "boss", "text": "老规矩，这次换我吐槽你",
      "next": ["vr_a","vr_b","vr_c"], "nextWeights": [5,3,2],
      "effect": { "flags": ["vip_{shopId}"] } },
    { "phase": "complete", "actor": "boss", "id": "vr_a", "text": "（吐槽梗 A 占位）" },
    { "phase": "complete", "actor": "boss", "id": "vr_b", "text": "（吐槽梗 B 占位）" },
    { "phase": "complete", "actor": "boss", "id": "vr_c", "text": "（吐槽梗 C 占位）" }
  ]
}
```

**衔接点**：

- `regular_3rd` / `vip_5th` 已设置 `regular_{shopId}` / `vip_{shopId}`，新增 `vip_roast` 以 `flag(vip_{shopId})` 读取 → **修复孤儿 flag 死链**（setter→reader 闭环）。
- 新分支均为**追加**进 `branches` 数组，现有 40 条不改动；`default*` isFallback 仍保证每单有反应，新分支仅在高 `shopVisitCount` 时进入权重池竞争。
- `regular_2nd` 用精确 `= 2`，与 `regular_3rd` 的 `>= 3` 不重叠，避免双触发抢池。

---

## 2. 扩展计划

### 2.1 分类与优先级

| 优先级 | 类别 | 新增量 | 内容 | 对多样性来源的贡献 |
|---|---|---|---|---|
| **P0 必做** | 同店差异核心 | 7 分支 | `regular_2nd`×1、`shop_s0X_loyal`×5、`vip_roast`×1 | 填 1→2 缺口 + 店人格延伸到复购 + 老店吐槽风味 |
| P0 必做 | 成就 | 2 | `local_regular`（触发任一 `shop_s0X_loyal`）、`old_shop_roast`（`vip_roast`） | 图鉴补全，集齐驱动回访 |
| **P1 建议** | 骑手认人 | 3 分支 | `rider_r001/002/003_recog`（若取 flag 法另 +3 setter） | 填补骑手维度零消费 |
| P1 建议 | 每店老店吐槽 | 5 分支 | `shop_s0X_roast`×5 | 店人格深度，呼应「店人格主多样源」 |
| P1 建议 | 基线抗重复 | 3 分支 | `default_i` / `default_j` / `default_k`（isFallback） | 直接抗疲劳（SEED-REVIEW P2 已提） |
| P1 建议 | 成就 | 1 | `rider_buddy`（触发任一 `rider_r00X_recog`） | — |
| **P2 锦上添花** | 新店铺 | +3 分支 | `shop_s06`（新人格）+ `shop_s06_loyal` + `shop_s06_roast` | 新增一维人格多样性源 |
| P2 锦上添花 | 新骑手 | +2 分支 | `rider_r004`（新人格）+ `rider_r004_recog` | 骑手池扩容 |
| P2 锦上添花 | 真爱菜品 | 2 分支 | `dish_fav`（`dishRepeatCount >= 3`）、`dish_true_love`（`>= 10`） | 消费 DATA-STRUCTURE §3.4 `dishRepeatCount`（现亦孤儿） |
| P2 锦上添花 | 好感维度 | 1 分支 | `boss_fan`（`affinity[shopId] >= 200`，设置 `boss_fan_{shopId}`） | 消费 §5.2 合规 flag 模板 |
| P2 锦上添花 | boss 池分级 | — | 激活 §2.3 `first/regular/vip` 桶（需 L1 `food.boss` 填三级） | 平行路径 B |

### 2.2 若加店铺 / 骑手的人格定位（呼应 P2）

- **新店 `s06`「内卷卷王·996 便当」**（人格 `hustle`）：老板边敲键盘边出餐，台词围绕「这单我抽空做的，KPI 没崩」。贡献：在现有 5 人格（暴躁 / 哲学 / 佛系 / 怪味 / 懒）之外补「社畜共鸣」维度，强化「店人格成主多样源」。
- **新骑手 `r004`「社恐话少·默默送达」**（人格 `shy`）：接单只发一个表情，送达留纸条。贡献：在 闪电 / 慢工 / 路痴 之外补「安静反差」维度。
- 每新实体需配套：1 专属分支 + 1 loyal/recog 进阶 +（店）1 roast，并扩展 `branchesSeen` / `ridersSeen` 图鉴与「骑手全图鉴」成就（现 `all_riders` 写「遇过全部 5 个骑手」，加 `r004` 后需更新计数）。

---

## 3. 一致性与风险

### 3.1 不破坏现有 40 分支结构

- 所有新增分支以**追加**方式进入 `branches[]`，不修改、不删除现有 40 条。
- 现有 `isFallback`（`default` / `default_b~h`）保证降级覆盖，新分支零概率命中时仍走默认，不会致引擎空转（DATA-STRUCTURE §8.1 / §8.5）。
- 字段严格限 DATA-STRUCTURE-v1 授权集，禁用退役字段（§7）。

### 3.2 与现有 SEED 的衔接点

| 新分支 | 插入 / 竞争位置 | nextWeights 指回 |
|---|---|---|
| `regular_2nd` | 与 `regular_3rd` / `vip_5th` / `shop_s0X*` / `default*` 同池，靠 `= 2` 精确隔离 | 线性链，无分叉 |
| `shop_sX_loyal` | 与 `shop_s0X` / `shop_s0X_b` / `regular_3rd` 同池（均 `>=3` 命中） | complete 可 `next`+`nextWeights` 分叉 |
| `vip_roast` | 与 `vip_5th` / `shop_s0X*` 同池（`>=8` 或 flag） | 读取 `vip_{shopId}`，complete `next`+`nextWeights` 三选一 |
| `rider_rX_recog` | 与 `rider_r00X` / `rider_r00X_b` 同池 | 线性或分叉 |

### 3.3 已标注的现有二义（不擅自改写）

1. **P0-D 前提滞后**：任务 / PROJECT-STATUS 称「`shopVisitCount` 未被消费」，实状已有 `regular_3rd` / `vip_5th` 消费。建议落地后修订 PROJECT-STATUS 第 55 行措辞。
2. **vip 阈值矛盾**：DATA-STRUCTURE §2.3 写 vip 档 `shopVisitCount >= 10`，SEED `vip_5th` 用 `>= 5`。本草案 `vip_roast` 取 `>= 8` 折中，最终阈值待 playtest 标定（§9 PLACEHOLDER）。建议统一 spec 与 SEED 的 vip 阈值定义，避免评审歧义。
3. **孤儿 flag**：`regular_{shopId}` / `vip_{shopId}` 仅设不读。本草案以 `vip_roast` 读取 `vip_{shopId}` 修复；`regular_{shopId}` 由 §2 P0 的 `shop_s0X_loyal` 亦可读取，彻底闭环。
4. **`dishRepeatCount` 亦孤儿**：§3.4 定义但无分支消费，留 P2（§2.2）。

### 3.4 实施风险

| 风险 | 说明 | 缓解 |
|---|---|---|
| 分支爆炸 | 高 `shopVisitCount` 时同池分支骤增（`shop_s0X` + `_b` + `loyal` + `roast` + `regular_3rd` + `vip*` + `default*`），单序多分支命中概率稀释 | 控制新增分支 `probability`（loyal/roast 取 0.8~0.85），用 `flag` 守卫减少常驻竞争者；依赖权重池随机保多样 |
| 权重失衡 | 新分支权重过高会饿死 `shop_s0X` 核心人格（玩家不复见该店招牌梗）；过低则永不露脸 | 权重取 6~8（贴近现有 shop 池 6 / regular 7 / vip 8）；playtest 标定（§9） |
| 阈值重叠 | `regular_2nd(=2)` 与 `regular_3rd(>=3)` 已隔离；`vip_roast(>=8)` 与 `vip_5th(>=5)` 在 `>=8` 同池竞争属预期（风味互补） | 以 `flag(vip_{shopId})` 让 `vip_roast` 在 VIP 状态后必现一次，避免被 shop 池压制（呼应 SEED-REVIEW P2「店间压制同店递进」） |
| 引擎暴露面 | `riderVisitCount` 非当前条件上下文变量 | 推荐方案需引擎从 L3 `riderHistory` 派生（只读，零 SEED 改动）；备选 flag 法零引擎改动 |
| 红线 | 新文案须过 `forbidden_check` | 文案落地时走 CI 闸门（`red_light_count = 0` 才收） |
| 测试覆盖缺口 | 现有 `playtest-sim.ts`（1500 会话）、`dramaEngine.coverage.test.ts`（2000 会话守死分支）需纳入新分支 | 扩展 sim 覆盖新阈值（`=2`、`>=8`、 `riderVisitCount>=2`）；coverage 测新分支可达且非死链；新增断言：第 2 单必现 `regular_2nd`、同骑手第 2 单必现 `rider_rX_recog`（若采用） |

---

## 4. 给用户的决策选项

| 档 | 范围 | 新增分支 | 新增成就 | 大致代价 | 说明 |
|---|---|---|---|---|---|
| **A 最小** | 仅 P0-D 同店差异感（路径 A，零引擎改动） | **7**：`regular_2nd`×1 + `shop_s0X_loyal`×5 + `vip_roast`×1 | **2**：`local_regular`、`old_shop_roast` | 小：纯 branches 追加 + 概率标定；`shopVisitCount` 已暴露，无引擎触点 | 最快闭合 P0-D 同店维度；骑手维度仍空 |
| **B 标准（推荐）** | P0-D + 骑手认人 + 扩 ~20 分支 | **约 18–20**：A 的 7 + `rider_r00X_recog`×3 + `shop_s0X_roast`×5 + `default_i/j/k`×3 + 可选 2 基线微调 | **3**：A 的 2 + `rider_buddy` | 中：含 `riderVisitCount` 引擎小暴露（或 flag 法零改动）+ 概率平衡标定 + playtest-sim 扩展 | 完整闭合 P0-D（同店 + 骑手双维度），店人格深度延伸，风险可控 |
| **C 全量** | B + 新店铺 + 骑手人格深化 + 成就体系补全 | **约 27–29**：B 的 ~20 + `shop_s06` 系 3 + `rider_r004` 系 2 + `dish_fav`/`dish_true_love` 2 + `boss_fan` 1 | **约 7**：B 的 3 + `new_shop_fan`/`rider_master`/`dish_lover`/`all_riders_v2` 等 4 | 大：新实体人格设计 + `branchesSeen`/`ridersSeen` 图鉴扩展 + 全场景回归（与「playtest 排后」略有张力） | 框架最完整，但新增实体放大测试面，建议作可选项 |

**推荐档：B 标准**。理由：

- 完整闭合 P0-D 两大真实缺口（同店差异 + 骑手认人），直接修复孤儿 flag，满足 GDD §3 乐趣假说「我做什么都有不同反应」。
- 复用现有 5 店 / 3 骑手框架，不引入新实体，符合「深化单款 / playtest 排后」——不放大测试面。
- 与「店 / 骑手人格成主多样性源」现状结论一致，把人格差异延伸到复购与认人场景。

C 档的新店铺 / 骑手属「框架扩展」而非「框架深化」，且放大回归面，与 playtest 排后的战略指令略冲突，建议作为可选 stretch，由主理人呈用户决定。

---

## 附录：待主理人 / 用户拍板的开放决策

1. `vip_roast` 阈值取 `>= 8`（折中）还是对齐 spec 的 `>= 10`？
2. 骑手认人取「派生 `riderVisitCount`（小引擎触点）」还是「flag 法（零引擎改动，+3 setter 分支）」？
3. 是否批准 C 档新店铺 `s06` + 新骑手 `r004`（框架扩展 vs 深化）？
4. 范围档定 **A** / **B** / **C** 哪一档？

---

_设计草案 · design-strategist（文策渊）· 2026-07-26 · 字段对齐 DATA-STRUCTURE-v1 · 不含代码 / 不改 SEED / 不 git_
