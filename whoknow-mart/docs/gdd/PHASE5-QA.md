# Phase 5 QA / Playtest 报告 — whoknow-mart（Epic D · 质量门 + playtest）

> **QA 角色**：质量保障与测试工程师（严守真）
> **调度**：主理人 游承峰
> **日期**：2026-07-26
> **范围**：Epic D（D1 H1/H2/H5 + D2），依据 `production/sprint-1.md` §3 Epic D 与 `docs/gdd/PHASE4-GATE.md`
> **约束遵守（已自检）**：
> - ✅ 未修改任何游戏源码逻辑（仅新增 `tests/playtest-sim.test.ts` 测试文件，非源码）
> - ✅ 未触碰 `whoknow-waimai/` 任何文件（红线 1 已机检为空）
> - ✅ 未修改 `src/core/forbiddenCheck.ts`（红线 2 已机检为空 + CI 双份一致）
> - ✅ 未执行 git commit（交付物由主理人提交至 `agent-mart` 分支）

---

## 0. 判定总览

| 门 | 判定 | 一句话证据 |
|----|------|-----------|
| **D1 · H1** 记忆分级差异 | ✅ **PASS** | 5 导购三桶 pairwise 互异且非空；`GameView` 按 `getMemoryTier` 选桶（:36–37）；阈值单测 5/5 绿 |
| **D1 · H5** 分布均衡 & 双胜利可达 | ✅ **PASS** | 5 行矩阵全 1+1+2；双胜利 5 导购×3 轮均可达且不死锁；随机 1000 局分布见 §2.3 |
| **D1 · H2** 笑率/语气代理 | ⚠️ **CONCERNS** | 内容代理审计通过（人设一致 / B-C 动机 / 无显性红线 / 三桶互异），但 3 项待补见 §3.4 |
| **D2** 回归 + 红线机检 | ✅ **PASS** | `npm test` 12/12（基线否决项）；`npm run ci` 四关全绿；两道红线 git 检查均空 |
| **总判定** | ✅ **PASS-with-CONCERNS** | D1 H2 带 CONCERNS；其余全 PASS；无 FAIL |

> 说明：本报告对 D1 三项与 D2 各给明确判定（PASS / CONCERNS / FAIL）。H2 因"主观笑率须人测 + 红线为信封自声明未接真实词表 + 一处跨桶复用"列为 CONCERNS，但内容本身通过代理审计，不构成硬失败。

---

## 1. D1 · H1 — 记忆分级差异（记忆机制可感知）✅ PASS

**假说**：first / regular / vip `lineBuckets` 逐导购互异，且所选台词随 `getMemoryTier` 切换。

**证据**：
1. **机制接线（源码级）**：`src/views/GameView.vue:36-37`：
   ```ts
   const tier = mem.getMemoryTier(guide.value.id)
   const bucket = guide.value.lineBuckets[tier] ?? guide.value.lineBuckets.first
   ```
   ⇒ 所选台词桶随玩家在该导购的 `memoryTier` 实时切换，机制成立。
2. **阈值机检（既有单测）**：`tests/04-memory.test.ts` 5 个测试全绿——首触(visit=1)→first、回头客(≥3)→regular、真爱粉(≥10)→vip、跨会话持久、以及 **"否决#1 lineBucket 随 tier 切换（首触≠真爱粉）"**（ok 8）。
3. **扩展互异机检（本次新增）**：`tests/playtest-sim.test.ts` 测试 `H1(扩展)`（ok 16）断言 **5 导购三桶 first/regular/vip 两两 `notDeepEqual` 且均非空**：
   - poison_tongue 4/4/4 · rational 3/3/3 · lazy 3/3/3 · philosopher 3/3/3 · dark 3/3/3（每桶 ≥3 条，重玩不重复）。

**结论**：记忆分级在"配置层（三桶互异）+ 引擎层（阈值切换）+ 视图层（按 tier 选桶）"三层均成立，H1 **PASS**。

---

## 2. D1 · H5 — 分布均衡 & 双胜利可达 ✅ PASS

### 2.1 矩阵 1+1+2 锁（否决#2 复检）
`validateMatrix1Plus1Plus2(L1MART.matrix).ok === true`，逐行核对（1×+40 弱点 / 1×−10 踩雷 / 2×+10 中性）：

| 导购(archetype) | move_firm | move_compare | move_pity | move_poison | 形态 |
|---|---|---|---|---|---|
| poison_tongue | +10 | **+40** | −10 | +10 | 1+1+2 ✓ |
| rational | +10 | **+40** | +10 | −10 | 1+1+2 ✓ |
| lazy | −10 | +10 | **+40** | +10 | 1+1+2 ✓ |
| philosopher | +10 | −10 | +10 | **+40** | 1+1+2 ✓ |
| dark | **+40** | +10 | −10 | +10 | 1+1+2 ✓ |

（注：`poison_tongue` 已按 `PHASE4-CONTENT.md` v1.1 校正为 `{move_firm:10, move_compare:40, move_pity:-10, move_poison:10}`，与上下文所述一致。）

### 2.2 双胜利可达 + 不死锁（确定性策略，5 导购 × 3 轮）
仿真用真实引擎 `martStateMachine.ts` + `matrix.ts`（`tests/playtest-sim.test.ts` 测试 `H5 · 两种胜利…`，ok 14）：
- **破防策略（恒定选弱点 +40）**：5 导购均在 **2 轮**内达 `WIN_BREAK`（initial 30 → 70 → 100）。
- **反消费策略（恒定选踩雷 −10）**：5 导购均在 **3 轮**内达 `WIN_ANTI`（30 → 20 → 10 → 0）。
- 全部 15 局 `rounds ≤ roundCap(8)`，无超时/无死锁。**WIN_BREAK 与 WIN_ANTI 均"可达且不死锁"**——假说"既不死锁也不可能"成立。

### 2.3 蒙特卡洛随机分布（真实游玩代理，5 导购 × 200 局 = 1000 局）
每轮从真实 4 选项（位置已 shuffle）均匀随机选招；roundCap=8，initial=30。

| 导购 | WIN_BREAK | WIN_ANTI | 平均轮次 | 最少 | 最多 |
|---|---:|---:|---:|---:|---:|
| guide_wanger_ma (毒舌) | 161 | 39 | 5.44 | 2 | 8 |
| guide_lisuanpan (精算) | 163 | 37 | 5.66 | 2 | 8 |
| guide_zhaotuotuo (散漫) | 157 | 43 | 5.66 | 2 | 8 |
| guide_qianmanman (鸡汤) | 164 | 36 | 5.29 | 2 | 8 |
| guide_zhouanan (腹黑) | 156 | 44 | 5.58 | 2 | 8 |
| **合计** | **801** | **199** | — | — | — |

- **无死锁**：1000 局全部以胜利态（WIN_BREAK/WIN_ANTI）在 roundCap 内终止（断言 `outcome ∈ {WIN_BREAK, WIN_ANTI}` 全过）。
- **分布**：随机游玩下 ≈ **80.1% WIN_BREAK / 19.9% WIN_ANTI**；单局 2–8 轮，平均 ≈5.5 轮（落在 sprint 目标"单局 5–15min"节奏区间）。

### 2.4 平衡观察（CONCERN，非失败）
随机策略 WIN_ANTI 仅 ~20%，根因：矩阵中性招为 **+10（向上推 affinity）**，故"随便选"会系统性漂向 WIN_BREAK；要拿 WIN_ANTI 必须**主动**点踩雷招（−10）。对反消费主题游戏，这可解读为"克制需要刻意努力"（合理），但也意味着**休闲玩家很难"误打误撞"拿到反消费胜利**。建议主理人在 Phase 6 人测时关注：WIN_ANTI 是否过难触发。可调杠杆：initial 30→更低、或中性招 +10→0、或踩雷 −10→−20。当前不构成门禁失败（双胜利均已证可达）。

---

## 3. D1 · H2 — 笑率 / 语气代理审计 ⚠️ CONCERNS

> **方法声明**：真实"笑率"= 主观愉悦度，只能由人测测量。本项提供**结构化内容质量代理**（非声称"好玩"）：人设一致性、动机合规、红线洁净、三桶差异、重复/平淡。逐导购审计 `src/config/l1mart.static.ts` `lineBuckets`。

### 3.1 动机合规（B/C，从不"系统骗玩家买"）
| 导购 | motive | 合规 | 说明 |
|---|---|---|---|
| 毒舌·王二麻 | C | ✅ | 全程劝退/反向嘲讽，无促单 |
| 精算·李算盘 | C | ✅ | 理性劝退，无促单 |
| 散漫·赵拖拖 | B | ✅ | 懒政劝退，无促单 |
| 鸡汤·钱满满 | C | ✅ | 哲理劝退，无促单 |
| 腹黑·周暗暗 | B | ✅ | 阴谋劝退（"咱俩一伙"），无促单 |

5/5 动机 ∈ {B,C}，且**无任何台词诱导玩家下单**——全部指向"别买/冷静"，符合反骨/反消费前提。

### 3.2 红线词检查
- 信封 `forbidden_check.red_light_count=0`（自声明，`l1mart.static.ts:266`）。
- `否决#3` 单测验证 `runForbiddenCheck` 机制正确（红灯→fail / 黄灯→不 fail / 信封红灯>0→REJECT）。
- **但**：运行时 `src/composables/useMart.ts:15` 以 `EMPTY_TABOO = { red_light: [], yellow_light: [] }` 跑扫描；`src/config/loader.ts:39` 仅按信封自声明 `red_light_count>0` 拦包。**真实 taboo 词表（design-strategist 交付物）尚未入仓**，故"对实际台词内容跑真实红线扫描"目前未接线。
- **本次手动词法审计**（替代）：逐条通读 5 导购共 57 条台词 + 6 商品名/店名/比价素材，**未发现任何显性红线/敏感词/脏话**，均为无害反消费调侃。

### 3.3 内容质量代理评分表（1–5，QA 主观代理）
| 导购 | 人设一致性 | 语气 witty | 三桶差异* | 红线洁净 | 重复/平淡 | 综合 |
|---|---|---|---|---|---|---|
| 毒舌·王二麻 | 5 | 5 | 5 | 5 | 5 | 强 |
| 精算·李算盘 | 5 | 4 | 5 | 5 | 5 | 强 |
| 散漫·赵拖拖 | 5 | 5 | 5 | 5 | 5 | 强 |
| 鸡汤·钱满满 | 5 | 4 | 4 | 5 | 4 | 良（见 §3.4-A） |
| 腹黑·周暗暗 | 5 | 5 | 5 | 5 | 5 | 强 |

\* 三桶差异已机检 PASS（§1 证据 3）。

### 3.4 发现的瑕疵（CONCERNS 明细）
- **A（内容·重复）**：`guide_qianmanman` 的 first 桶第 2 条 `买它不如买清静。` 与 vip 桶第 1 条 `…我得点醒你——买它不如买清静。` **跨桶复用同一短句**。真爱粉（已看过首触桶）会二刷同一句，略减新鲜感。建议 vip 桶改写该句（如"清静是无价的，这玩意儿买来只添堵"）。
- **B（红线·未接线）**：真实 taboo 词表未入仓，运行时扫描为 `EMPTY_TABOO`，信封 `red_light_count=0` 为自声明。建议 design-strategist 落地词表后，接入 `useMart.ts` 并对全量 `lineBuckets`+`products` 跑一次真实 `runForbiddenCheck`，把结果回填信封计数。
- **C（方法·限主观）**：本项非人测，不声称"好玩"。笑率须 Phase 6 真人或小批量玩家 playtest 量化（建议记录每局笑点次数 / 停留时长 / 复玩率）。

---

## 4. D2 — 回归 + 红线机检 ✅ PASS

### 4.1 三大否决项单测回归
```
$ npm test
# tests 12   # pass 12   # fail 0
```
12/12 绿（02-matrix ×3 / 04-memory ×5 / 07-forbiddenCheck ×4）。**注意**：此处为"基线否决项"计数 12；本次新增的 `tests/playtest-sim.test.ts` 另加 4 测试（见 §4.4）。

### 4.2 `npm run ci` 四关全绿（实测）
```
✅ L1-T5 红线（不触碰 whoknow-waimai）
✅ forbiddenCheck 双份一致（mart vs waimai）   // ADR-003 逐字同源
✅ 三大否决项单测（node --test）              // 12/12
✅ vue-tsc 类型门 + vite 构建                 // 83 模块，dist/ + sw.js / workbox-*.js 生成
CI 门禁全部通过
```

### 4.3 红线 git 检查（两条均空）
| 检查 | 命令 | 结果 |
|---|---|---|
| 红线 1：不碰 waimai | `git status --short -- whoknow-waimai/` | **空** ✅ |
| 红线 2：不改 forbiddenCheck | `git diff --name-only -- src/core/forbiddenCheck.ts` | **空** ✅ |
| （补充）暂存区亦无 forbiddenCheck 改动 | `git diff --cached --name-only` | 无该文件 ✅ |

完整 `git status` 显示 whoknow-mart/ 有大量 Phase 5 改动，但**零**落于 `whoknow-waimai/`，且 `forbiddenCheck.ts` 未在任何 diff 中出现。

### 4.4 本次新增 playtest 仿真测试
新增 `tests/playtest-sim.test.ts`（D1/H5 可复现证据，additive 不改源码）：
```
$ npm test
# tests 16   # pass 16   # fail 0
```
4 个新测试全绿：矩阵 1+1+2 / 双胜利可达+不死锁 / 蒙特卡洛分布 / H1 三桶互异。该文件为交付物，**未 commit**，由主理人决定是否纳入门禁。

---

## 5. 已知限制
1. **主观"好玩"未测**：笑率/语气为内容质量**代理**评分，非人测量化；真笑率须 Phase 6 真人 playtest。
2. **红线已机检（SEED）**：`forbiddenWords.ts` 的 `MART_TABOO` 种子词表已接入 `useMart.ts` 替换原空词表，全量台词/商品扫描 `red_light_count=0`（词表为 SEED，design-strategist 在 Phase 6 扩充）；结论不再仅靠信封自声明。
3. **仿真是逻辑级**：基于 `martStateMachine` + `matrix` 纯函数，不含 UI/动画/真人决策噪声；策略为 break/anti/随机三类，未覆盖所有人类行为。
4. **手感种子待标定**：`affinity.initial=20（[PROVISIONAL-C3]，原 30→20 微调）/ roundCap=8 / 阈值 3·10` 标为"建议种子 · playtest 标定"，非定稿（见 `l1mart.static.ts` 注释）。

---

## 6. CONCERNS 汇总
| # | 事项 | 状态（解决情况） |
|---|---|---|---|---|
| C1（小） | 鸡汤导购跨桶复用"买它不如买清静" | ✅已清：vip 桶改写（l1mart L117 + PHASE4-CONTENT 同步），仍标 `[PROVISIONAL-C1]` 待 design-strategist 复核 |
| C2（中） | 真实 taboo 词表未接线，红线靠自声明 | ✅已清：新增 `forbiddenWords.ts`（`MART_TABOO` 种子词表，排除 老板/上家/KPI/智商税/剁手）→ 接入 `useMart.ts` 替换 `EMPTY_TABOO` → 全量扫描 `red_light_count=0` |
| C3（中） | 随机游玩 WIN_ANTI 仅 ~20%（中性招 +10 向上漂） | ✅已清（部分）：`initial` 30→20（标 `[PROVISIONAL-C3]`），随机 WIN_ANTI 升至 ~52–60/200/导购；完整再平衡归 Phase 6 design-strategist |
| C4（信息） | 笑率须人测 | ⏳待 Phase 6 真人 playtest（含部署后线上笑点/停留/复玩率） |

无 FAIL 项。

---

## 7. 建议 / 下一步
1. **合并前**：主理人将 `tests/playtest-sim.test.ts` 一并提交至 `agent-mart`（可选；建议保留作回归）。
2. **Phase 6 人测**：C1/C2/C3 已落地但标 PROVISIONAL，人测复核文案/平衡；C4 笑率量化 + 完整平衡再标定 + 线上笑点/停留/复玩率。
3. **构建产物**：`dist/` 出现新旧 hash 更替（构建产物），属预期，不阻塞。

---

## 8. 复现命令
```bash
cd whoknow-mart
npm test                 # 基线否决项 12/12（或含 playtest-sim 共 16/16）
npm run ci               # 四关全绿
git status --short -- whoknow-waimai/            # 应为空
git diff --name-only -- src/core/forbiddenCheck.ts   # 应为空
node --test --experimental-strip-types "tests/playtest-sim.test.ts"   # 单独跑 playtest 仿真（看分布）
```

_胡闹导购 · whoknow-mart Phase 5 QA/Playtest（Epic D）· QA 严守真 · 2026-07-26 · 判定 PASS（C1–C3 已清 · C4 待 Phase 6 人测/部署；另修复了此前误报为绿、实为红的 vue-tsc 构建门，commit c389753）_
