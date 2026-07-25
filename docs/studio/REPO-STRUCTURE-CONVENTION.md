# 胡闹宇宙 · 项目文件结构规范（v1 · 2026-07-26）

> 本规范由工作室主理人起草，落地于 `docs/studio/`，管**仓库物理结构 + 文档归类 + 命名约定**。
> 权威关系：本规范是**总纲在「仓库结构维度」的实施细则**；冲突时以总纲为准；本规范修订后回写总纲对应章节（§8/§11）。各 app 文档与本规范冲突时以本规范为准（除非总纲另有明示）。
> 变更：本规范创建时同步修正了总纲 §8（prototype 已归档）、README 目录结构段、根状态文件归位（见文末"已整改"）。

## 0. 适用范围
- 管**仓库结构 / 文档归类 / 命名**，不管游戏设计内容（归各 GDD / 总纲）。
- 总纲的结构描述若过时，以本规范修正并回写总纲。

## 1. 三原则（约定级，非强制铁律）
> 审计修订（2026-07-26）：原称"三铁律"过重，降为"约定"。例外通道始终开放，遇现实冲突以"总纲 + 实际可行为"为准。
1. **单一事实源（尽量）**：同一件事优先在一处定义（如契约以 `whoknow-brain/docs/api-spec.md` 为权威）；各 app 可在 `specs/` 持有本地权威副本，brain 变更时同步通知，避免单点耦合。
2. **根目录只放入口与权威，不放过程**：状态快照、过程稿、原型图归位；根目录保持门面级（不强制文件数，以"可快速定位"为度）。
3. **ship / dev / archive 三态隔离**：`dist/`（线上）、`docs/`（开发）、`archive/`（废旧）尽量不混放。

## 2. 顶层结构（根目录白名单）
根目录只允许：

| 路径 | 性质 | 备注 |
|---|---|---|
| `README.md` | 门面 | 品牌/域名，仅门面 |
| `胡闹宇宙总体设计方案.md` | 权威总纲 | 全仓锚点（含中文名，历史原因，新文档勿效仿）|
| `BRAND.md` | 品牌手册 | 视觉/语气 |
| `vercel.json` | 部署配置 | 多 App 红线（总纲 §11），只追加不删改 |
| `.gitignore` / `.vercelignore` | 忽略配置 | 全局 `dist/` + 每 app `!dist/` 例外 |
| `build-for-vercel.js` | 部署辅助脚本 | 脚本变多→建 `scripts/` |
| `index.html` | 主站门面主入口 | 主入口；`index1.html` 为同门面级遗留入口，语义待定，不纳入"唯一"约束（见 §8 遗留①）|
| `data/` | 主站全局数据 | `home.json` |
| `styles/` | 主站样式 | `design-tokens.css` |
| `js/` | 主站脚本 | `home-render.js` |
| `docs/` | studio 级跨 App 文档 | 结构规范/进度/状态快照 |
| `whoknow-<app>/` | 各产品 | 见 §3 |
| `archive/` | 废旧资产 | 见 §5 |
| `.workbuddy/` | 工具态（AI 协作记忆/日志）| **已加入 `.gitignore`（第39行）**，不污染仓库 |

> 禁止在根出现：app 级状态文件、原型图、临时 HTML、构建输出。

## 3. 应用目录规范（`whoknow-<app>/`）
以 `whoknow-waimai/` 为基准：
```
whoknow-<app>/
├── src/      # 源码
├── dist/     # 构建产物（gitignored，仅 !whoknow-<app>/dist/ 例外）← 唯一上线物
├── docs/     # App 级文档（见 §4 矩阵）
├── tests/    # 测试
├── scripts/  # 构建/工具脚本
├── memory/   # App 级记忆（可选）
├── future-plans/ # App 路线（可选）
└── package.json / tsconfig.json / vite.config.ts
```
- **brain 例外**：无 `dist/`（M0 手动配置），`docs/` 兼作"宇宙级契约中枢"（`api-spec.md` 权威）。**耦合缓解**：各 app 在 `specs/` 持有本地权威副本；brain 的 `api-spec.md` 变更须通知各 app 同步，避免中枢单点成为故障源。

## 4. 文档归类矩阵
| 类型 | 路径 | 命名 | 示例 |
|---|---|---|---|
| 宇宙级决策/总纲补遗 | `docs/studio/` | `kebab-case.md` | `STUDIO-PROGRESS.md` |
| 会话交接/状态快照 | `docs/studio/` | `*-STATE.md` 或 `-snapshot-YYYY-MM-DD.md` | `CURRENT-STATE.md` |
| App 主 GDD | `whoknow-<app>/docs/GDD.md` | 单一权威文件，不带版本号 | `GDD.md` |
| 数据结构/引擎规格 | `whoknow-<app>/docs/specs/` | `kebab-NAME.md` | `DATA-STRUCTURE-v1.md` |
| 架构决策 ADR | `whoknow-<app>/docs/adr/` | `NNN-kebab.md` | `001-rename-prototype.md` |
| Playtest/测试报告 | `whoknow-<app>/docs/playtest/` | `kebab-YYYY-MM-DD.md` | `PLAYTEST-CHECKLIST-2026-07-25.md` |
| 审计/会审 | `whoknow-brain/docs/`（中枢）或 app `docs/audit/` | `kebab-YYYY-MM-DD.md` | `三司会审-总审计-v2-2026-07-25.md` |
| 跨 App 契约（权威源） | `whoknow-brain/docs/api-spec.md` | 单一权威文件 | `api-spec.md` |
| 跨 App 契约（本地副本） | `whoknow-<app>/docs/specs/` | 各 app 从 brain 同步的本地副本 | `API-SPEC-LOCAL.md` |
| 品牌/视觉 | 根 `BRAND.md` + `styles/design-tokens.css` | — | — |
| 合规红线 | `whoknow-brain/docs/禁忌词清单-v1.0.md` | 带版本号（慢变）| — |
| 种子数据 | `whoknow-<app>/docs/specs/*.json` | `kebab-SEED-v1.json` | `DRAMA-SEED-v1.json` |

**决策树**
```
新文档 → 宇宙级/跨 App？ ─是→ docs/studio/（或回写总纲）
        └─ 否 → 属某 App？
              ├ 契约/供给中枢 ─→ whoknow-brain/docs/
              ├ GDD/规格/ADR/playtest ─→ whoknow-<app>/docs/<子类>/
              └ 状态快照/交接 ─→ docs/studio/
        └ 废旧/被取代 ─→ archive/（见 §5）
```

## 5. 归档纪律（`archive/`）
- **何时归档**：① 被新版取代；② App 版本废弃；③ 根层资产部署模型失效；④ 临时草稿。
- **子目录语义**（沿用现有惯例）：
  | 子目录 | 用途 |
  |---|---|
  | `root-obsolete/` | 原本在根目录、现已废弃的根层文件（index*/styleguide/experiments/ROADMAP/ARCH + `prototype/`）|
  | `v1-waimai-app/` `waimai-docs-old/` | waimai 专属废旧 |
  | `brain-audit-v1/` | brain 专属废旧审计 |
  | `mart-*-old/`（按需）| mart 专属废旧（出现时再建，不预先预留）|
  | `stale/` | 过期文档，被总纲取代、不参与开发 |
  | `temp-scratch/` | 子 agent 临时草稿（注：当前仓库未实际创建此目录，不预建）|
- **操作**：一律 `git mv`（保留历史）；归档后必须更新 `archive/00-README.md` 表格 + 总纲 §8（若曾在保留清单）。

## 6. 命名与版本（新文档约定，存量豁免）
> 审计修订（2026-07-26）：命名规则为**新文档约定**，不强制改写历史文档。存量中文前缀文档（`mart-*.md`/`三司会审-*.md`/`禁忌词清单-v*.md`）**存量豁免**，避免断链与破坏 git rename 连续性。
1. **kebab-case 优先（新文档）**：新文档用小写+连字符；**中文专有名词例外**（如 `GDD.md`、`BRAND.md`、含品牌词的文档）允许保留，不与 BRAND.md 戏精中文调性冲突。
2. **日期快照加后缀**：一次性文档加 `-YYYY-MM-DD`（ISO，别用 `0725`）。
3. **去掉冗余 App 前缀（新文档）**：新文件在 `whoknow-mart/docs/` 内就不写 `mart-` 前缀；存量 `mart-*` 文档不改名。
4. **版本号只给慢变文档**：`BRAND.md`/`禁忌词清单-v1.0.md`/`api-spec.md` 可带版本；GDD/规格用单一权威文件 + git 历史，被取代版进 `archive/`，勿 proliferating `GDD-v1`/`GDD-v2`。
5. **执行辅助（建议）**：长期引入目录/lint 校验（如 CI 脚本）自动检查命名与结构，降低人工执行成本（当前无）。

## 7. 数据/资产/部署红线
- `data/`（根）= 主站全局数据；App 本地数据进 `whoknow-<app>/src/data/`。
- `styles/` `js/`（根）= **仅主站门面**；App 资产随 `dist/` 走。
- 设计令牌集中在 `styles/design-tokens.css`，App 内复用变量不硬编码。
- 部署：引用总纲 §11。`dist/` 是唯一构建产物；新增 App 只动 `vercel.json` 追加 rewrite + `.gitignore` 追加 `!dist/` 例外；App 内链用相对路径；绝不 force push。
- **部署源文件红线**：`index.html` 与 `index1.html` 是 `build-for-vercel.js` 的部署源文件（每次构建复制进 `dist/` 上线产物），**必须保留，禁止归档/移动/删除**；任何"清理根目录"的直觉都不得作用于二者。
- **防再犯闸门（文件变动双核查）**：
  - 闸门一·前置核查：任何"归档/移动/删除"建议提出前，先 `grep` 仓库（构建脚本/配置/路由/其他文档）确认该文件非部署或运行依赖——未核查不得写入规范或执行。
  - 闸门二·修订回扫：改完某条结论后，立即 `grep` 全文所有提及该对象的位置，逐处对齐结论，杜绝"同一规范两处结论相反"（违反单一事实源）。
- **`.workbuddy/`**（AI 工具态，含本规范起草过程的 memory）**已加入 `.gitignore`（第39行）**，不污染仓库，无需再处理。

## 8. 已整改 / 遗留（经三司会审 2026-07-26 修订）
- ✅ 已整改（本规范创建时）：总纲 §8 把 `prototype/` 从"保留"移入"归档"；README 目录结构段更新为当前结构；根 `CURRENT-STATE.md`/`PROJECT-STATUS.md` 移入 `docs/studio/`；`docs/studio/STUDIO-PROGRESS.md` 的 prototype 路径修正。
- ✅ 已修订（三司会审后）：权威锚点降为"总纲实施细则"、三铁律降为"约定"、命名改"新文档约定+存量豁免"、`.workbuddy/` 标注为已 gitignore、brain 补单点缓解、归档子目录收敛。
- ⬜ 遗留待办（事实类，需后续处理）：
  ① 根双 HTML 入口：`index.html` 为主入口，`index1.html` 为同门面级遗留入口（本规范已明确"不强制唯一"）；**保留**——`build-for-vercel.js` 将其复制进 `dist/` 上线产物，属部署源文件，不可删。
  ② mart/brain 文档命名风格（中文前缀）：**存量豁免**，不强制改名（见 §6）。
  ③ prototype 版本漂移（v3 vs 总纲 v2）：文档对齐，非阻塞。
  ④ ~~`.workbuddy/` 未 gitignore~~ → **已 gitignore（.gitignore 第39行），本条撤销**。
  ⑤ 总纲 §8 的 `archive/temp-scratch/` phantom 条目已修正（2026-07-26）：该目录实际未创建，已从总纲 §8 删除。✅
  > 注：README 第186行双入口表述已与本规范 §2 对齐（index.html 主入口 / index1.html 同门面级遗留入口）。
