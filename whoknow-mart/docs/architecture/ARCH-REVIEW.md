# 🛒 胡闹导购（whoknow-mart）· Phase 3 架构评审（ARCH-REVIEW）

> **版本**：v1.0 · 2026-07-26 · eng-lead（程基岩）
> **评审对象**：Phase 2 产出（`00-CONCEPT.md` / `00-SYSTEMS-INDEX.md` / `01`~`08` GDD / `REVIEW.md` / `PHASE2-GATE.md`）→ 对照本架构基线（`ARCHITECTURE.md` + `adr/ADR-001..003`）
> **评审目标**：确认 GDD 的架构可落地性，逐门核对，标记 PASS / CONCERNS，列出实现风险与未决项。
> **上游权威**：同 `ARCHITECTURE.md` §11 引用索引。

---

## 1. 逐门核对（G-1 ~ G-8）

| 门 | Phase 2 判定 | 架构基线落地确认 | 结论 |
|---|---|---|---|
| **G-1 支柱一致** | ✅ P1–P6 全落点 01–08 | 分层(§1)/DAG(§2) 明确 P1=04 记忆、P2=06/08、P3=03/04、P4=02/06、P5=05、P6=01；ADR-001 自建状态机不破坏 P4 | **PASS** |
| **G-2 契约零冲突** | ✅ 复用零改写，EVOL 标注 | ADR-003 零改写消费 + 复制解析器不 fork；mart 自建只落 `mart` 键（§4.2）；L1-T4/L1-T5 落 CI 门禁（§7） | **PASS** |
| **G-3 红线 0 漏出** | ✅ forbidden_check 横切 | 07 横切接线落 `core/forbiddenCheck.ts` + UI 渲染前门（§6.1）；红灯整包拒→L4 | **PASS** |
| **G-4 双重胜利** | ✅ 双赢均 success | 状态机 WIN_BREAK/WIN_ANTI 均 success；03 禁止红叉（§3.2）；ART-BIBLE §2.4 语义色 | **PASS** |
| **G-5 否决机检** | ✅ #1/#2/#3 可机检 | CONTROL-CHECKLIST §2 给 04/02/07 的单元测试/扫描点（martStateMachine.test / matrix.test / memory.test / forbiddenCheck.test） | **PASS** |
| **G-6 乐趣可证伪** | ✅(设计层) | 架构不阻 playtest；MVP 纯前端可独立跑垂直切片（§9.1） | **PASS** |
| **G-7 范围清晰** | ✅ MVP 纯前端 | §0.1/§9.1 明确不接 brain、不产 DramaEvent、不造 AI；数值全 `[待测试]` | **PASS** |
| **G-8 视觉锚点** | ✅ ART-BIBLE 被引用 | §5.1 style.css 复制 waimai `:root` + 追加 `--mart-host`；C3 令牌分区（§8.1 一致性） | **PASS** |

> **结论**：G-1~G-8 在架构层**全部 PASS**，质量门 PASS-with-CONCERNS 维持，不阻断 Phase 4。

---

## 2. CONCERNS 带入 Phase 3（来自 PHASE2-GATE §2/§3，逐项确认）

| # | Phase 2 CONCERN | 架构基线处置 | 状态 |
|---|---|---|---|
| C1 | **EVOL-1** actor+guide 阻塞 waimai 侧 | §9.2 预留 `MartEventSource` 适配器 + 「未知枚举容错跳过」；MVP 不产 DramaEvent，无阻断 | 🟡 待协调（不阻 MVP） |
| C2 | **D1** archetype 中文→规范英文 id | 全基线采用 C2 规范 id（poison_tongue 等），`types/contract.ts` 单点定义 | ✅ 已吸收 |
| C3 | **D2** 矩阵 2+2 → 规范 1+1+2 | §3.3 矩阵查表采用 1+1+2；matrix.test 扫描否决#2 | ✅ 已吸收 |
| C4 | **EVOL-2/3/6** 共享注释 | §10 登记为协调项；mart 侧只留类型占位 + TODO，不抢先落地 | 🟡 待 waimai 协调（不阻 MVP） |
| C5 | **art/ + contract/ 未纳管** | 已落 `agent-mart`（PHASE2-GATE §3）；本基线新文档亦归 `docs/architecture/` | ✅ 已补 |

---

## 3. 架构层新增风险（Phase 3 评估发现）

| 风险 | 性质 | 缓解（归架构/实现） | 严重度 |
|---|---|---|---|
| **R1 · waimai 文件被误改** | 红线 L1-T5 | CI 门禁检测 `whoknow-waimai/` 变更即失败（§7）；mart 模块零 import waimai 源码 | 🔴 高（守门） |
| **R2 · 解析器双份维护漂移** | 一致性 | `forbiddenCheck.ts` 复制同源；CI 加「两文件 diff 一致」告警（ADR-003 §3） | 🟡 中 |
| **R3 · 记忆键前缀误用** | 数据污染 | `MART_KEY_PREFIX='whoknow:mart:'` 常量单点 + lint 防呆（ADR-002 §3） | 🟡 中 |
| **R4 · 双胜利误渲染红叉** | 视觉红线 #5 | 状态机只产 success；BreakMeter/ResultCard 禁 error 态；视觉自检（03 §5） | 🔴 高 |
| **R5 · 矩阵手感未标定** | 乐趣假说 | 数值全 `[待测试]`，playtest 前禁硬编码（L1 draft §3/DATA-STRUCTURE §9）；否决#2 机检兜底 | 🟡 中 |
| **R6 · PWA 离线破坏水印分离** | 红线 D3 | service worker 仅预缓存产物；水印组件独立，不进弹层/结局卡（§8.3） | 🟢 低 |
| **R7 · v2 接 brain 适配器断裂** | 演进 | `MartEventSource` 接口在 MVP 即定义，LocalMatrixSource 先实现（§9.2） | 🟢 低 |

---

## 4. 未决项 / 待主理人协调（阻断 v2，不阻 MVP）

| 项 | 处理方 | 说明 |
|---|---|---|
| EVOL-1 枚举扩展 `guide` | waimai 主责人（DuckyPC） | 见 `docs/contract/EVOL-1-guide-enum-request.md`；落地后 mart v2 适配器启用 |
| EVOL-2/3/6 共享注释 | waimai 主责人协调 | DATA-STRUCTURE-v1 加 mart 语义注释（注释层，无 schema 变更） |
| 数值标定（initial/delta/roundCap/vip 阈值/记忆分级阈值） | playtest（Phase 6） | 全部 `[待测试]`，架构不预设；机检否决项先验结构不验数值 |
| EVOL-5 填 `mart`/`fallback.mart` 信封 | M1-a（mart 主责人） | MVP 以静态 `L1.mart` 手写信封替代，无阻断 |
| 根 `build-for-vercel.js` 增补 mart 构建 | 主理人/DevOps | 当前只构建 waimai；Phase 4 须补（§8.2），且不破坏 waimai 产物 |

---

## 5. 架构对「坏长什么样」的承接（否决标准可机检性）

| 否决项（00-CONCEPT §6.4） | 架构承接模块 | 机检落点（详见 CONTROL-CHECKLIST §2） |
|---|---|---|
| **#1 记忆失效**（同导购第≥5 次无差异） | 04 记忆分级 + store/memory | `memory.test.ts`：同 guideVisit≥5 时 lineBucket/tier 切换断言 |
| **#2 矩阵崩坏**（全 +40 / 全 −10） | 02 状态机 + core/matrix | `matrix.test.ts`：每导购矩阵扫描，禁止某轮 4 选项同值 |
| **#3 配置污染**（红线词出现） | 07 forbidden_check | `forbiddenCheck.test.ts`：red_light_count>0 整包拒断言 + 横切接线 |

---

## 6. 总结

- G-1~G-8 在架构层**全 PASS**，质量门结论维持 PASS-with-CONCERNS。
- Phase 2 的 CONCERNS（D1/D2 已吸收；EVOL-1/2/3/6 登记为不阻 MVP 的协调项）已在本基线逐项承接。
- 架构层新增 7 项风险（R1~R7），其中 R1（waimai 红线）/ R4（双胜利红叉）为高严重度，已由 CI 门禁 + 状态机约束守住。
- 未决项均**只阻断 v2、不阻断 MVP**；MVP 可凭静态 `L1.mart` 信封独立进入 Phase 4 冲刺。

---

_whoknow-mart · Phase 3 架构评审 v1.0 · eng-lead（程基岩）· 2026-07-26 · 待主理人汇编落 `agent-mart`（不推 main）_
