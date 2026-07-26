# 🛒 胡闹导购 · Phase 2 跨 GDD 一致性评审（REVIEW）

> **版本**：v1.0 · 2026-07-26 · design-strategist
> **评审强度**：full · 门控 G-1~G-8（对齐 `00-CONCEPT.md` §0.3）
> **评审对象**：`00-SYSTEMS-INDEX.md` + `01`~`08` 八系统 GDD
> **上游权威**：`00-CONCEPT.md` §2（P1–P6）§6.4（否决）§9（契约/EVOL）· `ART-BIBLE.md` §2.5（角色色）§2.2（宿主令牌）· `DATA-STRUCTURE-v1` · `BRAND.md`

---

## 1. 支柱一致性（G-1 · P1–P6 不漂移）

| 支柱 | 落点系统 | 评审结论 |
|------|----------|----------|
| **P1 因你不同**（记忆） | 04 记忆分级 | ✅ `guideVisit` 派生源 = 同导购博弈次数；首/回头客/真爱粉三桶；否决#1 机检记忆失效 |
| **P2 截图即胜利** | 06 戏精弹层 / 08 截图分享 | ✅ 水印只进页脚；三种卡独立可分享无水印；双胜利绿框 |
| **P3 零负担** | 01/03/04 | ✅ affinity 仅内存不落盘为进度；reset 入口藏深；图鉴非 gacha 计数 |
| **P4 戏精由选择触发** | 02 状态机 / 06 | ✅ 4 选项位置随机防肌肉记忆；弹层内容来自状态机产出非贴图 |
| **P5 单机回来理由** | 05 图鉴 | ✅ 三桶收集 + 成就 `Rarity`；非计数成就 |
| **P6 前 3 秒爆点** | 01 商品舞台 | ✅ 进商品页/点结算 3 秒内导购闪现首爆点（硬约束） |

**结论**：P1–P6 在 01–08 中均落点，无漂移。⚠️ P1 依赖 `EVOL-3` 派生源标注落地；若 waimai `memoryTier` 语义未注明「mart=同导购博弈次数」，P1 派生源可能被误读为 `shopVisitCount`——见 §4 EVOL-3。

## 2. 双重胜利自洽（G-4）

- 破防态（`affinity >= 100`）+ 反消费胜利态（`affinity <= 0`）在 **02/03/06/08** 四处均定义为 success 语义，**归零态非「输」**。
- 03 §3 / 06 §4 / 08 §4 均禁止红叉/失败渲染（对齐 ART-BIBLE §2.4 / §5.4 / §9.1 #5）。
- **结论**：双胜利自洽，G-4 通过。

## 3. 契约复用正确性（G-2 · 零冲突）

| 复用项 | 引用系统 | 校验 |
|--------|----------|------|
| 信封 6 字段 / `fallback.mart` | 03/07 | ✅ 零改写，mart 同信封消费 |
| `actor`/`moodDelta`/`next`+`nextWeights`/`id` | 02/03 | ✅ 字段命名权威遵循（L1-T4） |
| `DramaState` **不复用** | 02 | ✅ mart 自建 `MartRoundState` |
| `forbidden_check` | 07 | ✅ 直接复用，`red_light_count>0` 整包拒绝 |
| `Rarity` 枚举 | 03/05 | ✅ 图鉴/成就复用 |
| `chain[]` 内联链表 | 02（未来事件） | ✅ 事件链沿用，不自创间接寻址 |
| `ui_meta` 水印 | 06/08 | ✅ 只进页脚 |
| 4 级降级 | 07 | ✅ L4 降级诚实告知 |
| `memoryTier` 桶 | 04 | ✅ first/regular/vip 复用 |
| 键前缀 `whoknow:mart:` | 03/04/05 | ✅ 与 `whoknow:waimai:` 隔离 |

**结论**：复用项零改写，演进项（EVOL）明确标注且不破共享解析器，G-2 通过。

## 4. EVOL 演进项追踪

| 编号 | 类型 | 内容 | 引用系统 | 状态 |
|------|------|------|----------|------|
| EVOL-1 | 硬演进 | `DramaEvent.actor` 增 `guide` | 02（v2 事件） | 🟡 待 waimai 主责人落地（见 `docs/contract/EVOL-1-guide-enum-request.md`） |
| EVOL-2 | 软演进 | `L3.affinity` 语义注释（mart=破防度 0~100） | 03 | 🟡 待 DATA-STRUCTURE 注释 |
| EVOL-3 | 软演进 | `memoryTier` 派生源标注（mart=同导购博弈次数） | 04 | 🟡 待 DATA-STRUCTURE 注释 |
| EVOL-4 | 协商 | archetype 自键承载（不扩 waimai persona 枚举） | 全系统 | 🟡 待美术/契约对齐 |
| EVOL-5 | 填空 | 填 `mart`/`fallback.mart` 信封（L1.mart） | 01/03 | 🟡 待 M1-a |
| **EVOL-6（NEW）** | 软演进 | `DramaEvent.moodDelta` 语义目标标注（mart→affinity，waimai→bossMood） | 02/03 | 🟡 本次设计新发现，待 DATA-STRUCTURE 注释 |

### EVOL-6 说明（本次设计新发现）

- **问题**：waimai `DramaEvent.moodDelta`（DATA-STRUCTURE §3.3）语义目标是 `bossMood`；mart 复用同名 `moodDelta` 作为破防度 delta，目标实为 `affinity`（0~100），与 `bossMood`(−100~100) 完全不同。
- **风险**：与 EVOL-2（`affinity` 语义双解）同类——审阅/解析易混淆「这个 moodDelta 改的是哪个值」。
- **处置**：建议 DATA-STRUCTURE 加 product-specific 注释：`mart` 上下文 `moodDelta` → `affinity`（破防度）；`waimai` → `bossMood`。**无 schema 变更**（字段名不变），仅注释层，与 EVOL-2 同源。
- **MVP 影响**：MVP 不产 DramaEvent（纯前端矩阵），故 MVP 无阻断；v2 接 brain 前须落地。

## 5. C2 规范交叉引用表（archetype id ↔ 中文型 ↔ `--role-*` token ↔ emoji ↔ 导购名）

> **本表为全系统唯一规范锚**，01–08 所有系统/GDD/UX/art 统一引用此标识符，杜绝 00-CONCEPT §9.2 英文 id 与 ART-BIBLE §2.5/§4.2 中文型/角色色 的命名分裂。

### 5.1 五导购（guides）

| `guideId`（L1.mart.guides[].id） | `archetype`（规范 id，L1.mart.guides[].archetype） | 中文型 | `--role-*` token | 角色色 HEX | Emoji | 导购名（ART-BIBLE §4.2） |
|---|---|---|---|---|---|---|
| `guide_wanger_ma` | `poison_tongue` | 毒舌型 | `--role-angry` | #FF4B10 | 🔥 | 王二麻 |
| `guide_li_suanpan` | `rational` | 理性型 | `--role-gentle` | #2BB14A | 🤓 | 李算盘 |
| `guide_zhao_tuotuo` | `lazy` | 散漫型 | `--role-lazy` | #3A7BFF | 😴 | 赵拖拖 |
| `guide_qian_manman` | `philosopher` | 鸡汤型 | `--role-philo` | #1FB6A6 | 🧘 | 钱满满 |
| `guide_zhou_anan` | `dark` | 腹黑型 | `--role-weird` | #8B5CF6 | 😈 | 周暗暗 |

### 5.2 四招式（moves · 位置随机，固定语义）

| `moveId`（L1.mart.moves[].id） | `label` | 招式 archetype（中文） | icon | delta 语义 |
|---|---|---|---|---|
| `move_firm` | 我需要！ | 坚定 | 💪 | 平手/弱点/踩雷（依矩阵） |
| `move_compare` | 我比过价了 | 比价 | 📊 | 同上 |
| `move_pity` | 求求了 | 装可怜 | 🥺 | 同上 |
| `move_poison` | 爱卖不卖 | 以毒攻毒 | 🤬 | 同上 |

> 注：`move_compare` 在 ART-BIBLE §5.5 标「理性证据」，在 L1 draft §2 标「比价」——语义一致，本表取「比价」为规范词（与毒舌型 hiddenWeakness「比价」对齐）。

## 6. 新发现的数据一致性漂移（待主理人裁定）

| # | 漂移 | 出处 | 规范结论 | 处置 |
|---|------|------|----------|------|
| D1 | L1 draft §1 `archetype` 用中文「毒舌型」 | `mart-L1-datastructure-draft.md` §1 | 规范 id = `poison_tongue` 等（英文 snake_case，见 §5.1） | 🟡 修正 L1 draft 用规范 id |
| D2 | L1 draft §1 矩阵 **2 弱点 + 2 踩雷**（无 neutral） | 同上 | 规范矩阵 = **1 弱点(+40) + 1 踩雷(−10) + 2 平手(+10)**（满足 §6.4 否决#2 不全 +40/全 −10） | 🟡 确认矩阵模式，02 §7 已采用规范模式 |
| D3 | `moodDelta` 目标语义未标注 mart/waimai 差异 | DATA-STRUCTURE（共享） | 见 EVOL-6 | 🟡 注释层补充 |

**D2 详解**：若每导购 2 弱点 + 2 踩雷，则每轮 4 选项恰为 2×+40 + 2×−10，**无平手(+10) 选项**，玩家无「安全中立」打法，且弱化策略深度。规范 1+1+2 模式保留 2 个中性选项，既满足 §6.4「不全同值」否决，又给玩家「试探/保底」空间。建议以规范模式为准，L1 draft 的 2+2 视为占位待标定。

## 7. 红线 0 漏出（G-3）· forbidden_check 接线

- `forbidden_check` 在 **07** 单独立系统承载，横切 01–06/08 全部文案与资产。
- 接线点：`forbidden_check.red_light_count > 0` → 整包拒绝 → L4 降级（api-spec §降级 L4），在 07 §3/§7 明确。
- 01（价格/店名红灯）、06（对话文案红灯）、08（卡文案红灯）均声明过 `forbidden_check`。
- **结论**：G-3 接线完整，红灯 0 容忍贯穿全系统。

## 8. 否决标准机检（G-5 · §6.4）

| 否决项 | 机检落点 | 结论 |
|--------|----------|------|
| #1 记忆失效 | 04 验收 + §5 失败模式 | ✅ 可机检（同导购第≥5 次差异） |
| #2 矩阵崩坏 | 02 §7（不全 +40/全 −10）+ §6.4 | ✅ 可机检（每导购矩阵扫描） |
| #3 配置污染 | 07 §5（红灯整包拒绝） | ✅ 可机检（red_light_count>0） |

## 9. 总结

- 支柱 P1–P6 不漂移 ✅（G-1）
- 双重胜利自洽 ✅（G-4）
- 契约复用零冲突 ✅（G-2）
- EVOL-1~5 追踪 + **EVOL-6 NEW** ✅（§4）
- forbidden_check 接线完整 ✅（G-3）
- 否决标准可机检 ✅（G-5）
- **待主理人/跨机协调**：EVOL-1（waimai 落地）、D1/D2（L1 draft 修正）、EVOL-2/3/6（DATA-STRUCTURE 注释）

---

_胡闹导购 · Phase 2 跨 GDD 一致性评审 v1.0 · design-strategist · 2026-07-26_
