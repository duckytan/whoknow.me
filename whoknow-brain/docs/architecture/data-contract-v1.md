# 胡闹大脑 · 数据契约映射 v1（data-contract-v1）

> **文档性质**：Phase 3 首迭代交付物（B1 / 架构评审阻断项 B1）。把"大脑成品段子库"对齐到已有的 `api-spec.md`（**实际生效 = v2.2**）envelope，**不是从零设计**。
> **权威来源**：`whoknow-brain/docs/api-spec.md` 第 346–422 行（JSON Schema）+ 第 638–679 行（v2.2 水印裁定）+ 第 742–765 行（v2.2 D1/D2/D3 增量）。
> **代码落地**：`src/contracts/envelope.ts`（Envelope 类型）+ `src/contracts/production.ts`（本地→公开投影，IP 边界执行点）。
> **版本**：v1.0 · 与 `ENVELOPE_CONTRACT = 'brain.data-contract/1'` 对应。
> **状态**：✅ M0–M2 即可用（B1 判定：基座已具，对齐即可）。

---

## 0. 这份文档回答什么

大脑产出的"成品段子库 JSON"长什么样？app 怎么拉、版本怎么对、降级怎么触发、知识产权怎么守？——答案全部复用 api-spec v2.2 已定的 envelope，本文件只是把"大脑侧字段"与"api-spec 字段"一一对应，并钉死 4 个机制关键点（版本 / 校验和 / 降级 / 撤回）。代码已按本文实现骨架。

---

## 1. 字段对齐表（brain 成品 schema ↔ api-spec v2.2 envelope）

> 说明：
> - **对齐状态**：✅ 直接复用 / 🆕 本次新增（向后兼容，app 忽略未知键）/ 🔒 IP 敏感（本地有，上云投影时被裁剪）。
> - **IP 边界铁律**：凡是公式本体 / 素材原文 / prompt / 打分算法一律不得进入 Envelope（见 §4）。
> - 形状权威以 `whoknow-waimai/docs/specs/DATA-STRUCTURE-v1 §3.6` 为准（冲突以该规范胜出）。

| # | api-spec v2.2 字段 | 类型（代码） | brain 侧来源 / 生成点 | 对齐状态 | 备注 |
|---|---|---|---|---|---|
| 1 | `version` | `string` `^\d{4}-\d{2}-\d{2}\.\d{3}$` | 生成时按日期+序号分配 | ✅ | 例 `2026-07-31.001`；`validateEnvelopeShape` 强制校验 |
| 2 | `generated_at` | `string` ISO | 生成时间戳 | ✅ | |
| 3 | `effective_until` | `string` ISO | 生成时 + freshness 窗口 | ✅ | 必须晚于 `generated_at`，否则结构校验报错 |
| 4 | `meta` | `EnvelopeMeta` | 采集层（hot/weather/holiday） | ✅ | 含 `hot_today`/`weather`/`holiday`，可扩展 |
| 5 | `food` | `FoodPayload` | 生成层喂 waimai v2 | ✅ | 含 `boss`/`rider`/`branches` |
| 5.1 | `food.boss` | `Record<string,Record<string,string[]>>` | 生成层 | ✅ | 老结构，平铺台词 |
| 5.2 | `food.rider` | `Record<string,string[]>` | 生成层 | ✅ | 老结构 |
| 5.3 | `food.branches[]` | `DramaBranch[]` | 生成层（**D1 最致命**） | ✅🆕 | **v2.2 新增**；DRAMA 引擎核心输入；缺失时 waimai 回落内置 seed。形状：`id/name/weight/trigger{condition,probability,probabilityScaling?}/rarity/chain[]{phase,text,moodDelta?,next?,nextWeights?,effect?}` |
| 6 | `mart` | `Record<string,unknown>` | 生成层喂 mart（M1 接入） | ✅ | M0 可为空 `{}` |
| 6.1 | `products` | `Record<string,unknown>` | 多 app 扩展命名空间 | 🆕 | **提案**，待主理人拍板是否启用（见 kickoff §7 阻塞项 U6） |
| 7 | `soul_layer` | `SoulLayer` | 生成层 NPC 人格 | ✅ | `npc_id/personality/speech_style/topic_preference/forbidden_words`；**M1+ 独立化**（api-spec P0 模块清单） |
| 8 | `ui_meta` | `UiMeta` | 生成层 + 分发层 | ✅ | `ai_story_visible/last_brain_run/freshness_hours` |
| 8.1 | `ui_meta.watermark` | `{level,label,placement:'footer'}` | 分发层（降级时填） | 🆕✅ | **v2.2 D3**：`placement` 只允许 `footer`，绝不覆盖戏精弹层/气泡/结局卡 |
| 9 | `story_assets` | `StoryAssets` | 生成层 | ✅ | `today_hot_topic`/`npc_quotes_today` |
| 10 | `forbidden_check` | `ForbiddenCheck` | **红线门控（发布前置）** | ✅ | `version/red_light_count/yellow_light_count/passed`；红灯 0 容忍（api-spec 禁忌词清单 v1.0 基座） |
| 11 | `fallback` | `{food?,mart?}` | 分发层静态降级 | ✅ | 写死在代码里的兜底 |
| 12 | `brain_meta` | `BrainMeta` | 🆕 **本次新增块** | 🆕 | 见 §3，只含不透明引用 + 标量信号 + 校验和，**零知识产权** |

### 1.1 brain_meta（新增块，IP 安全岛）

| 字段 | 类型 | 内容 | IP 风险 |
|---|---|---|---|
| `contract` | `string` | `'brain.data-contract/1'` | 无 |
| `content_checksum` | `string` | 对"去掉自身后的整包"取 canonical sha256 | 无 |
| `formula_refs` | `string[]` | 形如 `F-0007@3`（仅 ID@版本） | 🔒 安全：不含 pattern |
| `material_refs` | `string[]` | 形如 `K-2026-0731-002@1`（仅 ID@版本） | 🔒 安全：不含原文 |
| `quality_signals` | `QualitySignals` | `memeability/spreadability/contrast_intensity`（0–1 或 null） | 无（标量） |
| `audit` | `{risk_level, state:'approved', approved_at}` | 审核结论摘要 | 🔒 安全：不带批注/驳回理由 |

> **关键约束（代码强制）**：`brain_meta` 是向后兼容的未知键，老 app 忽略即可。`formula_refs`/`material_refs` 永远只放 `ID@版本` 不透明引用；要溯源必须回本地大脑查，云端无从反推 pattern/原文。

---

## 2. 版本策略（对应 ADR-003 / BRAIN-PLAN "部署即版本"）

| 层面 | 机制 | 代码落点 | 备注 |
|---|---|---|---|
| **内容版本** | 每次生成 = 新 `version`（`YYYY-MM-DD.NNN`），旧版保留不覆盖 | `envelope.ts` `version` 字段 + `validateEnvelopeShape` 正则 | 对齐 api-spec `version` + `Last-Modified`/`ETag` |
| **部署版本** | Vercel 每次部署 = 独立 immutable URL，天然支持一键回退 | `release/manifest.ts`（`current` → version+checksum） | 发布失败**不触发**部署（gate 拦截） |
| **内容校验和** | `content_checksum = sha256(canonicalJson(去掉 brain_meta.content_checksum 的整包))` | `production.ts` `verifyEnvelopeChecksum` + `fsx.checksumOf` | app 拉取时复算比对，不符则用上一成功版 |
| **索引可重建** | 存储层 `index.json` 是派生缓存，可由 `records/` + `events.jsonl` 完全重建 | `versionedStore.rebuildIndex` | 索引丢/损不构成数据事故（I3） |
| **原子写** | 派生文件走 temp + rename，避免半截文件 | `fsx.writeJsonAtomic` | I2 |
| **只增不删改** | 记录文件 `'wx'` 独占创建，覆盖即抛 `IMMUTABILITY_VIOLATION` | `fsx.writeNewJsonExclusive` | I1（ADR-001 核心） |

---

## 3. 校验和策略（内容级兜底，防"部署级回退 ≠ 内容级安全"）

- **计算范围**：`computeContentChecksumInput(env)` 排除 `brain_meta.content_checksum` 自身，避免自指。
- **计算法**：`canonicalJson` = 递归排序键 + 丢弃 `undefined` → `sha256`（`fsx.ts`）。保证跨机器/跨语言可复算，与键序无关。
- **校验时机**：
  1. 生成后投影时计算并回填（`projectToPublicEnvelope`）。
  2. 分发前 / app 拉取后均可调 `verifyEnvelopeChecksum` 复算比对。
- **失败处理**：校验失败 → 视为"损坏/被篡改" → 沿用上一成功版本（对齐 api-spec "更新失败沿用旧" + L1–L4 降级）。
- **存储层同源**：公式/知识库每条记录也有独立 `checksum`（`RecordMeta.checksum`），读时 `verifyChecksum` 兜底落盘变质（I4）。

---

## 4. 降级策略（L1–L4，对齐 api-spec P0-3 + v2.2 D3）

| 级别 | 触发 | UI 文案（水印 label） | 水印 placement | 行为 |
|---|---|---|---|---|
| **L1** | 脑当日生成成功 | `🧠 今日 AI 更新` | 页脚 | 渲染今日话术 |
| **L2** | 脑昨日降级 | `⏰ 昨日 AI 内容` | 页脚 | 渲染昨日话术 |
| **L3** | 静态 fallback | `🎭 经典段子` | 页脚 | 渲染写死内容 |
| **L4** | 全部失败 | `今天没新段子，喝杯水吧 ☕` | 页脚（温和弹窗） | 显示菜单但无新内容 |

**关键约束（v2.2 D3，代码强制）**：
- 水印 `placement` **只允许 `'footer'`**（`validateEnvelopeShape` 校验），**绝不覆盖**戏精弹层 / 气泡 / 结局卡——那些是截图爆点，要保持干净美团伪装。
- 永远显示水印（让玩家知道"AI 在工作"）；绝不静默失败。
- 代码落点：`production.ts` `watermarkFor(level)` + `envelope.ts` `UiMeta.watermark`。

---

## 5. 撤回 / 失效策略（S2 / BRAIN-PLAN 8.2-4 "旧版≠安全"）

> **问题**：降级用的"旧版"本身可能已变质（含违规/bug），不能傻傻回退到问题版本。

| 项 | 机制 | 代码落点 | 里程碑 |
|---|---|---|---|
| **失效标记** | 某 `version` 被发现违规 → 标记 `revoked`，app 回退时跳过该版 | `release/revocation.ts`：`revoke()`/`isRevoked()`/`listServable()`（纯函数，无网络） | 🔷 M0–M2 **接口已预埋** |
| **可服务清单** | `listServable()` 排除 revoked，按时间降序 | 同上 | 🔷 预埋 |
| **降级选择** | `pickServable(level)` 在 L1–L4 间选首个可服务版本 | 同上 | 🔷 预埋 |
| **触发逻辑** | 由合规事件（人工发现/红线命中）填——**M0–M2 不自动触发，仅预留决策入口** | 同上（纯函数，无副作用） | 🔶 触发逻辑 M3 填 |

> 设计要点：revocation 是**纯函数、无网络、无副作用**，可单测、可离线跑；与发布流程解耦。M0–M2 手动阶段由主理人发现违规后手动调用标记，M3 接合规事件自动触发。

---

## 6. 知识产权边界（IP boundary，架构不变量）

```
ProductionRecord（本地全量 · 知识产权居留地）
   envelope（公开草稿）         ← 无 IP
   provenance（溯源）          ← 🔒 含 formula.pattern / material.excerpt / prompt_version
   audit（审核过程）           ← 🔒 含 reject_reason / reviewer 心路
   quality_signals             ← 标量，安全
        │
        │ projectToPublicEnvelope()  ← 白名单投影（只放行已知安全字段）
        ▼
Envelope（上云 · 公开 · 只读）
   + brain_meta（仅 ID@版本 引用 + 标量信号 + 校验和）
   ✗ 任何 pattern / 原文 / prompt / 批注 一律不出本地
```

**白名单而非黑名单**：`PUBLIC_TOP_LEVEL_KEYS` 显式登记 12 个可公开顶层键；新增内部字段**默认不会**外泄，要放行必须显式改 `production.ts` 并补测试（IP 泄露测试见 `src/contracts/production.test.ts` P1–P9）。

**测试护栏**：`production.test.ts` 用 `IP_MARKER_*` 标记串塞入 provenance，断言投影后 envelope 任何层级都找不到这些串——红线路由测试，回归即挂。

---

## 7. 兼容性承诺（向后兼容铁律）

1. envelope **只增字段、不改语义**（api-spec 设计原则）。
2. app 端**必须忽略未知键**（老 app 忽略 `brain_meta`/`products`/`food.branches` 等新键）。
3. `version` 正则稳定（`^\d{4}-\d{2}-\d{2}\.\d{3}$`），改了老客户端可继续用（api-spec 路径前缀 v1 不变）。
4. `DegradeLevel` 取值固定 L1–L4，不新增级别。

---

## 8. 待主理人拍板项（阻塞项，见 kickoff §7）

| 编号 | 问题 | 影响契约 |
|---|---|---|
| **U6** | `products` 多 app 扩展命名空间是否启用？还是沿用 `food`/`mart` 平铺？ | 影响 envelope 顶层结构（第 6 行） |
| **U3** | `quality_signals.spreadability`（传播力）依赖 ADR-004 上行反馈（M3），M0–M2 恒为 null 是否可接受？ | 影响 B2/S3 质量信号预埋 |
| **U1** | 公式库/知识库的物理落盘路径命名（`formulas/{id}/v{n}.json`）是否定稿？ | 影响存储层磁盘布局 |
| **U2** | `effective_until` 的 freshness 窗口默认多久（api-spec 写 12h/1h 两种）？ | 影响生成时填值 |

---

_本文 = 胡闹大脑数据契约映射 v1.0 · engineering-lead 程基岩 · 对齐 api-spec v2.2 · M0–M2 可用 · 非从零设计_
