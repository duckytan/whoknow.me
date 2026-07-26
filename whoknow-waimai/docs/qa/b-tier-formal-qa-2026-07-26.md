# whoknow-waimai · 框架深化 B 档 · 正式质量门报告（Phase 5 · 评审强度 full）

> **Task ID**：QA-WAIMAI-DEEPEN-B-001
> **质量门角色**：quality-lead（严守真 / Yan Soujin）
> **范围**：B 档（同店差异感 + 骑手认人 + 扩 18 分支 + 3 新成就）
> **实现 commit**：f132931（已合 main，本地与 origin/main 0/0 同步）
> **出证日期**：2026-07-26
> **方法声明**：全部结论基于本 QA 独立运行的命令输出（`npm test`、SEED 解析校验脚本、边界实证脚本、playtest-sim）。未转述工程自述。未执行 git 提交/推送。

---

## 0. 结论速览（质量门判定）

**判定：CONCERNS（有条件通过）**

| 维度 | 判定 | 说明 |
|---|---|---|
| 同店差异维度（P0-D 核心）：regular_2nd / shop_s0X_loyal×5 / vip_roast / shop_s0X_roast×5 / default_i·j·k×3 / 成就 local_regular·old_shop_roast | **PASS** | 运行时可达（shopVisitCount 已派生并注入），测试充分，红线合规 |
| 骑手认人维度：rider_r00X_recog×3 / 成就 rider_buddy | **BLOCKED** | SEED/测试/注册表结构完整，但运行时不可达（riderVisitCount 未派生/注入） |

**阻塞项（须回派工程修复后方可就骑手维度签字）**：

1. **[BLOCKER]** `riderVisitCount` 未在运行时派生与注入。SEED 中 3 条 `rider_r00X_recog` 分支与 `rider_buddy` 成就在真实玩法下**永不可触发**（条件 `riderVisitCount >= 2` 恒为 `undefined >= 2 → false`）。实现摘要所称「riderVisitCount 引擎派生已落地」仅部分成立（类型 + 白名单已接通，但无存储、无计算、无接线）。
2. **[测试缺口]** 现有 T19 / COV-rider / M8 / playtest-sim 均在测试层**手动注入** `riderVisitCount`，掩盖了上述接线缺陷。缺少「OrderView.submit → getHistoryParams → runDrama」全链路集成测试。

**放行建议**：同店维度可进入下一阶段（打磨 / 发布准备）；骑手维度须修复 BLOCKER 后回派复验。

---

## 1. 测试策略（针对 B 档）

| # | 维度 | 策略 | 落地手段 |
|---|---|---|---|
| T1 | **结构合法性** | 校验 SEED 顶层为 58 分支、id 全唯一、next/id 闭环、无退役字段 | 独立解析脚本 `.qa-tmp/qa-validate.mjs` + 单元测试 L1–L5 |
| T2 | **条件一致性** | 新分支 condition 仅引用 ALLOWED 变量（shopVisitCount / riderVisitCount / shopId / riderId / flag()） | 脚本逐分支提取变量比对 KNOWN_VARS；边界实证脚本 |
| T3 | **非死链** | 每条链内 `next`/`nextWeights` 指向的节点 id 均存在；flag 读取方存在 setter 闭环 | 脚本解析 + COV 测试（2000 会话×12 单断言 58/58 可达） |
| T4 | **成就可解锁** | 3 新成就（local_regular / old_shop_roast / rider_buddy）在注册表存在且 SEED 有解锁路径 | 注册表 grep（achievements.ts:27–29）+ 脚本交叉校验 |
| T5 | **红线合规** | 新文案过 forbidden_check（真实 taboo 清单），red_light_count = 0 | 脚本对 105 条新台词 + 264 条全量台词扫描 |
| T6 | **引擎派生正确性** | riderVisitCount / shopVisitCount 由记忆层正确派生并注入推演 | grep 源码证据 + OrderView 运行时路径核对（发现缺口，见 §3.5 / §4） |

---

## 2. 测试用例清单（可执行 + 断言）

> 注入约定：`history` 即 `HistoryParams`；`det = () => 0`（概率门必过、权重池取首位、next 取首位）。
> 「✅已证」= 已被 `npm test` 或本 QA 脚本实证命中。

| 编号 | 前置（注入 HistoryParams / OrderInput） | 预期命中分支 | 预期成就解锁 | 证据 |
|---|---|---|---|---|
| TC-01 | `orderTotal=50, avgDishPrice=99`，`history:{shopVisitCount:1}`，不传 shopId/riderId | `default`（落兜底，不命中 regular_*） | 无 | ✅ 边界脚本 |
| TC-02 | 同上，`history:{shopVisitCount:2}` | `regular_2nd`（精确 =2，不与 >=3 重叠） | 无 | ✅ dramaEngine.test T18 |
| TC-03 | 同上，`history:{shopVisitCount:3}` | `regular_3rd`（>=3），且 `!= regular_2nd` | `regular` | ✅ 边界脚本 + T14 |
| TC-04 | `shopId=s01`，`history:{shopVisitCount:3}` | `shop_s01_loyal`（抽样命中，权重公平） | `local_regular` | ✅ 边界脚本 |
| TC-05 | `shopId=s02..s05` 各 `history:{shopVisitCount:3}` | `shop_s0X_loyal` 对应店 | `local_regular` | ✅ COV 测试（5 店全覆盖） |
| TC-06 | `shopId=s01`，`flags:['vip_s01']`，`history:{shopVisitCount:3}` | `vip_roast`（读 flag(vip_{shopId}) 闭环孤儿 flag） | `old_shop_roast` | ✅ COV 测试 21（random=0.7） |
| TC-07 | `shopId=s01`，`history:{shopVisitCount:8}` | `shop_s01_roast`（>=8 老店吐槽） | 无 | ✅ 边界脚本 |
| TC-08 | `shopId=s02..s05` 各 `history:{shopVisitCount:8}` | `shop_s0X_roast` 对应店 | 无 | ✅ COV 测试（5 店全覆盖） |
| TC-09 | `riderId=r001`，`history:{riderVisitCount:1}`（引擎层注入） | `rider_r001_fast`/`rider_r001_b`（**不**认人） | 无 | ✅ 边界脚本 |
| TC-10 | `riderId=r001`，`history:{riderVisitCount:2}`（引擎层注入） | `rider_r001_recog` | `rider_buddy` | ✅ dramaEngine.test T19（⚠️ 仅引擎层，运行时见 BLOCKER） |
| TC-11 | `riderId=r002 / r003`，`history:{riderVisitCount:2}` | `rider_r002_recog` / `rider_r003_recog` | `rider_buddy` | ✅ COV 测试 |
| TC-12 | `orderTotal=50, avgDishPrice=99`（纯基线，无 shopId/riderId/remark/flag） | `default` / `default_b`…`default_h` / `default_i`·`j`·`k` 之一 | 无 | ✅ COV 测试（11 条基线全现） |

**边界覆盖断言（已实证，见 `.qa-tmp/boundary.ts` 输出 6/6 通过）**：

- `shopVisitCount`：`=1` → 不命中 regular_2nd/regular_3rd；`=2` → 仅 regular_2nd；`>=3` → regular_3rd 且不含 regular_2nd。三档零重叠。
- `riderVisitCount`：`=1` → 走骑手人格分支（不认人）；`>=2` → 认人分支。阈值隔离正确。

---

## 3. 执行与证据

### 3.1 `npm test`（独立运行，真实 exit code）

```
> node --test --experimental-strip-types "src/**/*.test.ts"
# tests 50  # pass 50  # fail 0  # cancelled 0  # skipped 0
# duration_ms 1897.2
EXIT_CODE=0
```

**真实绿数：50/50 通过，退出码 0。** 覆盖：SEED 解析(L1–L5)、红线门控(F1–F5)、下单输入(O1–O4)、成就(A1–A2)、商店(S1–S3)、死分支守卫(COV×3)、引擎验收(T1–T19)、购物车、记忆引擎(M1–M8)。

> ⚠️ **取证注意**：COV 测试（test 20）与 T19/M8 在测试层**手动构造 `history:{riderVisitCount:2}`**，因此「骑手认人分支可达」在该层成立；但这**不代表运行时可达**（见 §3.5）。

### 3.2 SEED 结构校验（`.qa-tmp/qa-validate.mjs` 独立解析）

| 检查项 | 结果 |
|---|---|
| 分支总数 = 58（40 基线 + 18 新增） | ✅ PASS |
| id 唯一（零重名） | ✅ PASS |
| 40 基线分支全部存在（无改/删） | ✅ PASS |
| 18 新增分支全部存在 | ✅ PASS |
| 链内 `next` 引用全部解析成功（0 死链） | ✅ PASS |
| `nextWeights` 与 `next` 同序等长 | ✅ PASS |
| 新分支条件仅引用 ALLOWED 变量 | ✅ PASS |
| 无 `mood`/`speaker` 二义字段；分支层无 `actor` | ✅ PASS |
| 新文案 forbidden_check（red_light = 0，扫描 105 条） | ✅ PASS |
| 全量 58 分支文案 forbidden_check（red_light = 0，扫描 264 条） | ✅ PASS |
| 3 新成就注册表存在 + SEED 解锁路径存在 | ✅ PASS |
| SEED 引用成就 id 全部在注册表（0 悬空） | ✅ PASS |

### 3.3 成就可达性证据（grep）

- 注册表 `src/data/achievements.ts:27–29` 含 `local_regular` / `old_shop_roast` / `rider_buddy`。
- SEED 中：`local_regular` 由 `shop_s0X_loyal`×5 解锁；`old_shop_roast` 由 `vip_roast` 解锁；`rider_buddy` 由 `rider_r00X_recog`×3 解锁（结构路径存在）。
- `achievements.test.ts:11` 断言 15 条成就含此 3 项。

### 3.4 红线合规抽查（forbidden_check 跑新文案）

使用真实 taboo 清单 `tests/taboo-list.json`（red_light 33 项：医院/hosp/美团/1288/7353/3593/工商银行/微信支付/支付宝/银联/江小鱼/meituan/bomb/炸弹/icu/警察/公安/诈尸/投毒/公厕/百慕大/bermuda/toilet/haunted/food_poison/自杀/吃死/上吊）。
对 B 档新增 105 条台词 + 全量 264 条台词扫描：`red_light_count = 0`。✅

### 3.5 `riderVisitCount` 派生落地证据（grep 源码）

| 检查点 | 证据 | 结论 |
|---|---|---|
| loader 白名单 | `src/config/loader.ts:54` KNOWN_VARS 含 `'riderVisitCount'` | ✅ 已接通 |
| 引擎 HistoryParams 类型 | `src/engine/dramaEngine.ts:32` `riderVisitCount?: number` | ✅ 类型声明 |
| memory 实际派生/赋值 | `src/store/memory.ts` 全文**无** `riderVisitCount =` 赋值 | ❌ 仅类型注解，**无计算** |
| `getHistoryParams` 返回体 | `src/store/memory.ts:121` 仅返回 `{shopVisitCount, todayOrderCount, totalOrders}` | ❌ **不含 riderVisitCount** |
| `riderHistory` 存储 | `src/store/memory.ts` 全文**无** `riderHistory` 字段（仅在 `docs/` 规范中定义，未落地） | ❌ **无骑手计数来源** |
| OrderView 运行时接线 | `src/views/OrderView.vue:66` `hist = memory.getHistoryParams(sid)`；`:69` `runDrama(..., {history: hist})` —— `hist` 从未含 riderVisitCount | ❌ **未注入** |

**结论**：`riderVisitCount` 的「管道」（类型 + 白名单）已就绪，但「数据源与接线」（riderHistory 存储、getHistoryParams 派生、OrderView 注入）全部缺失。运行时 `rider_r00X_recog` 条件恒为 `undefined >= 2 → false`，3 条分支与 `rider_buddy` 成就**实际不可达**。

> 设计草案 §1.4 已列明两方案（A：引擎派生 riderVisitCount；B：flag 法新增 rider_r00X_first setter）。二者均未落地。实现摘要称「riderVisitCount 引擎派生已落地」与源码证据不符。

### 3.6 边界阈值实证（`.qa-tmp/boundary.ts`）

6/6 通过：svc=1/2/3 三档零重叠；riderVisitCount=1 不认人、=2 认人；shop_s01_loyal（svc=3）/ shop_s01_roast（svc=8）抽样可达。

---

## 4. 风险与回归

### 4.1 是否破坏现有 40 基线分支

- SEED 校验确认 40 基线分支 id **全部存在、未改名、未删除**（§3.2）。
- `isFallback` 兜底链完整：11 条基线（含新增 `default_i·j·k`）在 COV 测试 800 纯基线单中全部出现（抗疲劳生效）。
- `regular_{shopId}` / `vip_{shopId}` 的 nextWeights 指向、setter 行为未被改动。

### 4.2 权重失衡 / 分支爆炸

- 新增 18 分支使高 `shopVisitCount` 同池竞争者增多（shop_s0X + _b + loyal + roast + regular_3rd + vip* + default*）。
- playtest-sim（1500 会话×12 单）命中率显示现有人格分支未被饿死：`shop_s01_angry`≈2.23%、各 `shop_s0X`≈2.1–2.3%、`rider_r00X`≈2.5%。新增 `regular_2nd`≈3.97%、`shop_s0X_loyal`≈0.6–0.8%、`rider_r00X_recog`≈3.1–3.4%（**注：recog 命中率为测试层注入值，运行时见 BLOCKER**）。
- 未发现现有核心人格分支被新分支压制至不可用。playtest 标定阈值（DATA-STRUCTURE §9 PLACEHOLDER）仍待真人标定。

### 4.3 死分支 / 覆盖差异（playtest-sim vs COV）

- playtest-sim 主模拟报 **56/58 覆盖**，`shop_s01_roast` / `shop_s02_roast` 饥饿至 0%。
- 但该结论为**采样伪阴性**：COV 测试（2000 会话 + 深忠诚强制 pass）断言 **58/58 全可达并通过**；本 QA 边界脚本亦独立命中 `shop_s01_roast`。roast 分支可达，仅低命中率。
- **建议**：playtest-sim 引入与 COV 同等的「单店深忠诚强制 pass」，消除该 false-negative，避免误导后续门控。

### 4.4 红线

- 新文案 forbidden_check `red_light_count = 0`（§3.4）。✅
- 字段层无退役红灯字段（icu/bomb/food_poison/haunted/firstEvent）。✅

### 4.5 已知非阻塞观察

- **vip 阈值 doc 不一致**：DATA-STRUCTURE §2.3 写 vip 档 `>= 5`；设计草案 §0.2 误记为 spec 写 `>= 10`；实现取 `>= 8`（设计折中，属 §9 PLACEHOLDER）。`vip_5th`(>=5) 与 `vip_roast`(>=8) 并存互补，符合设计 §3.2。非阻塞。
- **`regular_{shopId}` 仍为孤儿 flag**：`vip_{shopId}` 已由 `vip_roast` 读取闭环（设计 §3.3 已标注此残留）；`regular_{shopId}` 仅 set 无 reader。非阻塞。
- **测试层注入掩盖接线缺陷**（BLOCKER 的间接表现）：T19/COV-rider/M8/playtest-sim 均手动注入 `riderVisitCount`，故全绿却未暴露运行时缺口。

---

## 5. 质量门判定

### 判定：**CONCERNS**

**通过部分（可进入下一阶段 · 打磨 / 发布准备）**：
- 同店差异维度（P0-D 核心）：regular_2nd、shop_s0X_loyal×5、vip_roast（含孤儿 flag vip_{shopId} 闭环）、shop_s0X_roast×5、default_i·j·k×3，及成就 local_regular / old_shop_roast。
- 全部结构合法性、条件一致性、非死链、红线合规、成就可达性均 PASS。
- `npm test` 50/50 绿、`red_light_count = 0`、SEED 58 分支零重名零死链。

**阻塞项（须回派工程修复，完成后就骑手维度复验）**：

1. **[BLOCKER] 骑手认人运行时不可达**：`riderVisitCount` 未由记忆层派生、未注入推演。修复二选一：
   - **方案 A（引擎派生）**：`MemoryEngine` 增加 `riderHistory` 存储（对齐 DATA-STRUCTURE §5.1）；`getHistoryParams` 增加 `riderVisitCount` 派生（= `riderHistory[riderId]`，需传入 `riderId`）；`OrderView.submit` 将 `riderVisitCount` 注入 `runDrama` 的 `history`。
   - **方案 B（flag 法，零引擎改动）**：新增 `rider_r00X_first` setter 分支（置 `seen_rider_{riderId}`）；`rider_r00X_recog` 条件改为 `riderId = r00X & flag(seen_rider_{riderId})`。
2. **[测试缺口]** 补充全链路集成测试：经 `OrderView.submit`（或等价入口）→ `getHistoryParams` → `runDrama` 真实路径，断言同骑手第 2 单触发 `rider_r00X_recog` 并解锁 `rider_buddy`。当前测试因手动注入参数而漏检。

**复验条件**：BLOCKER 修复后，独立重跑 `npm test` + 本 QA 校验脚本，确认 `rider_r00X_recog` 在真实 `getHistoryParams` 路径下可达，门控方可对骑手维度升级为 PASS。

---

## 附录 · 取证产物

| 产物 | 路径 |
|---|---|
| 独立 SEED 校验脚本 + 报告 | `whoknow-waimai/.qa-tmp/qa-validate.mjs` · `qa-validate-report.txt` |
| 边界阈值实证脚本 | `whoknow-waimai/.qa-tmp/boundary.ts` |
| `npm test` 输出 | 见 §3.1（50/50，exit 0） |
| playtest-sim 输出 | 见 §4.3（56/58；roast 为采样伪阴性，已独立证伪） |

_质量门为建议性门控；最终放行由主理人（游承峰）统筹。本报告未执行 git 提交/推送。_

---

## 复验记录（QA-WAIMAI-DEEPEN-B-REVERIFY-001）

> **复验 Task ID**：QA-WAIMAI-DEEPEN-B-REVERIFY-001 · 优先级 P0
> **复验角色**：quality-lead（严守真 / Yan Soujin）
> **复验对象**：QA-WAIMAI-DEEPEN-B-001 之 CONCERNS 阻塞项（骑手认人维度运行时不可达）
> **复验日期**：2026-07-26
> **复验强度**：full（独立取证，不转述工程自述；未改业务代码、未 git 提交/推送）
> **工程回传（IMPL-RIDER-WIRE-001）**：memory.ts 增 `RiderRecord` + `riderKey` + `readRider`/`writeRider` + `recordRider` + `getHistoryParams(sid, riderId?)` 派生 `riderVisitCount`（存储+1 含本次）；`OrderView.vue:66` 传 `assignedRiderId`、`:77` `recordRider` 落库；`npm test` 50→52/52；新增 `memory.test.ts` M9 与 `dramaEngine.test.ts` T20（均非手动注入）。

### R1. `npm test` 重跑（真实 exit code + 绿数）

```
> node --test --experimental-strip-types "src/**/*.test.ts"
# tests 52  # pass 52  # fail 0  # cancelled 0  # skipped 0  # todo 0
# duration_ms 1946.5
EXIT_CODE=0
```

**真实绿数：52/52 通过，退出码 0**（较上次 50/50 新增 M9、T20 两项，均为非手动注入 `riderVisitCount` 的端到端/跨实例派生测试）。覆盖：SEED 解析(L1–L5)、红线门控(F1–F5)、下单输入(O1–O4)、成就(A1–A2)、商店(S1–S3)、死分支守卫(COV×3)、引擎验收(T1–T20)、购物车、记忆引擎(M1–M9)。

### R2. 上次校验脚本重跑（`.qa-tmp/qa-validate.mjs`）

脚本 §⑦ 原按设计草案旧名 `riderHistory` 做 grep；IMPL-RIDER-WIRE-001 实际落地用 `RiderRecord`/`riderKey`/`recordRider`（命名不同、职责等价）。已**按现状修正 §⑦ 核查项**（改为查 `RiderRecord` / `riderKey` / `recordRider` / `getHistoryParams` 派生 / `OrderView` 接线 / 不双重 +1），重跑结果：

| 检查项（§①–⑥，结构合法性） | 结果 |
|---|---|
| 分支总数 = 58（40 基线 + 18 新增） | ✅ PASS |
| id 唯一（零重名） | ✅ PASS |
| 40 基线分支全部存在（无改/删） | ✅ PASS |
| 18 新增分支全部存在 | ✅ PASS |
| 链内 `next` 引用全部解析成功（0 死链） | ✅ PASS |
| 新分支条件仅引用 ALLOWED 变量 | ✅ PASS |
| 无 mood/speaker 二义字段；分支层无 actor | ✅ PASS |
| 新文案 forbidden_check（red_light = 0，105 条） | ✅ PASS |
| 全量 58 分支文案 forbidden_check（red_light = 0，264 条） | ✅ PASS |
| 3 新成就注册表存在 + SEED 解锁路径存在 | ✅ PASS |
| SEED 引用成就 id 全部在注册表（0 悬空） | ✅ PASS |

§⑦（按现状修正后）全绿：

| 检查项 | 结果 |
|---|---|
| loader KNOWN_VARS 白名单含 riderVisitCount（line 54） | ✅ PASS |
| dramaEngine HistoryParams 类型含 riderVisitCount? | ✅ PASS |
| memory.ts 存在 riderVisitCount 派生/赋值（getHistoryParams 内部） | ✅ PASS |
| getHistoryParams 返回体含 riderVisitCount（= readRider().visitCount + 1） | ✅ PASS |
| memory.ts 存在 RiderRecord 存储结构 | ✅ PASS |
| memory.ts 存在 riderKey 存储键 | ✅ PASS |
| memory.ts 存在 recordRider 落库（镜像 recordOrder 写 shop） | ✅ PASS |
| OrderView: getHistoryParams(sid, assignedRiderId) 确传 riderId | ✅ PASS |
| OrderView: recordOrder 后调用 recordRider(assignedRiderId) 落库 | ✅ PASS |
| OrderView 未对 riderVisitCount 双重 +1（+1 只在 getHistoryParams 内部） | ✅ PASS |
| OrderView 仅对 shopVisitCount 本地 +1（与历史行为一致） | ✅ PASS |

校验结论摘要：`分支总数: 58 | 重名: 0 | 死链: 0 | 条件非法变量: 0 | 字段二义: 0 | 红线: 0/0 | riderVisitCount 运行时派生: 已落地`。

### R3. 骑手接线三处独立证据（grep，不转述）

**① `src/store/memory.ts`**（骑手计数存储 + 派生）：
- `memory.ts:42` `interface RiderRecord { visitCount: number }`
- `memory.ts:65` `private riderKey(riderId: string)` → `` `waimai:rider:${riderId}` ``
- `memory.ts:84` `private readRider(riderId): RiderRecord`（空键返回 `{visitCount:0}`）
- `memory.ts:93` `private writeRider(riderId, rec: RiderRecord)`
- `memory.ts:141` `recordRider(riderId): number`（read→+1→write→返回计数，镜像 recordOrder 写 shop）
- `memory.ts:148` `getHistoryParams(shopId: string, riderId?: string): HistoryParams`
- `memory.ts:157` `if (riderId) out.riderVisitCount = this.readRider(riderId).visitCount + 1`（**派生在引擎内部，含本次 +1；不传 riderId 时无该字段，向后兼容**）

**② `src/views/OrderView.vue`**（运行时接线）：
- `OrderView.vue:66` `const hist = memory.getHistoryParams(sid, assignedRiderId)` —— **确传 riderId**
- `OrderView.vue:67` `hist.shopVisitCount = (hist.shopVisitCount ?? 0) + 1` —— 仅 shop 维度本地 +1
- `OrderView.vue:76` `memory.recordOrder(sid, {...})`
- `OrderView.vue:77` `if (assignedRiderId) memory.recordRider(assignedRiderId)` —— **recordOrder 后落库骑手计数**
- 全文件无 `riderVisitCount = ... + 1` 语句 → **未双重 +1**（rider 的 +1 只在 getHistoryParams 内部）

**③ `src/config/loader.ts`**（白名单，未改）：
- `loader.ts:54` `'shopVisitCount', 'riderVisitCount',` —— KNOWN_VARS 含 riderVisitCount；git diff vs f132931 中 loader.ts 不在变更列表，白名单零改动。

### R4. 真实派生验证（关键 · `.qa-tmp/reverify-rider.mts`，独立脚本，未手动注入 riderVisitCount 字段值）

脚本以真实 `MemoryEngine` + `MemStore` + `runDrama` + 真实 SEED 运行，**8/8 通过（exit 0）**：

| 编号 | 步骤 | 预期 | 实际 |
|---|---|---|---|
| A1 | 第1单 getHistoryParams('s01','r001') | riderVisitCount = 1（真从 KV 派生） | ✅ 1 |
| A2 | 第1单 runDrama | 未命中 rider_r001_recog（<2） | ✅ selected=default_f |
| A3 | 第2单 getHistoryParams('s01','r001') | **riderVisitCount = 2（不手动注入 {riderVisitCount:2}）** | ✅ 2 |
| A4 | 第2单 runDrama | 命中 rider_r001_recog | ✅ selected=rider_r001_recog |
| A5 | 命中台词 | 含认人内容「雷速飞」 | ✅ |
| A6 | 经 branchMeta.achievements → unlockAchievements | 解锁 rider_buddy | ✅ |
| B1 | recordRider×2 后 getHistoryParams | 真实派生 = 3（存储2 + 内部+1） | ✅ 3 |
| B2 | 不传 riderId | 向后兼容无该字段 | ✅ undefined |

**关键结论**：`riderVisitCount` 的值确由 `readRider(riderId).visitCount + 1` 从 KV 存储真实派生（A3 = 2，B1 = 3），全程未手写注入 `{riderVisitCount:2}` 字面量；且第 2 单经真实 `getHistoryParams → runDrama` 命中 `rider_r001_recog` 并闭环解锁 `rider_buddy`。**骑手认人维度已运行时可达。**

> 语义说明（非阻塞）：任务字面表述「recordRider 两次 → 断言 getHistoryParams === 2」与实现不符——实现在 `getHistoryParams` 内部对存储值 +1（含本次），故 recordRider×2（存储=2）后派生值为 3（B1 已实测）。运行时实际时序为「每单先 getHistoryParams（内部 +1）后 recordRider 落库」（A1–A4 已还原该时序并命中），第 2 单派生值恰为 2、达认人阈值。该 +1 语义与 OrderView 对 shop 的本地 +1 一致，非缺陷，不阻塞放行。

### R5. 回归核查

`git diff --stat f132931`（formal-QA 提交）仅含 5 项变更：

```
src/store/memory.ts              | 38 ++++++++-   （骑手计数存储 + getHistoryParams 派生）
src/views/OrderView.vue          |  3 +-        （传 riderId + recordRider 落库）
src/store/memory.test.ts         | 17 ++++      （M9）
src/engine/dramaEngine.test.ts   | 26 ++++      （T20）
docs/PLAYTEST-SIM-2026-07-25.md  | 73 ----      （旧 sim 文档删除，非 QA 范围）
```

- **40 基线 + 18 B 档分支零改动**：`docs/specs/DRAMA-SEED-v1-2026-07-24.json` 不在 diff 列表（字节级未动）；qa-validate 复验确认 58 分支 id 全留存、0 死链、0 条件非法变量 → 结构零改动。
- **loader 白名单未动**：`src/config/loader.ts` 不在 diff 列表，KNOWN_VARS 仍含 riderVisitCount（loader.ts:54），无增删。
- **shopVisitCount 既有行为未变**：memory.ts diff 中 `recordOrder`（shop.visitCount += 1 / writeShop / global 递增）未被改动；`OrderView.vue:67` 的 `hist.shopVisitCount = ... + 1` 原样保留。npm test 中 M5（二访触发 odd_eats）、T14（shopVisitCount=3→regular_3rd）、T18（shopVisitCount=2→regular_2nd）均仍绿 → 同店维度行为未回归。
- **playtest-sim 未动**：`scripts/playtest-sim.ts` 不在 diff 列表。
- 观察项（非阻塞）：工作区存在未提交改动（memory.ts / OrderView.vue / 两测试文件），且 `docs/PLAYTEST-SIM-2026-07-25.md` 被删除（旧文档，不在本次 QA 范围）。本次复验未做 git 提交/推送，提交统筹由主理人处理。

### R6. 最终判定

**原 CONCERNS → 升为 PASS。**

| 维度 | 复验判定 | 说明 |
|---|---|---|
| 同店差异维度 | PASS（维持） | 未受改动影响，回归绿。 |
| 骑手认人维度（原 BLOCKED） | **PASS（已解阻塞）** | ① 工程自述的三处接线经 grep 独立取证确认（R3）；② 真实派生脚本 8/8 证明值从 KV 派生且第 2 单命中 rider_r001_recog 并解锁 rider_buddy（R4）；③ npm test 52/52、qa-validate 全绿、SEED 58/0 死链（R1–R2）。原 BLOCKER 两项（运行时不可达 / 测试层注入掩盖）均消除。 |

**阻塞项状态**：上次两项 BLOCKER 已全部关闭——
1. [BLOCKER] 骑手认人运行时不可达 → 已修复并独立复验可达（R3–R4）。
2. [测试缺口] 全链路集成测试 → 已补 M9（跨实例 KV 派生）+ T20（端到端 memory→runDrama 命中 recog 并解锁 rider_buddy），均非手动注入（R1）。

**新阻塞项**：无。

**放行结论**：B 档框架深化整体质量门由 CONCERNS **升为 PASS**。同店差异 + 骑手认人两维度均运行时可达、测试充分、红线合规、结构零回归。B 档框架深化可进入下一阶段（打磨 / 发布准备）；playtest 仍按用户战略排最后（真人体验标定阈值 DATA-STRUCTURE §9 PLACEHOLDER 待补）。

_复验环节未修改业务代码（仅修正 `.qa-tmp/qa-validate.mjs` §⑦ 的过期 grep 以匹配真实落地命名，并新增 `.qa-tmp/reverify-rider.mts` 取证脚本）；未执行 git 提交/推送。质量门为建议性门控，最终放行由主理人（游承峰）统筹。_
