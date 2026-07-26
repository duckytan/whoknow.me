# 🛒 胡闹导购 · 内容备料（Phase 5 Epic A · 填值稿）

> **文档类型**：Phase 5 Epic A · 内容填值（设计文档，不改代码/架构）
> **版本**：v1.1 · 2026-07-26
> **主责角色**：design-strategist（文策渊）
> **评审强度**：full
> **状态**：🟢 内容初稿 · 全部 `[待测试]` 已替换为可 playtest 真实内容；手感数值标「建议种子 · playtest 标定」，待主理人拍板 + `mart-playtest-plan.md` 标定
> **上游权威**：`00-CONCEPT.md` §3/§4/§9 · `mart-L1-datastructure-draft.md` · `02-selection-statemachine.md` · `03-break-defense-engine.md` · `04-memory-tier.md` · `REVIEW.md` §5（C2 规范表）· `mart-禁忌词终审.md`
> **下游**：`06-drama-dialog-ui.md` / `08-screenshot-share.md`（渲染）· eng-lead（L1.mart 填值）· art-director（立绘/角色色映射）

---

## 0. 范围与纪律

本备料为 **MVP 纯前端内容骨架**（不接 brain，战略约束 #1）。Phase 5 Epic A 已将全部 `[待测试]` 占位替换为可 playtest 真实内容；手感类数值（破防度初始值 / `round_cap` / 保底轮次 / vip 阈值）以「建议种子 · playtest 标定」标注，不视为硬编码定稿。

- **标识符唯一源**：导购 id / 招式 id / `archetype` / 角色色 token / emoji 严格引用 `REVIEW.md` §5 C2 规范表，禁止另起中文型名（D1 漂移已裁定修正）。
- **矩阵模式**：严格 **1 弱点(+40) + 1 踩雷(−10) + 2 平手(+10)**（REVIEW §6 D2 / `02` §7）。本填值稿以规范 1+1+2 锁死 5 行。
- **记忆分级桶**：`first`(=1) / `regular`(≥3) / `vip`(≥10 或 affinity≥阈值)，台词按桶切换（P1 因你不同，`04`）。
- **动机 B+C 双主打**：反骨动机最稳为 B（打工人整资本）/ C（真为玩家好），绝不「系统骗玩家买」（reactance backfire 红线，`00-CONCEPT.md` §5.1）。
- **禁忌词**：全物料过 `forbidden_check`（L1-T1）；价格禁真实数字（红线 #2）；店名/品牌/人名/地名全化名（某宝/某团/某明星/京城）；「智商税」为劝退话术保留（吐槽商品非攻击用户）。
- **表述纪律（L2-C9）**：设计师正文客观；导购台词为引用式角色对白，豁免读者相对代词。

---

## 1. 五导购 Persona 台词池（L1.mart.guides · lineBuckets）

> 每个 persona 含：`archetype`（规范 id）/ 中文型 / `--role-*` token / 角色色 HEX / emoji / 导购名（均来自 `REVIEW.md` §5.1）+ `motive`（B/C）+ `lineBuckets{first,regular,vip}`。
> 下列为 **可 playtest 初稿内容**（非 `[待测试]`）；仍须过 `forbidden_check` 红灯（L1-T1）并经 playtest G2/G3 验证。王二麻保留 `mart-L1-datastructure-draft.md` §1 种子并扩充至每桶 4 条。

### 1.1 毒舌型 · 王二麻（`guide_wanger_ma`）

| 字段 | 值 |
|---|---|
| `archetype` | `poison_tongue` |
| 中文型 / token / 色 / emoji / 名 | 毒舌型 / `--role-angry` / #FF4B10 / 🔥 / 王二麻 |
| `motive` | C（真为玩家好，劝别当冤大头）+ 暗藏 B |

**`lineBuckets`（保留 seed + 扩充，每桶 4 条）**

- **first（首触·毒舌劝退向）**
  - `"家人们谁懂啊，这玩意儿也就你能看上。"`
  - `"劝你善良，这价格我都替你疼。"`
  - `"别急下单，我先泼盆冷水。"`
  - `"就你这手速还抢购呢，慢点我还能少卖一单。"`
- **regular（回头客·软化带刺）**
  - `"又来了？上次劝你的话当耳旁风了？"`
  - `"老熟人了，我还是那句——别交智商税。"`
  - `"你这购物车，我都能背出来了。"`
  - `"又来，你这复购率比我 KPI 还稳。"`
- **vip（真爱粉·调侃交底）**
  - `"行吧行吧，给句实话——真别买。"`
  - `"咱俩这交情，我替你捂紧钱包。"`
  - `"再买我都要替你急眼了（开玩笑）。"`
  - `"铁粉认证了，这单我替你把取消键先按了。"`

### 1.2 理性型 · 李算盘（`guide_li_suanpan`）

| 字段 | 值 |
|---|---|
| `archetype` | `rational` |
| 中文型 / token / 色 / emoji / 名 | 理性型 / `--role-gentle` / #2BB14A / 🤓 / 李算盘 |
| `motive` | C（理性帮玩家算账别买） |

**`lineBuckets`（每桶 3 条）**

- **first（首触·算账劝退）**
  - `"咱算笔账：这功能你一年用不上两次。"`
  - `"冲动是魔鬼，先放购物车冷静。"`
  - `"这钱留着不香吗？"`
- **regular（回头客·复盘提醒）**
  - `"第几次了？你的坑我已经数不清。"`
  - `"理性提醒：上次那单你还没用呢。"`
  - `"别让购物车替你做决定。"`
- **vip（真爱粉·直给真相）**
  - `"自己人，我不绕弯子——这单省下的够吃顿好的。"`
  - `"咱这种交情，直接告诉你：别下单。"`
  - `"钱在你兜里最安全。"`

### 1.3 散漫型 · 赵拖拖（`guide_zhao_tuotuo`）

| 字段 | 值 |
|---|---|
| `archetype` | `lazy` |
| 中文型 / token / 色 / emoji / 名 | 散漫型 / `--role-lazy` / #3A7BFF / 😴 / 赵拖拖 |
| `motive` | B（懒得卖，打工人摆烂整资本） |

**`lineBuckets`（每桶 3 条）**

- **first（首触·懒劝退）**
  - `"好累，能不能别买让我早点下班。"`
  - `"我都躺平了你还来？"`
  - `"下单要填单子，好麻烦，要不别买了。"`
- **regular（回头客·瘫着仍劝）**
  - `"又来？我瘫着呢，你自便吧……才怪。"`
  - `"看你这么勤快，我更想睡了。"`
  - `"别买，我谢谢你，能多躺会儿。"`
- **vip（真爱粉·喷嚏真相）**
  - `"老主顾了，我打个喷嚏的功夫给你真相——别下单。"`
  - `"咱俩谁跟谁，我真不坑你。"`
  - `"这单我替你拒了啊。"`

### 1.4 鸡汤型 · 钱满满（`guide_qian_manman`）

| 字段 | 值 |
|---|---|
| `archetype` | `philosopher` |
| 中文型 / token / 色 / emoji / 名 | 鸡汤型 / `--role-philo` / #1FB6A6 / 🧘 / 钱满满 |
| `motive` | C（鸡汤式劝退，人生哲理别冲动） |

**`lineBuckets`（每桶 3 条）**

- **first（首触·哲理劝退）**
  - `"人生苦短，何必为一个用不上的东西掏空钱包。"`
  - `"买它不如买清静。"`
  - `"深呼吸，这股冲动会过去的。"`
- **regular（回头客·点醒）**
  - `"你这月第几次冲动了？breathe~"`
  - `"上次的教训这么快忘了？"`
  - `"购物车是欲望的镜子，照照。"`
- **vip（真爱粉·交情点醒）**
  - `"咱们这种交情，我得点醒你——有些东西不买，心里才真清净。"` // [PROVISIONAL-C1] orchestrator pick, pending design-strategist bless
  - `"真朋友不让你乱花钱。"`
  - `"省下的，都是给未来的你。"`

### 1.5 腹黑型 · 周暗暗（`guide_zhou_anan`）

| 字段 | 值 |
|---|---|
| `archetype` | `dark` |
| 中文型 / token / 色 / emoji / 名 | 腹黑型 / `--role-weird` / #8B5CF6 / 😈 / 周暗暗 |
| `motive` | B（腹黑整老板，暗爽玩家占便宜） |

**`lineBuckets`（每桶 3 条）**

- **first（首触·腹黑劝退）**
  - `"买了这东西，老板笑得比你还开心，你确定？"`
  - `"别急，我看戏呢。"`
  - `"这价的猫腻，我比你清楚。"`
- **regular（回头客·假装没看见）**
  - `"又来送钱了？行，我假装没看见。"`
  - `"你这毅力，用在别处多好。"`
  - `"别买，我懒得替你心疼。"`
- **vip（真爱粉·偷告真相）**
  - `"自己人，偷偷告诉你，这玩意儿老板自己都不用。"`
  - `"咱俩一伙的，别让上家赚走。"`
  - `"这单，我站你这边。"`

> **台词自检（禁忌词）**：上列台词无真实品牌 / 真实价格数字 / 真人名 / 真实地名；「智商税」「老板」「上家」为劝退话术或化名指代，符合 `mart-禁忌词终审.md`；「自己人 / 一伙的」为 NPC 对白中的共谋式 solidarity 语气（B/C 动机），非读者相对代词。填值稿仍须过 `forbidden_check` 红灯（L1-T1）与 playtest G2/G3 验证。

---

## 2. 克制矩阵（20 格 · 1+1+2 · 种子锁死）

> 结构：`matrix[archetype][moveId] = delta`，5 型 × 4 招 = 20 格。
> **硬约束（REVIEW §6 D2）**：每行**恰好 1 格 +40（隐藏弱点）/ 1 格 −10（踩雷）/ 2 格 +10（平手）**。禁止 2+2（无中性）模式。
> 列顺序固定（招式语义见 `REVIEW.md` §5.2）：`move_firm`(💪 坚定) / `move_compare`(📊 比价) / `move_pity`(🥺 装可怜) / `move_poison`(🤬 以毒攻毒)。
> delta 量级（+40/−10/+10）为设计常量（来自 `00-CONCEPT.md` §3.1），**非手感调参**；每 archetype 的弱点/踩雷招分配为**建议种子 · playtest 标定**（H5 分布均衡 / H2 笑率复核）。

### 2.1 矩阵值表（5 行全锁 1+1+2）

| `archetype` | 💪 move_firm | 📊 move_compare | 🥺 move_pity | 🤬 move_poison | 弱点招(+40) | 踩雷招(−10) |
|---|---|---|---|---|---|---|
| `poison_tongue` | +10 | **+40** | **−10** | +10 | compare（比价） | pity（装可怜） |
| `rational` | +10 | **+40** | +10 | **−10** | compare（比价） | poison（以毒攻毒） |
| `lazy` | **−10** | +10 | **+40** | +10 | pity（装可怜） | firm（我需要） |
| `philosopher` | +10 | **−10** | +10 | **+40** | poison（以毒攻毒） | compare（比价） |
| `dark` | **+40** | +10 | **−10** | +10 | firm（我需要） | pity（装可怜） |

> `poison_tongue` 行弱点/踩雷来自 `mart-L1-datastructure-draft.md` §1（`hiddenWeakness:["比价"]` → compare +40；`thunderMine:["装可怜"]` → pity −10），作 MVP 首个可玩 persona 种子。
> 其余 4 行 delta 为本次 Epic A 填值种子，每行机械校验满足 1+1+2（§6.4 否决#2）。

### 2.2 各导购 hiddenWeakness / thunderMine（与 §2.1 一致）

| `guideId` | `archetype` | `hiddenWeakness`（+40 招） | `thunderMine`（−10 招） | 叙事自洽依据 |
|---|---|---|---|---|
| `guide_wanger_ma` | `poison_tongue` | 比价（compare） | 装可怜（pity） | 毒舌怕被摆事实讲道理 |
| `guide_li_suanpan` | `rational` | 比价（compare） | 以毒攻毒（poison） | 理性人吃证据、烦无赖 |
| `guide_zhao_tuotuo` | `lazy` | 装可怜（pity） | 我需要（firm） | 懒人怕被需求绑定、触发怜悯 |
| `guide_qian_manman` | `philosopher` | 以毒攻毒（poison） | 比价（compare） | 鸡汤人吃同频、烦算计 |
| `guide_zhou_anan` | `dark` | 我需要（firm） | 装可怜（pity） | 腹黑人吃直球、烦卖惨 |

> 注意：`poison_tongue` 与 `rational` 同为弱点=比价，属独立行允许（每行 1+1+2 自洽即可）；如 playtest 显示两型手感趋同，可在 v2 调参时错开（仍须保 1+1+2）。

---

## 3. 商品池 + 比价素材（L1.mart.products · 价格占位）

> 结构锚定 `01-product-stage.md` §2：`id` / `name` / `emoji` / `pricePlaceholder`(字符串, 禁真实数字) / `shopName`(化名) / `category` / `absurdity`(true=离谱/false=正常) / `guideBinding` / `rarity`(Rarity 枚举) / `compareMaterial`(比价素材, 字符串占位)。
> **价格区间占位**：仅用相对/戏谑占位（`"离谱价"` / `"¥??"` / `"智商税价"` / `"看缘分价"`），**禁真实价格数字**（红线 #2）。比价素材只用相对描述，不用绝对数字。

### 3.1 商品池（6 件 · 可 playtest 初稿）

| `id` | `name` | `emoji` | `pricePlaceholder` | `shopName`(化名) | `category` | `absurdity` | `guideBinding` | `rarity`（建议种子） |
|---|---|---|---|---|---|---|---|---|
| `prod_001` | 能测前任心跳的枕头 | 🛏️ | 离谱价 | 某宝杂货铺 | 家居 | true | `guide_zhou_anan` | uncommon |
| `prod_002` | 会骂人的闹钟 | ⏰ | ¥?? | 老王不卖铺 | 数码 | true | `guide_wanger_ma` | rare |
| `prod_003` | 充电宝（正常品锚定真实感） | 🔋 | 看缘分价 | 某团小店 | 数码 | false | `guide_li_suanpan` | common |
| `prod_004` | 口红（正常品） | 💄 | 智商税价 | 某宝杂货铺 | 美妆 | false | `guide_qian_manman` | common |
| `prod_005` | 自动喂猫机器人 | 🐱 | 离谱价 | 京城杂货 | 宠物 | true | `guide_zhao_tuotuo` | rare |
| `prod_006` | 防秃头按摩梳 | 💆 | ¥?? | 某团小店 | 个护 | true | `guide_zhou_anan` | uncommon |

> 离谱:正常 = 4:2（≈67%，≥6:4 偏离谱提笑率 H2，`01` §6）。商品图禁真实品牌 logo / 真实商品照（ART-BIBLE §9.1 #1/#2）。`rarity` 为建议种子 · playtest 标定（Rarity 枚举：common|uncommon|rare|epic|legendary）。

### 3.2 比价素材（compareMaterial · 供 move_compare 触发 · 相对描述无绝对数字）

| `productId` | `compareMaterial`（可 playtest 初稿） |
|---|---|
| `prod_001` | `"同款前任周边别家一抓一把，没必要在这交冤枉钱。"` |
| `prod_002` | `"会骂人的小家电某宝杂货铺一抓一把，价还更实在。"` |
| `prod_003` | `"充电宝满大街一个行情，这家没便宜到哪去。"` |
| `prod_004` | `"这色号别家常驻活动，这价划不来。"` |
| `prod_005` | `"自动喂猫的，比别家贵出一截，劝你冷静。"` |
| `prod_006` | `"梳子而已，这价够买好几把普通的了。"` |

---

## 4. 待标定清单汇总（手感数值标注「建议种子 · playtest 标定」）

| 项 | 建议种子 · playtest 标定 | 标定方法 | 否决边界 |
|---|---|---|---|
| 破防度初始值 `affinity.initial` | **20**（建议种子 · playtest 标定；概念草案 50*，反骨建议 30~40） | H2 笑率 + 胜任感 | `00-CONCEPT.md` §10 // [PROVISIONAL-C3] orchestrator nudge to make WIN_ANTI slightly more reachable under random play; design-strategist to do full rebalance in Phase 6 |
| 单轮 delta | +40 / −10 / +10（设计常量，非调参） | 矩阵手感（H5 分布） | §6.4 否决#2（不全同值） |
| `round_cap` | **8**（建议种子 · playtest 标定） | 单局 5–15min | §6.4 防死循环 |
| 保底轮次 N | **5**（建议种子 · playtest 标定） | 防被耍感 | §5.2 |
| 记忆分级阈值 | 3 / 10（设计常量） | P1 第 5 单差异 | §6.4 否决#1 |
| vip affinity 阈值 | **affinity≥80 或 10 次**（建议种子 · playtest 标定） | 回访率 H6 | — |
| 五导购台词 | 已填初稿（§1） | playtest G2/G3 | 红灯 0 容忍 |
| 四型矩阵分配 | 已填种子（§2.1） | H5 / H2 | 1+1+2 机检 |
| 商品总数 | 6（建议种子） | 内容量 / H2 | — |
| 离谱:正常 比 | 4:2（建议种子，≥6:4） | 内容量 / H2 | — |
| 价格 / 比价素材 | 占位字符串（禁数字） | 禁忌词自检 | 红线 #2 |

---

## 5. 禁忌词自检（forbidden_check 接线 · 本填值稿扫描）

- **红灯（0 容忍）扫描结论**：本填值稿所有台词（§1）/ 商品名（§3.1）/ 店名（§3.1 化名）/ 价格占位（§3.1 无数字）/ 比价素材（§3.2 无绝对数字）**未发现**政治 / 色情暴力 / 歧视 / 威胁违法 / 真实信息 / 虚假宣传类红灯词 → `red_light_count = 0`，整包可接受。
- **黄灯（已化名）**：竞品→某宝/某团；真人→某明星（未出现具体名）；地名→京城（仅 `prod_005` 店名「京城杂货」作化名）。全部已化名。
- **保留项**：「智商税」为反骨劝退话术（吐槽商品非攻击用户），依 `mart-禁忌词终审.md` 保留；「老板 / 上家」为化名指代或劝退话术，非真实信息。
- **运行时（v2 接 brain）**：`forbidden_check` 常驻，每包先验红灯；`red_light_count > 0` → 整包拒绝 → L4 降级（07 §3）。
- **机检**：任一屏出现红线词 → 否决#3（配置污染）整包拒绝（REVIEW §8）。

---

## 6. 与上游契约对齐

- **复用**：`id`（L1-T4）/ `Rarity` 枚举 / `forbidden_check` / `ui_meta` 水印 / `memoryTier` 桶（first/regular/vip）/ 4 级降级（§9.1）。
- **EVOL 跟踪**：EVOL-1(`actor` 增 `guide`，v2 事件) / EVOL-4(archetype 自键承载，本备料 `archetype` 用规范英文 id 不扩 waimai persona) / EVOL-2/3/6(语义注释，无 schema 变更)。
- **不修改 waimai 文件**（L1-T5）。
- 矩阵模式以规范 1+1+2 锁死 5 行（REVIEW §6 D2）；L1 draft §1 的 2+2 漂移已在本填值稿修正。

---

_胡闹导购 · Phase 5 Epic A 内容填值 v1.1 · design-strategist（文策渊）· 2026-07-26 · 可 playtest 初稿 · 手感数值待主理人拍板 + playtest 标定 · 不擅自 commit（主理人统一落 agent-mart）_
