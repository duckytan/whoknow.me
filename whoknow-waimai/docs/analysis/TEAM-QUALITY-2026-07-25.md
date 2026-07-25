# 胡闹宇宙 v2 · 禁忌词红线实测扫描 & QA 就绪度评估

> 评审人：quality-lead 严守真 ｜ 日期：2026-07-25 ｜ Task：ANL-QUALITY-01（P0）
> 扫描范围：**工作树（非 archive/）** ｜ 方法：Grep 逐文件实测，非信文档自述
> 红灯基准：已 Read `whoknow-brain/docs/禁忌词清单-v1.0.md`（v1.0 · 锡哥拍板）

---

## 0. 红灯词基准（本次实测命中口径）

- **0 容忍红灯内容词**：上吊/自杀/死(真实死亡语境)/吃死/ICU/医院(事故或喜剧惩罚语境)/炸弹/爆炸/警察/公安/诈尸/投毒/公厕/百慕大/bermuda/toilet/haunted/food_poison/bomb/icu/icu_survivor/bomb_survivor/rare_dish_survivor/hosp/hosp_survivor/blacklist_boss/dark_dish_survivor(旧名)
- **真实信息红线（等价 0 容忍）**：真实明星/真实物价/真实品牌点名（黄灯品牌名须代称，用户可见文案禁竞品真名）
- 说明：禁忌词清单定义文件自身、纯规则声明行、及「死穴/产品死/装死/死机/卡死/写死」等 slang 隐喻 **不计入违规**（已逐条判别）。

---

## 1. 实测红灯扫描（逐文件命中）

### 1.1 红灯内容词命中（医院 / hosp 家族）— 工作树 15 处

| 文件:行 | 命中词 | 上下文 |
|---|---|---|
| DRAMA-ENGINE-V2.md:103 | 医院 | 地址是否奇葩（天台/出租屋/**医院** → bossMood -20~-30） |
| DRAMA-ENGINE-V2.md:165 | hosp | addressTag 枚举含 `'hosp'`（红灯字段未清） |
| DRAMA-ENGINE-V2.md:194 | rare_dish_survivor | 示例数组 `["married_r003","dark_dish_s001","rare_dish_survivor"]` |
| DRAMA-ENGINE-V2.md:214 | 医院 / dark_dish | 吓进**医院**；`dark_dish_{shopId}` 示例 |
| DRAMA-ENGINE-V2.md:215 | rare_dish_survivor | `rare_dish_survivor` 隐藏料理幸存 |
| DRAMA-ENGINE-V2.md:216 | hosp_survivor / 医院 | `hosp_survivor`｜暴食进过**医院** |
| DRAMA-ENGINE-V2.md:235 | 医院 | address 枚举 家庭/学校/公司/天台/出租屋/**医院** |
| DRAMA-ENGINE-V2.md:393 | 医院 | 暴食进 **医院** → rare |
| DRAMA-ENGINE-V2.md:585 | 医院 | 成就「**暴进医院**」「骑手拒单成就」 |
| DRAMA-ENGINE-V2.md:616 | 医院 | 第1单 被骂 穷鬼 连3天 **医院** |
| DRAMA-ENGINE-V2.md:633 | hosp_visit / 医院 | `hosp_visit`｜**医院** 观光 |
| DRAMA-ENGINE-V2.md:635 | rare_dish_survivor | `rare_dish_survivor` 隐藏料理幸存 |
| prototype/terms.html:40 | 医院 | 「请不要为了解锁「辣度一姐」而去**医院**，健康比成就重要」 |

> 注：DRAMA-ENGINE-V2.md §6.4（439 行起）合规示例与 `DRAMA-SEED-v1-2026-07-24.json` 均已真洗；上述为**早期章节/枚举/成就表残留**。

### 1.2 竞品真名用户可见（美团）— 工作树 14 处（黄灯但违反 GDD §12）

| 文件:行 | 命中 | 性质 |
|---|---|---|
| prototype/index.html:6 | `<title>胡闹外卖 · 高仿美团原型 v3</title>` | 用户可见标题 |
| prototype/index.html:38 | `<h1>胡闹外卖 · 美团高仿原型</h1>` | 用户可见 H1 |
| prototype/index.html:39 | 基于 5 张**真实美团**长截图逐像素校准 | 真实品牌点名 |
| prototype/index.html:156 | 校准于**真实美团外卖** 2026-07 | 真实品牌点名 |
| prototype/css/meituan.css:2-4 | 高仿**美团外卖** 设计系统 / **美团黄** / 基于**真实美团**截图 | 文件名+内容 |
| prototype/pages/order.html:70 | **美团支付** · 庄**尾号 1288 | 真实品牌 + **真实银行卡尾号** |
| prototype/pages/checkout.html:103/134/145 | **美团红包** / **美团支付** / 更多**美团**支付方式 | 用户可见 |
| prototype/pages/shop.html:70 | 按**真实美团**哈哈蒸鸡 | 真实品牌点名 |
| prototype/pages/privacy.html:71 | 不代表任何**真实商家** | 真实商家（免责语境） |

> GDD §12（507 行）明文：「所有用户可见文案禁竞品品牌名（用某团/平台代称）」——原型直接违反。

### 1.3 黄灯（内部文档品牌 / slang，不计入硬违规）

- 美团/淘宝/天猫/小红书 在 GDD/BRAND/api-spec/三司会审记录/README 中以「竞品皮/水印伪装」等设计语境出现（设计 meta，非用户可见）。
- mart PROJECT-STATUS.md：17/26/106 行 淘宝/天猫 作「外衣」隐喻；107-109 行用「XXX/某代言/物价」**泛化占位，无真实明星/物价/品牌点名**（grep 零命中）。
- 「死」slang：死穴/产品死/装死/死机/卡死/写死 共十余处，均隐喻，非红灯。

### 1.4 已确认干净（正面证据）

- ✅ `DRAMA-SEED-v1-2026-07-24.json`：ship 级 seed 真洗（dark_dish/blacklist_reunion 合规版，无红灯词）。
- ✅ `data/home.json`、`docs/deploy/vercel-monorepo.md`：零命中。
- ✅ 工作树**不存在** `whoknow-waimai/src`、`/data`、`/public`（旧 app 已归档至 `archive/v1-waimai-app`）→ 旧活数据未残留于工作树。

### red_light_count 实测值

- **硬红灯内容词（医院/hosp 家族）：15 处**（DRAMA-ENGINE-V2.md 12 行 14 处 + prototype/terms.html 1 处）。
- **真实品牌用户可见（美团）：14 处**（黄灯但违反 GDD §12，含 1 处真实卡尾号）。
- 合计口径：**29 处硬/准红灯命中**（不含禁忌词清单定义文件与纯规则声明行）。

---

## 2. 哪些文档「自称已洗但实际仍含红灯」

| 文档 | 自称已洗处 | 实际仍含红灯 | 判定 |
|---|---|---|---|
| **DRAMA-ENGINE-V2.md** | §6.4 前注（437 行）「红线已洗…绝不上线」 | §5.1/枚举/成就（103/165/194/214/215/216/235/393/585/616/633/635）仍含 医院/hosp/hosp_visit/hosp_survivor/rare_dish_survivor | **假洗（spec 级）** |
| **DATA-STRUCTURE-v1** | 14/175 行「洗掉 icu/bomb/food_poison/bermuda/toilet」「addressTag 改 weird 桶」 | DRAMA-ENGINE-V2:165 仍列 `hosp`、:235 仍列 医院 → 跨 spec 矛盾 | **声明与事实不符** |
| **GDD-v2** | 429 行「全部话术已过重写，无红灯词」 | DRAMA-ENGINE-V2 仍含医院 | **跨文档声明不符** |
| 胡闹宇宙总方案 / mart | 198 行「mart 红线本轮回合已洗」 | mart 无真实明星/物价/品牌点名（grep 零命中），仅 淘宝/天猫 黄灯隐喻 | **基本属实（黄灯残留）** |

> 三司会审总审计-v2（34 行）已先验：「DATA-STRUCTURE §5.2 明定 icu/bermuda/toilet 为红灯并入 weird，但活数据/spec 未执行该清洗 → 上轮洗掉与实态不符。」本次 Grep 实测**印证**该判断。

---

## 3. QA / 测试就绪度

| 项 | 状态 |
|---|---|
| 测试框架 / 用例 | **无**（工作树无 package.json/test、无 whoknow-waimai/src） |
| 自动 forbidden_check 门控 | **仅 spec 声明**（DATA-STRUCTURE §5.2/§7「解析器直接拒绝含红灯词分支」），**未实现** → 0 容忍红线无自动兜底 |
| 真机 playtest（笑率 + 同店第 5 单差异） | **未做**（GDD §11 / 总纲 §9C 唯一硬闸门，v2 尚处 clean rebuild 前） |
| 降级（L1–L4）验证 | **未做**（无 MVP） |

**发布前必须通过闸门清单（GDD §11 + 总纲 §9C + DATA-STRUCTURE §5.2）**
1. 🔴 红灯 0 漏出：forbidden_check 自动门控 + 人工复核（当前 FAIL）
2. 🔴 记忆差异：同店第 5 单台词 ≠ 第 1 单，跨单 flags 生效（未测）
3. 🔴 决策有意义：branches 命中非查表（未测）
4. 🔴 3 秒爆点：首屏 persona 标签满足 P6（未测）
5. 🔴 降级不崩：brain 全挂 L4 fallback 不白屏（未测）

---

## 4. 质量风险等级清单（P0/P1/P2）

- **P0（红线 0 容忍）**
  1. DRAMA-ENGINE-V2.md spec 仍含 医院/hosp 家族红灯示例（12 行），且 437 行假称「已洗」→ 蓝图级红灯泄漏，开发者按 spec 易复制红灯词。
  2. prototype 用户可见层全量渲染真实「美团」品牌（14 处，含「美团支付·庄**尾号1288」真实卡尾号）→ 侵权灰区 + 违反 GDD §12。
  3. forbidden_check 自动门控未实现（仅 spec）→ 0 容忍红线无自动兜底。
- **P1**
  1. DATA-STRUCTURE 与 DRAMA-ENGINE-V2 对 addressTag/hosp 清洗状态互相矛盾。
  2. GDD §429 声明与 DRAMA 实态不符。
  3. `archive/v1-waimai-app` 旧活数据（config/quotes/dishes.json、DEVELOPER.md、PRODUCT-V3.md）仍含 公厕/百慕大/ICU/炸弹/诈尸/吃死你（三司总审计 v2:28-34 点名）→ P0 行动项「实际清洗活数据」未执行（已归档但红灯未清）。
- **P2**
  1. mart PROJECT-STATUS 仍用 淘宝/天猫 作「外衣」描述（黄灯，内部文档）。
  2. 大量「死」slang 非红灯但需文案规范，避免误伤自动审核。
  3. 无 playtest 方案 / 笑率&记忆差异度量脚本。

---

## 5. 结论（给主理人游承峰）

**FAIL（红线 0 容忍未达成）**。可恢复期：ship 级 `DRAMA-SEED.json` 已真洗，但 **spec 假洗 + 原型泄漏真实品牌** 使红线门控当前不过。必须先行：① 洗 DRAMA-ENGINE-V2.md 早期章节/枚举/成就表（医院→weird 桶、hosp 家族退市）；② 原型去「美团」真名（改某团/平台）+ 删真实卡尾号；③ 实现 forbidden_check 自动门控并接 CI；④ 归档旧活数据红灯清零。完成后方可进入 playtest 闸门。
