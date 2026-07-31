# 胡闹大脑 · Phase 3 启动交付（M0–M2 手动阶段）

> **作者**：engineering-lead 程基岩 · **日期**：2026-07-31
> **范围**：**仅 M0–M2 手动阶段**。明确不含 M3 自动化（cron / 审核台 UI / 反馈回传闭环 / 进化闭环 / RAG 激活）。
> **配套文档**：
> - 数据契约映射 → `docs/architecture/data-contract-v1.md`（B1）
> - 架构评审 ADR 基线 → `docs/architecture/brain-architecture-review.md`（v1.1）
> - 设计锁闸基线 → `docs/BRAIN-PLAN.md`（含阶段声明）
> - 对外规范 → `docs/api-spec.md`（实际生效 v2.2）
> **验证状态**：✅ 测试 44/44 通过 · ✅ `tsc --noEmit` 0 错 · ✅ `npm run demo:store` 跑通（I1/I3/I4 现场演示）

---

## 0. 一句话结论（给产品主理人）

> 我们**先把"装段子的柜子"和"段子出库时的安检门"造好了**，并证明它们能在本地独立跑通，不需要任何服务器或云服务。柜子按"只增不删、每改一版都留底、坏了能一键重建"的铁律造；安检门按"红灯零容忍、旧版也可能有毒要能拉黑、知识产权绝不出本地"的原则造。业务生成段子的逻辑（AI 怎么写段子）**本期一个字没写**——那是后面自动阶段的事。下一步可以放心开始往柜子里放公式、把手动审核流程接上。但有 6 个待你拍板的小决策（U1–U6），不拍板也能先写代码，但定了能少返工。

---

## 1. 里程碑定标（开工前的坐标）

依据 BRAIN-PLAN "阶段声明" + 架构评审 §1.8，把"动代码"钉死在 M0–M2：

| 阶段 | 大脑形态 | 后端/cron | 审核台 | 反馈回传 | 自我进化 | 本期是否构建 |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **M0–M2** | 主理人**手动**配置 | ❌ | ❌（开文件批注落盘） | ❌ | ❌ | ✅ **本期** |
| **M3+** | **自动化** | ✅ | ✅ UI | ✅ 闭环 | ✅ | ❌ 不在本期 |

**本期可建**（架构评审已判定）：ADR-001 存储 / ADR-003 手动部署回退 / B1 数据契约对齐 / S2 撤回接口预埋 / S3 质量信号位 / 纯点击约束。
**本期不建**（属 M3）：ADR-002 cron / ADR-004 上行反馈 / 审核台 UI / 进化闭环 / RAG 激活。

---

## 2. Epic / Story 拆分（M0–M2 仅）

> **就绪标志图例**：✅ 现在可编码（接口/决策已定）｜🟡 需先决用户决策（U1–U6）｜⛔ 属 M3，不在本期。
> 每条 Story 含**验收标准**与**测试证据路径**（验证驱动，先写测试再实现）。

### Epic A · 存储地基（ADR-001）— ✅ 主体已落地骨架

| Story | 标题 | 验收标准 | 就绪 | 测试证据 |
|---|---|---|---|---|
| A1 | VersionedStore 通用版本化内核 | ① 新建 v1、改=addVersion 旧版保留；② 记录文件 `'wx'` 独占，覆盖抛 IMMUTABILITY_VIOLATION；③ `rebuildIndex` 可从 records+events 完全重建；④ 读时校验 checksum（I4） | ✅ | `src/storage/versionedStore.test.ts` V1–V6、S-SEC |
| A2 | FormulaRepo 公式库 | ① 落 BRAIN-PLAN ① 字段（ID/版本/创建时间/状态/可解释单元）；② 预埋 B2 反差轴（anchor/offset/intensity）；③ `ref()` 只返 `ID@版本`；④ `stats()` 含 A→B 切换规模阈值 200 | ✅ | `src/storage/formulaRepo.test.ts` F1–F6 |
| A3 | KnowledgeRepo 知识库 | ① 落 ③ 6 维权重（命中率/时效/相关/权威/稳定/梗性）；② **tier 作元数据字段而非物理分层目录**（ADR-001-A 决策，保 append-only + 崩溃安全）；③ `listByTier` 可按元数据查 | ✅（U1 路径命名） | `src/storage/knowledgeRepo.test.ts` K1–K5 |
| A4 | 文件原语与工程不变量 | ① I1 独占创建；② I2 原子写；③ I3 派生可重建；④ I4 内容校验和；⑤ I5 零业务语义 | ✅ | `src/storage/fsx.test.ts` X1–X6 |

### Epic B · 数据契约与 IP 边界（B1 / ADR-004 下行）— ✅ 已落地骨架

| Story | 标题 | 验收标准 | 就绪 | 测试证据 |
|---|---|---|---|---|
| B1 | Envelope 对齐 api-spec v2.2 | ① 12 顶层字段对齐（含 food.branches / ui_meta.watermark）；② `validateEnvelopeShape` 返回问题清单；③ `version` 正则 + 水印 placement 只 footer | ✅ | `src/contracts/envelope.test.ts` E1–E8 |
| B2 | 本地→公开投影 + IP 白名单 | ① `projectToPublicEnvelope` 只放行 12 公开键；② 溯源只留 `ID@版本`；③ provenance 中 pattern/原文/prompt **绝不**出现在 envelope 任何层级 | ✅ | `src/contracts/production.test.ts` P1–P9（IP 泄露红线路由） |
| B3 | 校验和 + 结构校验 | ① `content_checksum` 排除自身可复算；② `verifyEnvelopeChecksum` 比对；③ 结构非法即列问题 | ✅ | `production.test.ts` + `envelope.test.ts` |

### Epic C · 发布准入与回退闸门（ADR-003 / S2）— ✅ 已落地骨架

| Story | 标题 | 验收标准 | 就绪 | 测试证据 |
|---|---|---|---|---|
| C1 | 发布准入 gate | ① 契约非法→block；② 红线 `red_light_count>0`→block；③ 风险≥4 需 approved；④ rejected 永不部署；⑤ 质量信号 M0–M2 允许 null | ✅ | `src/release/gate.ts`（待补测试 → 见阻塞项） |
| C2 | ReleaseManifest + 校验 | ① `addRelease` 不可变；② `findEntry`/`verifyArtifact` 校验和断言 | ✅ | `src/release/manifest.ts`（待补测试） |
| C3 | Revocation 失效清单预埋 | ① `revoke`/`isRevoked`/`listServable` 纯函数无网络；② 降级跳过 revoked | ✅（U5 触发逻辑 M3） | `src/release/revocation.ts`（待补测试） |

### Epic D · 手动生成管线骨架（M0 手动触发）— 🟡 需决策 + 不写业务

| Story | 标题 | 验收标准 | 就绪 | 备注 |
|---|---|---|---|---|
| D1 | 手动 pending 文件 → latest-config 落盘 | ① 锡哥开 `pending-config-{date}.md` 批注；② 整理成 Envelope；③ 过 C1 gate；④ 落 `brain-output/config-{date}.json` | 🟡（U4 流程细节） | **不含 LLM 生成逻辑**（M3 业务）；本期只搭"读已审内容→投影→过闸→落盘"骨架 |
| D2 | 最小可运行 demo | 已交付：`npm run demo:store` 演示 A1 全链路 | ✅ | `src/demo/formula-store-demo.ts` |

### Epic E · 测试框架脚手架 — ✅ 已交付

| Story | 标题 | 验收标准 | 就绪 |
|---|---|---|---|
| E1 | node:test + --experimental-strip-types 配置 | `npm test` = `node --test --experimental-strip-types "src/**/*.test.ts"`；**绝不** `npx vitest` | ✅ |
| E2 | 临时数据根 + 夹具 | `src/testing/tmpdir.ts`（自动清理）+ `src/testing/fixtures.ts`（形状夹具 + IP 标记） | ✅ |
| E3 | 44 项测试覆盖 I1–I5 / S-SEC / IP 边界 | 全绿 | ✅ |

### Epic F · 手动部署脚手架（ADR-003 下行）— 🟡 需决策

| Story | 标题 | 验收标准 | 就绪 |
|---|---|---|---|
| F1 | 本地 JSON → 推 Vercel 不可变部署 | 写本地 → 推 Vercel（新部署）→ 写 manifest（version+checksum）；生成失败不发布 | 🟡（U2 部署目标） |
| F2 | 一键回退 | Vercel 部署回退 + manifest 原子更新 | 🟡（U2） |

### 不在本期（M3，仅列清边界，防误排）

- ADR-002 定时编排与多 cron 失败隔离
- ADR-004 上行反馈回传（云端收集点 + 大脑拉取）
- 审核台 UI（要素④同类历史依赖 ④）
- 每日自我进化闭环（权重重算 / 公式淘汰 / RAG 健康度）
- RAG 全量激活（7 条件触发，监控 cron 属 M3）

---

## 3. 测试框架脚手架（已交付）

**范式**：复用 waimai 的 `node --test --experimental-strip-types`，**TS 免构建直接跑**，零额外工具链。

```jsonc
// package.json (已写入)
"scripts": {
  "test": "node --test --experimental-strip-types \"src/**/*.test.ts\"",
  "typecheck": "tsc --noEmit",
  "demo:store": "node --experimental-strip-types src/demo/formula-store-demo.ts"
},
"engines": { "node": ">=22.6" }
```

**硬约束（写进控制清单）**：
1. ❌ **禁止** `npx vitest run` / 引入 vitest / jest。统一 `npm test`。
2. ✅ 测试文件 `*.test.ts` 与源文件同目录，便于就近维护。
3. ✅ 非测试辅助（`testing/tmpdir.ts`、`testing/fixtures.ts`）不带 `.test`，不被 glob 误跑。
4. ✅ 每个 Story 先写测试再实现（验证驱动）；新增内部字段须补 IP 泄露测试。

**目录布局**：
```
whoknow-brain/
├── package.json / tsconfig.json / .gitignore   ← 已建
├── src/
│   ├── errors.ts                ← BrainError + 错误码 + 工厂
│   ├── storage/                 ← Epic A（fsx / versionedStore / formulaRepo / knowledgeRepo）
│   ├── contracts/               ← Epic B（envelope / production）
│   ├── release/                 ← Epic C（gate / manifest / revocation）
│   ├── testing/                 ← 临时根 + 夹具（非测试）
│   └── demo/                    ← formula-store-demo.ts
└── docs/architecture/           ← 本文 + data-contract-v1.md
```

**`.gitignore` 关键项**：`node_modules/`、`data/`、`brain-output/`、`.tmp-demo/`（IP 居留地永不进仓库）。

---

## 4. 存储层最小骨架（已交付，证明 ADR-001 可行）

**磁盘布局**（文件即真相）：
```
data/
├── formulas/
│   ├── records/<id>/v1.json, v2.json   ← 不可变记录（'wx' 独占）
│   ├── events.jsonl                     ← 只追加事件（状态/评分变更）
│   └── index.json                       ← 派生缓存（可重建）
└── knowledge/
    └── （同构）
```

**工程不变量**（测试逐条覆盖）：
- **I1 只增不删改**：记录文件 `'wx'` 独占创建，覆盖即抛 `IMMUTABILITY_VIOLATION`。
- **I2 原子写**：index/ manifest 走 temp+rename。
- **I3 派生可重建**：`rebuildIndex()` 扫 records + 回放 events 复原，索引丢损非事故。
- **I4 内容校验和**：`checksum = sha256(canonicalJson(body))`，读时比对，落盘变质可抓。
- **I5 零业务语义**：`fsx.ts` 不认识"段子/公式"，只认字节与路径。

**现场演示**（`npm run demo:store` 输出节选，证明可行）：
```
① 写入公式记录 v1（ID = F-demo-weather）
③ 追加版本 v2（旧 v1 保留，不覆盖）
④ 版本历史 [ 1, 2 ]
⑤ 归档后状态 { version: 2, status: 'archived' }
⑥ 仓储统计 + A→B 切换判据 { total: 1, ab_switch_size_threshold: 200, ab_switch_size_met: false }
⑦ I3 索引可重建 { before: ['F-demo-weather'], after: ['F-demo-weather'], recovered: true }
⑧ I1 不可变保护：重复写 v1 被拒 ✅
✅ ADR-001 存储骨架本地可行性验证完成
```

**范围声明**：本骨架**只实现"怎么存/怎么版本化/怎么查/怎么守边界"**，**不实现任何段子生成、公式归纳、知识加权业务**——那是 M3 生成层。本期交付的是"柜子+安检门"，不是"写段子的 AI"。

---

## 5. 数据契约映射（指向独立文档）

完整字段对齐表 + 版本/校验和/降级/撤回/ IP 边界机制见 **`docs/architecture/data-contract-v1.md`**（B1 交付物）。要点：
- envelope 12 顶层字段对齐 api-spec v2.2，含 `food.branches`（D1 最致命）、`ui_meta.watermark`（D3 只 footer）。
- `brain_meta` 新增块只含 `ID@版本` 引用 + 标量信号 + 校验和，**零知识产权**。
- 降级 L1–L4 水印只进页脚；撤回清单 `revocation.ts` 纯函数预埋（S2）。
- IP 边界用**白名单投影**落地（`projectToPublicEnvelope`），泄露测试 P1–P9 守门。

---

## 6. 实现就绪清单（Implement-readiness）

### ✅ 现在就能编码（接口/决策已定，骨架已验证）
- [x] A1–A4 存储内核（已落地 + 44 测试绿）
- [x] B1–B3 数据契约 + IP 边界（已落地 + IP 泄露测试绿）
- [x] C1–C3 发布准入 + manifest + revocation 骨架（代码已写，**待补测试**）
- [x] E1–E3 测试框架（已交付）
- [x] D2 最小 demo（已交付）

### 🟡 需先决用户决策（U1–U6，不阻塞开工但定了少返工）
- [ ] **U1** 公式/知识库物理落盘路径命名（`formulas/{id}/v{n}.json` 是否定稿）→ A3
- [ ] **U2** `effective_until` freshness 窗口默认值（api-spec 写 12h/1h 两版）→ B1/F1
- [ ] **U3** `quality_signals.spreadability` M0–M2 恒 null 是否可接受（依赖 M3 上行反馈）→ B3/S3
- [ ] **U4** M0 手动审核"pending 文件 → latest-config 落盘"流程细节（文件格式/批注语法）→ D1
- [ ] **U5** revocation 触发逻辑（M0–M2 手动标记 vs M3 合规事件自动触发）→ C3
- [ ] **U6** `products` 多 app 扩展命名空间是否启用（vs 沿用 `food`/`mart` 平铺）→ B1 顶层结构

### ⛔ 属 M3（确认映射后再建，不在本期）
- [ ] ADR-002 cron / ADR-004 上行反馈 / 审核台 UI / 进化闭环 / RAG 激活

### 待补测试（已写代码，测试未补，列为收尾）
- [ ] `src/release/gate.test.ts`（C1 准入规则）
- [ ] `src/release/manifest.test.ts`（C2 不可变 + 校验）
- [ ] `src/release/revocation.test.ts`（C3 纯函数降级选择）

---

## 7. 阻塞项与待拍板（U1–U6，汇总）

| 编号 | 问题 | 影响 | 建议默认（不拍板也能先写） |
|---|---|---|---|
| **U1** | 落盘路径命名是否定稿 | A3 磁盘布局 | 暂用 `records/<id>/v<n>.json`（ADR-001-A 已选） |
| **U2** | freshness 窗口默认 | B1/F1 填值 | 暂用 12h（api-spec 主值） |
| **U3** | 传播力信号 M0–M2 null | B3/S3 | 接受 null（M3 填） |
| **U4** | 手动审核文件格式 | D1 流程 | 沿用 api-spec P0-2 的 MD 批注格式 |
| **U5** | 撤回触发逻辑 | C3 | M0–M2 手动标记，M3 接合规事件 |
| **U6** | `products` 命名空间 | B1 顶层 | 暂预留不启用，沿用 `food`/`mart` |

> 以上均为**非硬阻塞**——骨架已按合理默认实现，拍板后可微调，无需推翻重来。

---

## 8. 人话版结论（产品主理人专供）

1. **我们造好了"柜子"和"安检门"，没造"写段子的 AI"**——这是刻意的。本期只做手动阶段能落地的地基，业务生成留到自动阶段。
2. **柜子很结实**：每放一条公式/素材都留底、改了不覆盖旧的、删了只是打标归档（永不物理删）、坏了能从日志一键重建、任何篡改都会被校验和抓住。现场 demo 已跑通证明。
3. **安检门很严**：红灯词零容忍；旧版本也可能有毒，能一键拉黑不让回退；最关键是**公式套路、素材原文、prompt 这些核心资产永远只留本地，上云的只有"成品段子 + 一串不透明的 ID 引用"**——别人拿到云端数据也反推不出你的秘方。
4. **格式不用重新发明**：app 和大脑之间拉数据的格式，规范早就写好了（api-spec v2.2），我们只是对齐，并把字段对照表单独成文（data-contract-v1.md）。
5. **测试全绿、类型检查零错**：44 个测试全过，证明骨架真的能跑，不是纸面方案。
6. **有 6 个小决策等你拍板（U1–U6）**：比如"段子有效期默认多久""未来的多 app 用不用统一命名空间"——都不紧急，先按默认写着，你哪天有空定一下我们微调即可。
7. **下一步**：可以开始往柜子里正式放公式库、把锡哥手动审核"开文件批注→落盘"的流程接上 D1；审核台界面、定时任务、反馈回传这些"未来全自动"的活儿，等确认进入 M3 再做。

---

## 9. 验证证据（可复现）

```bash
cd whoknow-brain
npm install          # 已装 @types/node + typescript
npm test             # → # tests 44 / # pass 44 / # fail 0
npm run typecheck    # → 0 errors
npm run demo:store   # → ADR-001 全链路现场演示（I1/I3/I4）
```

_本文 = 胡闹大脑 Phase 3 启动交付（M0–M2 手动阶段）· engineering-lead 程基岩 · 2026-07-31 · 不 commit、不修改 BRAIN-PLAN，仅产出本方案与代码骨架_
