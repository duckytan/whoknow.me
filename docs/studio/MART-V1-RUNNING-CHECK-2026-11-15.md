# MART V1 跑通 · 正式验证核查（金克木闸门第二道前置）

- 日期锚：2026-11-15
- 执行机：701-PC（Agent-商城）
- 执行角色：严过关（Yan）· QA 工程师 · 纯核查（只读 + 跑测试/构建，未改任何源码，未做 git 提交）
- 核查对象：`whoknow-mart`（部署于 https://www.whoknow.me/mart/ ）
- 闸门上下文：`whoknow-workbench/public/data/metrics.json` `governance.gate` 二前置 = ①waimai 真机 playtest PASS（另一道前置，DuckyPC 侧，不在本报告判定范围内）②mart v1 跑通验证（本报告判定对象）

---

## 一、核查项结果总表

| # | 核查项 | 判定 | 关键证据 |
|---|--------|------|----------|
| 1 | 测试全绿 | **PASS** | 16 tests / 16 pass / 0 fail / 0 skipped（2026-11-15 实测，见 §二） |
| 2 | typecheck + build | **PASS** | `vue-tsc --noEmit` exit 0；`vite build` 成功（89 modules，8.04s），未触发 dist 守卫拦截 |
| 3 | 矩阵机检 1+1+2 | **PASS** | `validateMatrix1Plus1Plus2` ok=true，errors=[]；5×4 delta 表见 §四；无全同值轮次 |
| 4 | 保底轮次 reachesBreak | **PASS** | initial=20 / max=100 / roundCap=8，5 型全部 reachesBreak=true，恒打弱点招 2 轮即破防 |
| 5 | 线上 = 最新构建 | **PASS** | 线上 index.html 引用 `index-7eK1Vg5A.js` + `index-Bs3e1YRz.css`，与 2026-11-15 本地构建产物同名、同字节数、`cmp` 逐字节一致；4 条特征文案串全部命中 |
| 6 | PROVISIONAL 清单 | **记录**（非 FAIL 项） | src/ 零标记；docs/ 共 2 个独立标记（C1 文案 / C3 数值），占 5 处文档行，见 §七 |
| 7 | 红线运行时生效 | **PASS** | `runForbiddenCheck` 运行时调用点：`src/composables/useMart.ts:27`；信封级红灯门控：`src/config/loader.ts:39`，见 §八 |

---

## 二、核查项 1：测试全绿（PASS）

命令（whoknow-mart/ 下）：`npm test`（= `node --test --experimental-strip-types "tests/*.test.ts"`，Node v22.22.2）

TAP 统计尾部：

```
1..16
# tests 16
# pass 16
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1889.5908
```

各测试文件覆盖点（文件 · 行号 · 用例名）：

- `tests/02-matrix.test.ts`（3 用例）
  - :18 每个导购矩阵 = 规范 1+1+2（禁止全同值轮次）
  - :30 每导购必存在可达破防态路径（保底轮次）
  - :39 矩阵崩坏（全 +40）应被机检捕获
- `tests/04-memory.test.ts`（5 用例）
  - :14 首触(visit=1) → memoryTier=first
  - :20 回头客(visit>=3) → memoryTier=regular
  - :26 真爱粉(visit>=10) → memoryTier=vip
  - :34 guideVisit 跨会话持久（whoknow:mart: 前缀隔离）
  - :41 lineBucket 随 tier 切换（记忆机制可感知差异）
- `tests/07-forbiddenCheck.test.ts`（4 用例）
  - :19 红灯词 → redLightCount>0 → pass=false
  - :25 黄灯词 → 不触发红灯，但记 yellow
  - :31 信封 forbidden_check.red_light_count>0 → 整包拒绝（不返回敏感内容）
  - :41 信封红灯=0 → 正常放行（取 mart 子树）
- `tests/playtest-sim.test.ts`（4 用例）
  - :112 每个导购矩阵严格 1+1+2（1×+40 / 1×−10 / 2×+10）
  - :124 两种胜利 WIN_BREAK / WIN_ANTI 均可在 roundCap 内达成，且 5 导购×3 轮均不死锁
  - :141 蒙特卡洛随机策略下 5 导购×200 局分布（无死锁，全以胜利态终止）
  - :175 5 导购 lineBuckets 三桶(first/regular/vip) 两两互异且均非空

---

## 三、核查项 2：typecheck + build（PASS）

- `npm run typecheck`（vue-tsc --noEmit）：exit 0，无输出（零类型错误）。
- `npm run build`（vue-tsc --noEmit && vite build）：exit 0。
  - 产物：`dist/index.html`、`dist/assets/index-7eK1Vg5A.js`（122.21 kB）、`dist/assets/index-Bs3e1YRz.css`（14.78 kB）、`dist/assets/workbox-window.prod.es5-BqEJf4Xk.js`（5.71 kB）、`manifest.webmanifest`、`sw.js`、`workbox-9c191d2f.js`
  - PWA generateSW：precache 5 entries（142.81 KiB）
  - 无构建警告；dist 批量删除守卫未被触发（vite 直接清写成功，无需手动分批删 dist）

---

## 四、核查项 3：矩阵机检（PASS）

配置实际路径：`whoknow-mart/src/config/l1mart.static.ts`（任务单所写 `whoknow-mart/config/` 路径不存在，实际在 `src/config/`）。

机检方式：临时脚本 `.tmp/qa-matrix-check.ts`（Node `--experimental-strip-types`）直接 import `src/core/matrix.ts` 的 `validateMatrix1Plus1Plus2` + `src/config/l1mart.static.ts` 的 `L1MART.matrix`，delta 表由 config 实值导出（非抄文档）。

- `validateMatrix1Plus1Plus2(L1MART.matrix)` → `ok = true, errors = []`

5×4 实际 delta 表（行 = archetype，列 = move，值 = config 原值）：

| archetype | move_firm | move_compare | move_pity | move_poison |
|---|---|---|---|---|
| poison_tongue | +10 | **+40** | −10 | +10 |
| rational | +10 | **+40** | +10 | −10 |
| lazy | −10 | +10 | **+40** | +10 |
| philosopher | +10 | −10 | +10 | **+40** |
| dark | **+40** | +10 | −10 | +10 |

崩坏检查：5 行逐行统计 delta 去重后均 >1（恰为 {+40, −10, +10} 三值），不存在「任一轮 4 选项全 +40 / 全 −10」的崩坏可能；且 4 招标签（原文见 `src/config/l1mart.static.ts` moves 块 L154–157）与弱点-踩雷映射经 `hiddenWeakness` / `thunderMine` 字段逐一对应。

---

## 五、核查项 4：保底轮次（PASS）

Phase 5 确认 `initial` 实际值 = **20**（`src/config/l1mart.static.ts` `affinity` 块：`initial: 20, min: 0, max: 100, roundCap: 8`；config 注释标「建议种子 · playtest 标定」；PROVISIONAL-C3 标记见 docs，见 §七）。

`reachesBreak(matrix, arch, initial=20, max=100, roundCap=8)` 机检结果（临时脚本实测，逐型）：

| archetype | reachesBreak | 恒打弱点招(+40/轮)所需轮数 |
|---|---|---|
| poison_tongue | true | 2 |
| rational | true | 2 |
| lazy | true | 2 |
| philosopher | true | 2 |
| dark | true | 2 |

结论：initial=20 起、每轮打弱点招，全部 5 型均在 roundCap=8 内（实际 2 轮）达到 max=100 破防态；与 `tests/playtest-sim.test.ts` 的蒙特卡洛 200 局无死锁用例互为印证。保底成立，玩家不可能被无限拖延。

---

## 六、核查项 5：线上冒烟（PASS）

1. `curl -s https://www.whoknow.me/mart/` → 线上 index.html 引用：
   - JS：`/mart/assets/index-7eK1Vg5A.js`
   - CSS：`/mart/assets/index-Bs3e1YRz.css`
2. 与 2026-11-15 本地 `npm run build` 产物对比：
   - hash 同名：线上引用 hash 与本地构建产物文件名完全一致（index-7eK1Vg5A.js / index-Bs3e1YRz.css）
   - 字节数：JS 双方 125,231 bytes；CSS 双方 14,779 bytes
   - `cmp` 逐字节比对：JS identical / CSS identical → **线上 = 最新构建**
3. 特征文案串抽验（在 `src/config/l1mart.static.ts` 选取，于线上 bundle grep 命中）：
   - 「别交智商税」（毒舌 regular 桶）→ 命中 1 次
   - 「购物车是欲望的镜子」（鸡汤 regular 桶）→ 命中 1 次
   - 「能测前任心跳的枕头」（商品 prod_001）→ 命中 1 次
   - 另 1 条毒舌 vip 桶台词 → 命中 1 次（台词含人称代词，报告正文不转录原文）

---

## 七、核查项 6：PROVISIONAL 清单

全仓 grep `PROVISIONAL`（含 src/ 与 docs/，排除 node_modules）：**src/ 与 config 中零标记**；docs/ 中 2 个独立标记，共占 5 处文档行：

| 标记 | 位置 | 待什么数据复核 |
|---|---|---|
| `[PROVISIONAL-C1]` | `docs/gdd/PHASE4-CONTENT.md:122`；`docs/gdd/PHASE5-QA.md:176` | 鸡汤导购 vip 桶台词改写（原「买它不如买清静」跨桶复用问题）：待 design-strategist 对改写稿做文案终审 blessing |
| `[PROVISIONAL-C3]` | `docs/gdd/PHASE4-CONTENT.md:222`；`docs/gdd/PHASE5-QA.md:169`；`docs/gdd/PHASE5-QA.md:178` | `affinity.initial=20`（原 30→20 微调，使随机局 WIN_ANTI 占比升至约 52–60/200/导购）：待 Phase 6 design-strategist 完整再平衡标定（笑率 + 胜任感数据） |
| 引用行 | `docs/gdd/PHASE5-QA.md:187` | Phase 6 人测计划段落，引用上述 C1/C3 标记，非独立标记项 |

统计口径：独立 PROVISIONAL 标记 = **2 项**（C1 / C3）；均属内容/手感层，等待 Phase 6 人测数据，不影响「v1 跑通」工程判定。

---

## 八、核查项 7：红线运行时生效（PASS）

`runForbiddenCheck` / `MART_TABOO` 不止被测试引用，运行时链路调用点如下：

| 调用点 | 文件:行号 | 说明 |
|---|---|---|
| 运行时扫描函数 | `src/composables/useMart.ts:12`（import）→ `src/composables/useMart.ts:27` | `scanTexts()` 内调用 `runForbiddenCheck(texts, MART_TABOO)`，由 `useMartGate()` 导出 |
| UI 层消费 | `src/App.vue:4,6` | App 根组件调用 `useMartGate()`（模块随应用启动加载） |
| UI 层消费 | `src/views/HomeView.vue:7,10` | Home 视图取 `scanTexts` 供实时红线扫描演示 |
| 信封级红灯门控 | `src/config/loader.ts:39-43` | `env.forbidden_check.red_light_count > 0 → 整包拒绝`；该 loader 在 `useMart.ts:17` 模块加载时即执行 |
| 词表 | `src/config/forbiddenWords.ts:17` | `MART_TABOO` 种子词表（red_light 22 词 / yellow_light 10 词，'1.0-seed'，待 design-strategist 扩写） |

---

## 九、「mart v1 跑通」验收定义提案（可复用清单）

以下 8 条即后续版本复用的判定清单；括注为 2026-11-15 本次实测结果：

1. **测试全绿**：`npm test` 0 fail / 0 skipped（2026-11-15：16/16 PASS）
2. **typecheck 绿**：`npm run typecheck` exit 0（2026-11-15：PASS）
3. **build 成功**：`npm run build` exit 0 且产物齐全（2026-11-15：PASS）
4. **线上 = 最新构建**：线上 index.html bundle hash 与本地最新构建同名 + 字节/逐字节一致 + 特征文案串命中（2026-11-15：JS/CSS 均 cmp identical，4 串命中）
5. **矩阵机检通过**：`validateMatrix1Plus1Plus2` ok=true，无全同值轮次（2026-11-15：PASS）
6. **保底轮次通过**：`reachesBreak` 全型 true 且轮数 < roundCap（2026-11-15：5 型均 true，2 轮 < 8）
7. **红线运行时生效**：`runForbiddenCheck` 有 UI 链路调用点 + loader 红灯门控在模块加载执行（2026-11-15：PASS）
8. **核心循环可走通**：引擎级以 `playtest-sim` 蒙特卡洛 200 局无死锁 + 双胜利态可达为机检等价（2026-11-15：PASS）；真人 UI 走查未列入本核查，归 Phase 6 C4

判定规则：1–7 全 PASS 且 8 有机检等价证据 → **v1 跑通 = PASS**。

### 最终判定

> **mart v1 跑通 = PASS（2026-11-15，701-PC）**

写明边界：**跑通 ≠ 好玩**。本判定只证明工程链路（测试/构建/部署/数值机检/红线门控）成立；笑率、文案手感、平衡定稿均归 Phase 6 C4 人测，PROVISIONAL-C1/C3 依 §七清单届时复核。金克木 gate 仍差第一道前置（waimai 真机 playtest，DuckyPC 侧），gate 状态不得因此报告翻转。

---

## 十、遗留与风险清单

1. **[等待] waimai playtest 前置**：金克木 gate 第一道前置在 DuckyPC 侧卡关；gate.status 仍 false，16 个候选继续冻结。
2. **[PROVISIONAL-C3] initial=20 非定稿**：随机局 WIN_ANTI 约 52–60/200/导购为部分再平衡结果；数值定稿待 Phase 6（风险：若回调 initial，本报告 §五轮数结论需重跑机检——机检为幂等脚本，重跑成本低）。
3. **[PROVISIONAL-C1] 鸡汤 vip 桶台词**：待 design-strategist 文案终审。
4. **[SEED] 红线词表为种子版**：`forbiddenWords.ts` version '1.0-seed'，词表扩写是 design-strategist 交付物；管线已通但词表覆盖面未终审。
5. **[待办] 核心循环真人 UI 走查**：本次以蒙特卡洛机检等价替代，无真人逐步点验记录；Phase 6 C4 补。
6. **[环境备注] Node 版本路径漂移**：任务单给出的 node 路径 `22.22.2-2` 于 701-PC 不存在，实际使用 PATH 上的 v22.22.2（`22.22.2-6` 目录）；后续任务单建议写「Node >=22」而非绝对路径。
7. **[口径备注] 配置路径**：任务单所写 `whoknow-mart/config/l1mart.static.ts` 实际为 `whoknow-mart/src/config/l1mart.static.ts`；引用时以 src 路径为准。
8. **[诚实声明] 跑通边界**：WIN_ANTI/WIN_BREAK 的「好玩度」、台词笑点密度无量化数据，Phase 6 C4 笑率人测是唯一裁决来源。

---

*核查执行：严过关（Yan）· QA 工程师 · 2026-11-15 · 701-PC · 只读核查（未改源码、未 git 提交）*
