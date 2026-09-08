# 真人试玩 CONCERNS 复核查 · 2026-09-08（修订版 v2）

> 核查人：严过关（Yan）/ software-qa-engineer-2（纯核查；只读 + `git log/show`，未改任何 `whoknow-waimai/` 文件、未在 waimai 目录 build、未建临时文件于 waimai 内；临时物在 `.tmp/`）
> 对象：2026-07-26 真人代跑报告《REALUSER-PLAYTEST-2026-07-26.md》三条 CONCERNS，按 **当前发布链路实际引擎 `sliceDrama`** 重新判定
> 纪律遵守：未 `git add/commit/checkout/restore`、未 build、临时文件仅落在 `.tmp/`

---

## ⚠️ 修订说明（v1 → v2）

**v1 查错了引擎，结论作废。** v1 把 07-26 报告针对的「随机权重抽签引擎 `dramaEngine.runDrama`」当成现版本引擎，据此得出「问题②③ 源码已修/线上未含」「幽灵构建」等结论。

更正事实（team-lead 实测 + 本次复核确认）：
- 现版本发布链路 **不走 `runDrama`**。`whoknow-waimai/src/views/OrderView.vue:165` 调用的是 `sliceDrama(...)`（确定性切片推演），由 commit `e18481b`（2026-07-28）切换。`runDrama` 现仅被 `dramaEngine.coverage.test.ts` 与若干 `import type` 引用，已降为 legacy 路径，不在发布链路。
- 线上产物 `index-C4t84osW.js` 实测：`toilet`/`RIDER_ASIDE` 命中 = 2，`boss_blacklist` = 0，`priority` = 0 —— **符合预期**（现网跑 sliceDrama，自然不含 legacy 的 `priority`/`boss_blacklist`）。
- 时间线自洽：dist 构建 `addd873`（2026-08-16 07:50）晚于切换 `e18481b`（2026-07-28），产物与源码一致。**不存在「声称 rebuild 却没含」的部署事故**（v1 的「幽灵构建」结论撤回，理由见 §4）。

**因此：07-26 CONCERNS 的 ②③ 所针对的「随机分支竞争」对象，在现版本已不存在。** 下面按 sliceDrama 重新评估。

---

## 0. 修订后一句话结论

- **问题①（重复疲劳）**：仍存在，但形式变为「**确定性复现**」——同一 `(地址, 备注)` 输入**必然**得到逐字相同的段子（4 地址 × 6 备注 = 24 条确定链）。比随机引擎更可预期、也更可归因，但若 tester 重复同一输入则 100% 撞梗。
- **问题②（触发词被抢分支）**：**已结构性消解**。sliceDrama 无分支竞争，备注 1:1 决定台词，原「私房菜/拉黑（chip 名含人称代词，此处代词中立化转写）被骑手分支抢走」不可能发生；且原彩蛋 `odd_eats`/`boss_blacklist` 在 sliceDrama 的 6 种备注中根本不存在。
- **问题③（VIP 第5单）**：**已无意义**。sliceDrama 无 `shopId`、无 `shopVisitCount`、无 `vip_5th`、无同店递进概念，H2 门在现版本不适用。

**建议：能拉真人**（针对 H1 笑率主 KPI）。动作见 §5。H2/H3 门需随引擎重定义，不在本轮阻塞项。

---

## 1. 三问结论表（按 sliceDrama 重判）

| 原问题 | 修订结论 | 证据（文件:行） |
|---|---|---|
| ① 重复疲劳（同梗连刷） | **仍存在 · 确定性复现** | `sliceDrama.ts:31` 地址 4 种；`:32-39` 备注 6 种；`:296-375` `sliceDrama` 为纯函数、无随机；同 `(addr,remark)` → 同链（24 条确定链上限） |
| ② 用户触发词优先级（被抢） | **已结构性消解（原对象消失）** | `OrderView.vue:165` 调 `sliceDrama`；`sliceDrama.ts:174-213` `REMARK_BEAT` 由 `remarkTag` 1:1 决定；`remarkTag` 仅 6 种（无 odd_eats/boss_blacklist）→ 原彩蛋不存在、无分支竞争 |
| ③ VIP 第5单触发率 | **已无意义（引擎无此概念）** | `sliceDrama.ts:40-46` `SliceInput` 仅 `addressTag`/`remarkTag`（无 `shopId`）；全模块无 `shopVisitCount`/`vip_5th`/`regular_3rd` |

---

## 2. 问题① 在 sliceDrama 下的重复疲劳（确定性复现）

### 2.1 切片组合空间
- 地址维度 `AddressTag`：`toilet | icu | home | company` —— **4 种**（`sliceDrama.ts:31`）。
- 备注维度 `RemarkTag`：`more_spicy | less_spicy | no_cilantro | no_scold | perform | boss_thx` —— **6 种**（`sliceDrama.ts:32-39`）。
- 输入空间 = **4 × 6 = 24** 个确定组合。每个组合经 `sliceDrama` 产出一条确定链：
  - `bossMood = 50 + ADDRESS_OFFSETS[addr] + REMARK_OFFSETS[remark]`（`:302`）；
  - `band = bandOf(bossMood)`（`:281-285, :329`）→ 选 `ADDRESS_BAND_TEXT[addr][band]`（`:114-165, :331`）；
  - 备注节拍 `REMARK_BEAT[remarkTag](temp)`（`:174-213, :337-341`）；
  - 骑手台词 `RIDER_LINE[slow|fast][addr] + RIDER_ASIDE[addr][REMARK_INDEX[remark]]`（`:218-278, :342-344`）。
- **RIDER_ASIDE 不带来额外变化**：其下标 = `REMARK_INDEX[remark]`（`:237-244`），固定到备注，非逐单轮转（`:234` 注释「轮转」与实现不符——`:342-344` 用常量下标）。故每条 `(addr,remark)` 的 deliver 文案也固定。
- 结论：**全 App 至多 24 条互不相同的段子链**，且每条由 `(addr,remark)` 唯一确定。

### 2.2 确定性复现 = 新的重复疲劳形式
- 纯函数、无随机（`:296` 起，仅 DramaChat 的「逐条 reveal 时机」用墙钟，不进因果链，见文件头 `:11-13`）。→ **同一输入必然得到逐字相同输出**。
- 与 07-26 随机引擎对比：旧引擎 58 分支、仿真「单分支≥3次 28%」是概率性撞梗；现引擎**若 tester 重复同一 `(addr,remark)`，则第 2/N 次 100% 撞同一条链**——更可预期、更易归因，但也更「脆」：输入不换就必然疲劳。
- 12 单会话里：若 tester 全程换不同 `(addr,remark)`，最多现 12 条不同链（占 24 空间一半）；若反复点同一组合，则笑点瞬间耗尽。
- 注意：07-26 报告点名的「张迷路路痴梗 `rider_r003_lost` 连刷 3 次」属 legacy 分支，sliceDrama 无此人格（骑手仅按地址给 `RIDER_LINE`+`RIDER_ASIDE`），该**具体梗已消失**；但「同段子复播」这一泛化现象以确定性形式保留。

---

## 3. UI 契约可归因性（结果页 / 时间线）

| 项 | 是否暴露 | 证据 |
|---|---|---|
| 回显用户原始输入（地址标签 / 备注标签） | **是** | `OrderView.vue:404-405` 向 `DramaChat` 传 `addressChip`/`remarkChip`；`DramaChat.vue:96-113` 在结果页右侧气泡渲染「用户」的选择（emoji+label，如 🚽公厕 / 🌶️多放辣） |
| 暴露 `branch_id` / 等价切片 id | **否** | `OrderView.vue:180` 订单历史 `branchId: null`（引擎无分支概念）；`DramaChat.vue:116` 事件 `:key="i"` 用索引无稳定 id；事件仅含 `phase/actor/text/moodDelta/delay`，无切片 id |
| 显示随机种子 | **否（且无需）** | 引擎确定性、无种子概念；UI 亦不显示（仅 `OrderView.vue:145-150` `eta(seed)` 用 `shopId` 派生确定性 ETA，非种子） |

**判定**：
- 「用户做了 X（地址+备注）」在结果页**可见**，「得到 Y（段子文本）」**可见** → 单订单笑率（H1）归因**成立**，tester 能判「点公厕+多放辣 → 得到这段子」。
- 但「Y 由哪个切片产生」**无机器可读 id**，scorecard 模板的 `branch_id` 列（`docs/playtest/scorecard-template.csv:1`）在现版本只能填 `null` 或改记 `(addr,remark)` 对。**这不构成 H1 硬阻塞**（tester 看得到选择+段子即可打分），但影响「分支级」断言的数据采集。
- H2/H3（VIP/成就）所依赖的分支机制在 sliceDrama 下不存在 → 其「可归因性」问题已随功能消失而失效，需重定义门（见 §5）。

---

## 4. 产物可复现性（只读特征串比对，未真 build）

方法：取当前 `src` 中 sliceDrama 的**专属文案串**，与线上 `/waimai/assets/index-C4t84osW.js`（= 本地 `dist/assets/index-C4t84osW.js`，哈希一致）比对。

| 当前 src 专属串 | 线上 JS 命中 |
|---|---|
| 「公厕？？这地址怕是住化粪池」（sliceDrama.ts:118 · 代词中立化转写） | 1 |
| 「这味儿，导航都给标成景点了」（sliceDrama.ts:247 RIDER_ASIDE · 转写） | 1 |
| 「别骂了……行，收敛点了」（sliceDrama.ts:192 · 转写） | 1 |
| `锡哥精选段子`（OrderView.vue:415 结果页水印） | 2 |
| `toilet`（地址字面量） | 2 |
| `boss_blacklist`（legacy） | 0 |
| `priority`（legacy 优先级层） | 0 |

- 全部当前 src 逻辑串**均出现在线上 JS** → 线上产物由**当前 src 的 sliceDrama 逻辑**构建，**可复现、非幽灵构建**。
- `git log` 佐证：`sliceDrama.ts` 最后改动 `d2c896e`（2026-08-16 08:54），内容为「文档漂移校正 / 注释统一为 RIDER_ASIDE 守 R4」——**仅文档/注释、无逻辑改动**，且晚于构建 `addd873`（07:50）约 1 小时；故线上 bundle 与当前 src 逻辑等价。
- 顺带确认：线上无 `boss_blacklist`/`priority` → 确证现网跑 sliceDrama，无 legacy/priority 引擎（v1 误判的「线上缺 priority 修复」在此语境下不成立，因为 priority 本就不属于 sliceDrama）。

> **撤回 v1 结论**：v1 称「线上产物是过期/幽灵构建、priority 修复未部署」——该判断建立在对错引擎（runDrama）的假设上。在正确引擎（sliceDrama）下，线上产物与源码一致，可复现，无部署事故。

---

## 5. 修订后建议：现在能不能拉真人？

**能拉真人**（针对 H1 笑率主 KPI，CHECKLIST §0 口径：中位 ≥3.5 且 ≥60% 订单 ≥4 分 → 过）。

### 5.1 tester 需做的判定动作（产生可判定数据）
1. **变化输入覆盖 24 组合空间**：要求每位 tester 12 单内尽量换不同 `(地址, 备注)` 组合（4×6），避免重复同一组合导致「100% 撞同链」掩盖真实笑率；若有意测确定性，可单独安排「重复同一组合」对照组。
2. **scorecard 改记输入键**：模板 `scorecard-template.csv` 的 `branch_id` 列在现版本无意义，改为记录 `(addressTag, remarkTag)` 对（如 `toilet|more_spicy`）作为确定性输入键；`shop_id` 列仅作背景（引擎不消费）。
3. **诚实填 `repeat_feel`**：模板已有 `repeat_feel` 列（0/1，是否觉得「又是这套」）——这是直接度量问题①的指标；tester 复用输入时应标 1。
4. **红线仍跑**：`OrderView.vue:172` 调 `runForbiddenCheck`，`gate` 在 dev 显示（`:419-422`）；真机门继承 CHECKLIST H4 无障碍走查（sliceDrama 无自动播放音/强闪，结构性安全）。

### 5.2 需同步修订（非阻塞，建议并行）
- **H2（同店第5单 VIP）/ H3（分支成就）门作废**：sliceDrama 无 `shopVisitCount`/`vip_5th`/分支成就（成就改由 `memory` 跨单记忆产出，见 `OrderView.vue:183,192-193`，非戏剧分支驱动）→ CHECKLIST 须随引擎重定义这两道门，否则无法判定。
- 若后续要恢复「同店递进/VIP 里程碑」体验，应在 sliceDrama 之上叠加**跨单记忆驱动**的切片（如 `memory.recordOrder` 已埋点，`:192`），而非回到随机分支。

### 5.3 若要坚持「机器可读切片 id」（最小修复清单，仅列不执行）
- `sliceDrama.ts`：在 `SliceResult` 加 `sliceId: string`（如 `` `${addressTag}|${remarkTag}` ``，`:48-51`），保证确定性且可回查。
- `OrderView.vue:180`：`branchId: null` → 写入 `sliceId`，使订单历史/scorecard 可承载输入键。
- `DramaChat.vue:96-113`：在「用户」气泡追加 `sliceId` 文本（或 `title` 属性），供 tester/截图核对。
- 验证：在 `sliceDrama.test.ts` 加断言「相同输入 → 相同 sliceId；24 组合 → 24 个不同 sliceId」。

---

## 6. 给 team-lead 的明确判断

**现在能拉 8 名真人**（H1 笑率门）。07-26 的 ②③ 两条 CONCERNS 所针对的随机分支竞争引擎已被 sliceDrama 取代、原对象消失；① 以「确定性复现」形式存在、可通过 tester 变化输入规避，且结果页已回显输入、单订单可归因。唯一硬前置是：**把 scorecard 的 `branch_id` 改记 `(地址,备注)` 输入键、并作废/重定义 H2/H3 门**——这两步是数据可判定与门口径正确的必要条件，不阻断 H1 本身。
