# 胡闹宇宙项目开发工作台 · 技术实现方案（架构设计）

> 作者：高见远（software-architect）· 生成日期：2026-09-03 · 方案版本：v0.1
> 依据：产品经理许清楚交付的 PRD（信息架构 / 首页面板 / 子项目详情 / 数据维度清单）
> 默认方向：主理人齐活林推荐的 5 项默认值（技术栈 / 数据来源 / 部署 / brain 口径 / 红线可视化），最终拍板权归用户（见 §10.2）
> 性质：**纯架构设计文档，零实现代码**。所有路径/文件名均引用 whoknow.me 仓库真实结构。

## 客观表述合规声明（L2-C9）

本方案遵循 `CONSTITUTION.md` L2-C9「客观表述禁止集与豁免」：禁用读者相对代词（你/我们/这里/这个）与模糊指代；时间敏感表述均带日期锚（如 2026-09-03）。涉及冲突的事实以磁盘实际内容为准并标注待核实项。

---

## 0. 范围与边界

- **目标产物**：在 `whoknow.me` 仓库新增独立目录 `whoknow-workbench/`，作为第 4 个 Web App（与 `whoknow-waimai/`、`whoknow-mart/`、`whoknow-brain/` 并列），经 `vercel.json` 路由 `/workbench` 访问。
- **本方案不产出**：任何 `.vue`/`.ts`/`.mjs` 实现源码；仅交付架构、数据模型、文件清单、任务分解等方案。
- **复用与隔离原则**：沿用仓库 Vue3+Vite 生态；`whoknow-workbench/` 自含 `package.json` 与 `dist/`，不读取其他 App 的源码或 `node_modules`；遵守 L1-T5 多 App 共存红线（仅改 `vercel.json` + `.gitignore`，绝不删改他人目录/路由、绝不 force push）。
- **数据现实基线**（2026-09-03 磁盘核查）：`whoknow-brain/` 仅含 `docs/`（无 `src/`）；`whoknow-waimai/` 已部署（测试 45/45）；`whoknow-mart/` 为 v1 原型（指标卡 12/12）；候选矩阵 16 款 / 8 大类（见 `docs/studio/APP-MATRIX-ROADMAP.md`）。

---

## 1. 技术栈选型

### 1.1 对比表

| 维度 | 推荐方案：Vue3 + TS + Pinia + ECharts + Element Plus | 备选 A：React18 + MUI + Recharts | 备选 B：纯 HTML + Chart.js |
|---|---|---|---|
| 生态复用 | 仓库已上线 3 个 App 均为 Vue3+Vite（waimai/mart 用 Vant+Pinia），直接复用构建与组件经验 | 需引入全新 React 栈，与矩阵割裂，双栈并行维护成本高 | 无框架，与矩阵零复用，无组件化 |
| 图表完整度 | ECharts 原生覆盖雷达(radar)/热力(heatmap)/漏斗(funnel)/仪表(gauge)/线性(line)/柱状(bar)/环形(pie)，甘特用 custom+timeline 可建 | Recharts 偏基础，热力/漏斗/甘特需自建或拼库 | Chart.js 无原生雷达/热力/漏斗/甘特，需多库拼凑，甘特几乎不可行 |
| Vercel 纯静态兼容 | Vite 构建产物即静态，契合 `vercel.json` `buildCommand:"echo done"` + `outputDirectory:"."` | 同左，但需额外配置 | 无构建链，手动维护 HTML，可维护性差 |
| 桌面治理面板适配 | Element Plus 桌面组件齐全（表格/树 el-tree/步骤 el-steps/卡片/状态灯），适合管理驾驶舱 | MUI 偏移动/通用，桌面表格/树需额外打磨 | 全手写，工作量最大 |
| 契约中枢透视所需组件 | el-tree（信封维度树）+ el-table（6 字段×4 级降级）开箱即用 | 需自搭树/表 | 全手写 |
| 学习/维护成本 | 低（单一 Vue 体系） | 高（与现有栈并行） | 高（无工程化） |
| 结论 | ✅ 推荐 | 备选（不采用） | 不推荐 |

### 1.2 推荐结论与理由

**采用：独立 Vite + Vue3 + TypeScript + Pinia + ECharts + Element Plus。**

理由（对应主理人默认方向 1）：
1. **生态复用**：仓库已有 whoknow-waimai/（Vue3+Vite+Pinia，见其 `package.json` `vite@^5.2`、`vue@^3.4`、`pinia@^2.1`）与 whoknow-mart/，新 App 直接复用同一构建链与状态管理范式，新人无需跨栈。
2. **Vercel 纯静态兼容**：Vite `dist/` 产物 + 根 `vercel.json` 的 `echo done` 静态部署模式已验证（waimai/mart 同模式），`whoknow-workbench/` 加入 rewrite 即可，零部署架构改动。
3. **独立目录不污染矩阵**：`whoknow-workbench/` 为单一根目录文件夹（同 L2-C1 约定），自含 `dist/`，不触及 waimai/mart/brain 任一目录。
4. **ECharts 图表最全**：PRD 全部图表需求（雷达/甘特/热力/漏斗/燃尽/交通灯/折线/柱状/环形/仪表）ECharts 均有对应实现；甘特用 `custom` series + `timeline`；热力用 `heatmap`；漏斗用 `funnel`；交通灯用自定义 `StatusLight` 组件（非 ECharts）。
5. **Element Plus 适配桌面治理面板**：本工作台为桌面端管理驾驶舱（非移动端），Element Plus 的表格/树/步骤条/卡片优于移动端 Vant；选型与「现有 App 用 Vant、工作台用 Element Plus」职责分离一致。

### 1.3 依赖清单（建议版本，待 T01 落地时锁定）

```
# 运行时
vue@^3.4
vue-router@^4.3
pinia@^2.1
echarts@^5.5
element-plus@^2.7
# 开发
vite@^5.2
@vitejs/plugin-vue@^5.0
typescript@^5.4
vue-tsc@^2.0
@types/node@^20
```

---

## 2. 整体架构

### 2.1 前端分层

```
whoknow-workbench/
├─ src/
│  ├─ main.ts                # 入口：挂载 Pinia + Router + ElementPlus
│  ├─ App.vue                # 根壳：Sidebar + Breadcrumb + <router-view/>
│  ├─ router/index.ts        # vue-router 路由表（§7）
│  ├─ types/metrics.ts       # 数据模型 TS interface（§3）
│  ├─ services/
│  │  ├─ dataLoader.ts       # fetch metrics.json / manual.json → 注入 store
│  │  └─ format.ts           # 状态灯/百分比/日期格式化工具
│  ├─ stores/
│  │  ├─ universe.ts         # 宇宙总览（进度/健康度/风险）
│  │  ├─ apps.ts             # 子项目指标（waimai/mart/brain）
│  │  ├─ candidates.ts       # 候选矩阵 16/8
│  │  └─ governance.ts       # 宪法/红线/门禁
│  ├─ components/
│  │  ├─ common/             # StatusLight / MetricCard / SectionCard / TabBar
│  │  ├─ charts/             # 封装 ECharts：RadarChart/GanttChart/HeatmapChart/FunnelChart/LineChart/BarChart/RingChart
│  │  └─ modules/            # 各业务模块组件（§4）
│  └─ pages/
│     ├─ HomeDashboard.vue       # 首页综合面板
│     ├─ AppDetail.vue           # 子项目详情页（含 Tab 壳）
│     ├─ CandidateMatrix.vue     # 候选矩阵总览
│     ├─ CandidateList.vue       # 候选清单（下钻）
│     └─ GovernanceView.vue      # 治理透视页
├─ scripts/
│  └─ gen-metrics.mjs        # 数据管道（§6）
├─ public/data/
│  ├─ metrics.json           # 自动采集 A 类 + 衍生 C 类（脚本生成）
│  └─ manual.json            # 手动维护 B 类（专人更新）
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
└─ package.json
```

### 2.2 数据层

三层数据来源，全部以静态 JSON 形式随 `dist/` 部署（MVP 半静态方案，符合主理人默认方向 2）：

- **metrics.json（自动采集 + 衍生）**：由 `scripts/gen-metrics.mjs` 解析 `git log` + 读取 `docs/studio/PROJECT-STATUS.md`、`STUDIO-PROGRESS.md`、`APP-MATRIX-ROADMAP.md` 生成。覆盖 PRD 的 A 类全字段及可由 git 直接聚合的 C 类（周频/目录分布/作者分布）。
- **manual.json（手动维护）**：健康度五维、playtest 结果(A/B/C)、brain 信封自动化状态(P0-C)、红线清单状态、宪法层级状态、双实例负载归属（可选派生覆盖）。由专人（PM/主理人/701-PC 按字段分工）更新并提交。
- **运行时 fetch**：`services/dataLoader.ts` 在应用启动（`App.vue` `onMounted`）时 `fetch('/workbench/data/metrics.json')` 与 `manual.json`，合并后写入各 Pinia store。未来接 CI 时仅替换数据源（§6.5），store/services 不变。

### 2.3 构建与部署（遵守 L1-T5 红线）

**vercel.json 追加 rewrite 片段**（追加至现有 `rewrites` 数组末尾，与 `/waimai`、`/mart` 同构；不改动既有条目）：

```json
{
  "rewrites": [
    { "source": "/waimai/assets/:path*", "destination": "/whoknow-waimai/dist/assets/:path*" },
    { "source": "/waimai/:path*", "destination": "/whoknow-waimai/dist/index.html" },
    { "source": "/waimai", "destination": "/whoknow-waimai/dist/index.html" },
    { "source": "/mart/:path*", "destination": "/whoknow-mart/dist/:path*" },
    { "source": "/mart", "destination": "/whoknow-mart/dist/index.html" },

    { "source": "/workbench/assets/:path*", "destination": "/whoknow-workbench/dist/assets/:path*" },
    { "source": "/workbench/:path*", "destination": "/whoknow-workbench/dist/:path*" },
    { "source": "/workbench/", "destination": "/whoknow-workbench/dist/index.html" },
    { "source": "/workbench", "destination": "/whoknow-workbench/dist/index.html" }
  ]
}
```

> 说明：SPA 深链回退采用与 `/waimai` 一致的 `:path*` → `dist/:path*` 模式（已验证可工作）。若后续出现深链 404，追加一条 `{ "source": "/workbench/:path*(.*)", "destination": "/whoknow-workbench/dist/index.html" }` 作为兜底（此条为已知可选项，不在 MVP 强制）。

**.gitignore 追加例外**（现有文件已有 `!whoknow-waimai/dist/`、`!whoknow-mart/dist/`；新增一行）：

```
# ── workbench 预构建产物（胡闹宇宙开发工作台，需提交支持 Vercel 静态部署）──
!whoknow-workbench/dist/
```

**部署红线约束**：仅修改 `vercel.json`（追加 rewrite）与 `.gitignore`（追加例外）；绝不删除/改写 `whoknow-waimai/`、`whoknow-mart/`、`whoknow-brain/` 任一目录及其路由；提交 `whoknow-workbench/dist/` 以支持静态部署；禁止 `--force` push。

> 注：`vercel.json` 当前 `buildCommand:"echo done"`、`outputDirectory:"."`，为纯静态托管。workbench 的 `dist/` 需在本地/CI 预构建后提交，Vercel 不执行其构建（与 waimai/mart 同模式）。

---

## 3. 数据模型（TypeScript interface）

`src/types/metrics.ts` 定义全部字段，含来源标记 `source: 'auto' | 'manual' | 'todo'`。

```ts
// ── 来源标记 ──────────────────────────────
export type SourceTag = 'auto' | 'manual' | 'todo';
export type AppStatus = 'live' | 'designing' | 'planning';
export type BuildStatus = 'pass' | 'fail' | 'unknown';
export type PlaytestGrade = 'A' | 'B' | 'C';

// ── A 类：自动采集 ───────────────────────
export interface AutoMetrics {
  appKey: string;                       // A: 目录扫描 whoknow-*/ 得到
  appStatus: AppStatus;                // A: 由 STATUS 文档 + dist 存在性推断
  milestonePhase: number;              // A: 解析 STUDIO-PROGRESS 7 阶段表 (1-7)
  testPass: number;                    // A: 跑各 app test 命令解析汇总行 (waimai=45)
  testTotal: number;                   // A: 同上 (waimai=45, mart=12)
  buildStatus: BuildStatus;            // A: 解析构建日志
  gitCommitsTotal: number;             // A: git log 计数
  gitCommitsByDir: Record<string, number>;  // A: 按顶层目录分组 (whoknow-waimai/whoknow-mart/whoknow-brain/docs/root)
  gitAuthorDist: Record<string, number>;    // A: 按 author 名分组
  candidateCount: 16;                  // A: 解析 APP-MATRIX-ROADMAP 候选数
  candidateCategories: 8;              // A: 同上大类数
  unlockGateStatus: boolean;           // A: 解析路线图门禁段 ("金克木" 冻结=未解锁)
}

// ── C 类：可由 git 直接聚合（脚本生成，归 auto）──
export interface DerivedMetrics {
  commitTimeseries: { week: string; count: number }[];  // C→auto: git log 按 ISO 周分桶
  ciResult: BuildStatus;               // C: 未来接 CI；MVP 以 buildStatus 近似
  realtimeProgressPct: number | null; // C: 待建，MVP=null
  playtestMetrics: null;               // C: 待建
  bizMetrics: { laughRate: number|null; retention: number|null }; // C: 待建
  dora: { deployFreq: number|null; leadTime: number|null; mtbf: number|null; mttr: number|null }; // C: 待建
}

// ── B 类：手动维护 ───────────────────────
export interface ManualMetrics {
  healthScore: Record<string, HealthScore>;     // B: 每 app 五维
  playtestResult: Record<string, PlaytestGrade | null>; // B: 主理人真人后填
  brainEnvelopeAutomation: 'paused' | 'running' | 'done'; // B: P0-C 状态(当前 paused)
  redlightList: RedLight[];                      // B: L1 5 条状态
  constitutionLevel: { l1: LawStatus[]; l2: LawStatus[]; l3: LawStatus[] }; // B
  dualInstanceLoad: { '701-PC': number; 'DuckyPC': number }; // B: 双实例目录提交分布
}

export interface HealthScore {
  progress: number;   // 进度
  quality: number;    // 质量
  risk: number;       // 风险
  collab: number;     // 协作
  business: number;   // 商业
}

export interface RedLight {
  id: 'L1-T1' | 'L1-T2' | 'L1-T3' | 'L1-T4' | 'L1-T5';
  title: string;
  status: 'on' | 'off' | 'partial';
  evidence: string;
}

export interface LawStatus { id: string; title: string; status: 'on'|'off'|'partial'; }

// ── 顶层聚合 ──────────────────────────────
export interface AppMetrics extends AutoMetrics, Partial<DerivedMetrics> {
  manual?: Pick<ManualMetrics, 'healthScore'|'playtestResult'|'brainEnvelopeAutomation'>;
}

export interface CategoryCluster {
  id: 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H';
  name: string;                 // 如 "A 出行 Mobility"
  members: CandidateApp[];
  unlockGate: { status: boolean; condition: string };
}

export interface CandidateApp {
  code: string;       // whoknow-ride
  name: string;       // 胡闹打车
  reuseLevel: number; // ★ 数量
  categoryId: string;
}

export interface MetricsBundle {
  schemaVersion: string;        // '2026-09-03.001'
  generatedAt: string;          // ISO8601 UTC
  source: { gitRepo: string; statusDocs: string[] };
  universe: {
    overallProgressPct: number;
    appStatusLights: AppMetrics[];
    milestoneGantt: { phase: string; start: string; end: string; status: AppStatus }[];
    candidateMatrix: CategoryCluster[];
    riskBoard: RedLight[];
    qualityGate: { app: string; pass: number; total: number }[];
  };
  apps: AppMetrics[];          // waimai / mart / brain (+可扩展)
  candidates: { total: 16; categories: CategoryCluster[] };
  governance: ManualMetrics['constitutionLevel'] & { redLights: RedLight[] };
}
```

> 字段级权威遵循 `CONSTITUTION.md` L1-T4（字段命名权威，ADR-001）。brain 信封 6 字段以 `whoknow-brain/docs/api-spec.md` §信封 + `APP-MATRIX-ROADMAP.md` §5 为准：`app / meta.category / meta.persona_type / meta.tone / meta.memory_scope / meta.fiction_flag`（精确枚举待与 api-spec 复核，见 §10.2）。

---

## 4. 页面与组件结构

### 4.1 首页综合面板（HomeDashboard.vue）

```
HomeDashboard
├─ SectionCard「宇宙整体进度」       → RingChart(环图) + ElProgress(进度条) + 数值
├─ AppStatusBoard「App 状态灯」     → StatusLight ×N (live/designing/planning 交通灯)
├─ MilestoneGantt「里程碑/解锁路线图」 → GanttChart(custom+timeline) 16候选8类+门禁
├─ CandidateMatrixCard「候选矩阵聚类」 → MatrixCard 簇 + FunnelChart(漏斗)
├─ RiskBoard「风险/红线看板」        → StatusLight(L1 5条) + List + 金克木冻结标记
├─ QualityGateOverview「质量门总览」  → MetricCard ×N (waimai 45/45, mart 12/12)
├─ (P1) HealthRadar「健康度雷达」     → RadarChart(五维)
├─ (P1) DualInstanceLoad「双实例负载」 → BarChart + HeatmapChart(701/Ducky 目录分布)
├─ (P1) ContributionActivity「贡献活跃度」 → LineChart(git 周频)
└─ (P1) ContractHubView「契约中枢透视」  → ElTree(信封维度) + ElTable(6字段×4级降级)
```

### 4.2 子项目详情页（AppDetail.vue，含 Tab 壳）

```
AppDetail (route /app/:key)
├─ TabBar [进度|质量|协作|文档|指标| (brain专属)契约信封/降级]
├─ TabProgress   → ElSteps(七阶段里程碑步进条) + 阶段证据
├─ TabQuality    → MetricCard(测试/构建门) + 绿红点
├─ TabCollab     → SwimLane(双实例 lane 归属 701/Ducky)
├─ TabDocs       → DocLinkCard(契约/规格链接卡)
├─ TabMetrics    → DoraCards(部署频率/笑率/缺口) + Gauge
└─ TabEnvelope(brain only)
   ├─ EnvelopeTree   → ElTree(信封维度树 6 字段)
   ├─ DegradeFlow    → 4 级降级流(自定义 L1-L4 组件)
   └─ AutomationLight→ StatusLight(P0-C 暂停)
```

### 4.3 候选矩阵页（CandidateMatrix.vue + CandidateList.vue）

```
CandidateMatrix (/candidates)
├─ MatrixClusterCard ×8 (按大类聚类，含成员数/复用度)
└─ 点击簇 → CandidateList (/candidates/:categoryId)
   ├─ CandidateRow ×N (code/name/复用度/归属大类)
   └─ 门禁状态徽标(unlockGateStatus)
```

### 4.4 治理透视页（GovernanceView.vue）

```
GovernanceView (/governance)
├─ ConstitutionLevel「宪法层级」
│  ├─ L1Panel → RedLight ×5 (逐条绑定状态灯)
│  ├─ L2Panel → LawStatus 列表 (整体灯)
│  └─ L3Panel → LawStatus 列表 (整体灯)
└─ GatePanel「门禁」 → 金克木冻结状态 + 解锁前提清单
```

---

## 5. 图表选型映射表

| PRD 图表需求 | ECharts 类型/组件 | 实现位置 | 备注 |
|---|---|---|---|
| 宇宙整体进度条 | `el-progress` | HomeDashboard | 非 ECharts |
| 进度环图 | `pie` (ring) | RingChart | `radius:['50%','70%']` |
| App 状态灯 | 自定义 `StatusLight` 组件 | AppStatusBoard | 交通灯色块，非图表 |
| 里程碑/解锁甘特 | `custom` series + `timeline` | GanttChart | 16 候选 8 类 + 门禁行 |
| 候选矩阵聚类 | `MatrixCard` 簇 + `funnel` | CandidateMatrixCard | 漏斗展示转化 |
| 风险/红线看板 | `StatusLight` + `el-list` | RiskBoard | 交通灯+列表 |
| 质量门指标卡 | `MetricCard` 组件 | QualityGateOverview | 非图表 |
| 健康度雷达(五维) | `radar` | RadarChart | 5 维度轴 |
| 双实例负载(柱+热力) | `bar` + `heatmap` | DualInstanceLoad | 701/Ducky 目录分布 |
| 贡献活跃度(折线) | `line` | ContributionActivity | git 周频 |
| 契约中枢维度表/树 | `el-table` + `el-tree` | ContractHubView | 非 ECharts |
| 七阶段里程碑步进条 | `el-steps` | TabProgress | 非 ECharts |
| 测试/构建门指标卡 | `MetricCard` + 绿红点 | TabQuality | 非 ECharts |
| 双实例 lane 归属 | `SwimLane` 自定义 | TabCollab | 泳道布局 |
| 文档链接卡 | `DocLinkCard` 组件 | TabDocs | 非 ECharts |
| DORA/业务指标 | `MetricCard` + `gauge` | TabMetrics | 仪表盘 |
| brain 信封维度树 | `el-tree` | TabEnvelope | 6 字段树 |
| brain 4 级降级流 | 自定义 `DegradeFlow` 组件 | TabEnvelope | L1-L4 流 |
| brain 自动化状态灯 | `StatusLight` | TabEnvelope | P0-C 暂停 |

---

## 6. 数据管道方案（scripts/gen-metrics.mjs）

### 6.1 职责

`gen-metrics.mjs`（Node ESM，`node>=20`）在本地或 CI 预构建阶段运行，输出 `public/data/metrics.json`：

1. **git 聚合**：执行 `git log --all --pretty=format:%an|%ad --date=iso --name-only`，解析得到：
   - `gitCommitsTotal`：提交总数
   - `gitCommitsByDir`：按改动文件顶层目录分组（whoknow-waimai / whoknow-mart / whoknow-brain / docs / root）
   - `gitAuthorDist`：按 author 名聚合
   - `commitTimeseries`：按 ISO 周（`%G-W%V`）分桶 → 满足 C 类周频需求（MVP 即落地，不待建）
2. **STATUS 文档解析**：读取 `docs/studio/STUDIO-PROGRESS.md`（7 阶段表）+ `docs/studio/PROJECT-STATUS.md`，正则抽取各 App 的阶段状态 → `milestonePhase`、`appStatus`（有 `dist/` 且 STATUS=完成=live；有 src 无 dist=designing；仅 docs=planning）。
3. **测试/构建采集**：对 `whoknow-waimai/`、`whoknow-mart/` 调用其 `npm test`（或通过 `package.json` 脚本），解析汇总行得到 `testPass`/`testTotal`；构建状态解析 `dist/` 存在性 + 最近构建日志 → `buildStatus`。
4. **候选矩阵解析**：读取 `docs/studio/APP-MATRIX-ROADMAP.md`，抽取 16 候选（§2 表）、8 大类（§3 表）、门禁段（§0 金克木硬约束）→ `candidateCount=16`、`candidateCategories=8`、`unlockGateStatus=false`（冻结未解锁）。
5. **合并输出**：将 A 类 + 衍生 C 类写入 `metrics.json`，并预留 `manual` 占位（实际手动值来自 `manual.json`，运行时合并）。

### 6.2 输出 metrics.json Schema（摘要）

```json
{
  "schemaVersion": "2026-09-03.001",
  "generatedAt": "2026-09-03T00:00:00Z",
  "source": { "gitRepo": "whoknow.me", "statusDocs": ["docs/studio/PROJECT-STATUS.md","docs/studio/STUDIO-PROGRESS.md","docs/studio/APP-MATRIX-ROADMAP.md"] },
  "universe": {
    "overallProgressPct": 0,
    "appStatusLights": [ {"appKey":"waimai","appStatus":"live","milestonePhase":7,"testPass":45,"testTotal":45,"buildStatus":"pass","gitCommitsTotal":0,"gitCommitsByDir":{},"gitAuthorDist":{}}, ... ],
    "milestoneGantt": [ {"phase":"概念孵化","start":"2026-07-24","end":"2026-07-25","status":"live"}, ... ],
    "candidateMatrix": [ {"id":"A","name":"A 出行 Mobility","members":[{"code":"whoknow-ride","name":"胡闹打车","reuseLevel":5,"categoryId":"A"}],"unlockGate":{"status":false,"condition":"金克木冻结：waimai 真机 playtest PASS + mart v1 跑通"}}, ... ],
    "riskBoard": [ {"id":"L1-T1","title":"禁忌词红线0容忍","status":"on","evidence":"forbidden_check 客户端闸门已落地"}, ... ],
    "qualityGate": [ {"app":"waimai","pass":45,"total":45}, {"app":"mart","pass":12,"total":12} ]
  },
  "apps": [ ... ],
  "candidates": { "total": 16, "categories": [ ... ] },
  "governance": { "l1":[...], "l2":[...], "l3":[...], "redLights":[...] }
}
```

### 6.3 手动数据约定（manual.json）

| 字段 | 类型 | 更新责任人 | 频率 |
|---|---|---|---|
| `healthScore` (每 app 五维 0-100) | object | PM（许清楚）/ 主理人 | 里程碑节点 |
| `playtestResult` (A/B/C) | map | 主理人（真人后） | playtest 后 |
| `brainEnvelopeAutomation` (P0-C) | enum | 701-PC（Agent-商城） | 状态变更时 |
| `redlightList`（L1 5 条状态） | array | 主理人 / quality | 季度或事件触发 |
| `constitutionLevel`（L1/L2/L3 整体灯） | object | 主理人 | 宪法修订时 |
| `dualInstanceLoad`（701/Ducky 分布） | object | 可派生自 git，专人复核覆盖 | 周 |

`manual.json` 由专人编辑后提交；`dataLoader.ts` 在运行时与 `metrics.json` 深度合并（manual 优先覆盖 auto 的同名占位）。

### 6.4 brain src 口径冲突处理（按主理人默认方向 4）

ROLES.md §6.5 记载 `DuckyPC` 实测主责 `whoknow-brain/` 含 `src/` 全套实现（32 commits），但 2026-09-03 磁盘核查 `whoknow-brain/` 仅含 `docs/`。**本方案按「以磁盘为准」展示**：workbench 中 brain 的 `appStatus` 取 `planning/designing`（仅 docs），并在治理页/详情页标注「ROLES.md §6.5 所述 src 实现与磁盘不符，待 DuckyPC 核实」。**此冲突不在本方案内解决**，仅做客观呈现。

### 6.5 未来接 CI 的演进路径

- **阶段 1（MVP，当前）**：`gen-metrics.mjs` 本地运行 → 提交 `metrics.json` → 静态部署。
- **阶段 2**：GitHub Action / Vercel Build Step 在 push 时运行脚本，自动提交或注入 `metrics.json`（仍静态）。
- **阶段 3（运行时 fetch）**：`dataLoader.ts` 改为 `fetch` Vercel Analytics / CI API / brain 信封接口，实时拉取 DORA、业务指标、CI 结果；`manual.json` 仍保留人工覆盖层。store/services 接口不变，仅切换 `dataLoader` 实现。

---

## 7. 路由与导航实现

### 7.1 vue-router 路由表

```ts
[
  { path: '/', name: 'home', component: HomeDashboard, meta: { title: '宇宙综合面板' } },
  { path: '/app/:key', name: 'app-detail', component: AppDetail, meta: { title: '子项目详情' } },
  { path: '/candidates', name: 'candidates', component: CandidateMatrix, meta: { title: '候选矩阵' } },
  { path: '/candidates/:categoryId', name: 'candidate-list', component: CandidateList, meta: { title: '候选清单' } },
  { path: '/governance', name: 'governance', component: GovernanceView, meta: { title: '治理透视' } },
]
```

> 路由基路径：Vite `base: '/workbench/'`，`vue-router` `createWebHistory('/workbench/')`，确保 `/workbench/...` 深链在 `vercel.json` rewrite 下正确解析（遵守 L2-C2 内部相对路径约定）。

### 7.2 导航实现要点

- **Sidebar**（App.vue 左侧）：固定菜单 = 首页 / 子项目(折叠:waimai,mart,brain) / 候选矩阵 / 治理透视。点击 `router.push`。
- **Breadcrumb**（App.vue 顶部）：基于 `route.matched` + `meta.title` 渲染，如 `首页 > 子项目 > waimai`；下钻链路 `首页卡片 → /app/waimai`、`矩阵簇 → /candidates/:id`。
- **Tab 壳**（AppDetail 内）：`el-tabs` 绑定子路由或本地状态；brain 额外渲染「契约信封/降级」Tab（依据 `appKey==='brain'` 条件渲染）。
- **下钻交互**：首页卡片 `@click → router.push('/app/'+key)`；矩阵簇 `@click → router.push('/candidates/'+categoryId)`。

---

## 8. 文件清单（相对路径）

```
whoknow-workbench/
├─ src/
│  ├─ main.ts
│  ├─ App.vue
│  ├─ router/index.ts
│  ├─ types/metrics.ts
│  ├─ services/dataLoader.ts
│  ├─ services/format.ts
│  ├─ stores/universe.ts
│  ├─ stores/apps.ts
│  ├─ stores/candidates.ts
│  ├─ stores/governance.ts
│  ├─ components/common/{StatusLight,MetricCard,SectionCard,TabBar}.vue
│  ├─ components/charts/{RadarChart,GanttChart,HeatmapChart,FunnelChart,LineChart,BarChart,RingChart}.vue
│  └─ components/modules/   # 首页各模块 + 子项目各 Tab + 治理各面板组件
├─ src/pages/
│  ├─ HomeDashboard.vue
│  ├─ AppDetail.vue
│  ├─ CandidateMatrix.vue
│  ├─ CandidateList.vue
│  └─ GovernanceView.vue
├─ scripts/gen-metrics.mjs
├─ public/data/metrics.json      # 脚本生成（提交）
├─ public/data/manual.json       # 人工维护（提交）
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
└─ package.json
```
**根仓库改动点（MVP 部署时）**：
- `vercel.json`：在 `rewrites` 数组追加 4 条 `/workbench*` 规则（§2.3）。
- `.gitignore`：追加 `!whoknow-workbench/dist/` 例外。

---

## 9. 实现里程碑 / 任务分解（按依赖顺序）

> 编号 T0x 为建议工程执行顺序；每个任务产物明确，依赖前置任务。

| ID | 任务 | 依赖 | 产物 |
|---|---|---|---|
| T01 | 脚手架：建 `whoknow-workbench/`（`package.json`/`vite.config.ts`/`tsconfig.json`/`index.html`/`main.ts`/`App.vue`/`router`），接入 Vue3+TS+Pinia+Element Plus+ECharts | — | 可 `npm run dev` 启动的空壳 SPA |
| T02 | 数据模型 + 数据管道：写 `types/metrics.ts`；实现 `scripts/gen-metrics.mjs`；产出 `public/data/metrics.json` 与初始 `manual.json` | T01 | 完整数据契约 + 静态数据文件 |
| T03 | 状态层：实现 4 个 Pinia store + `services/dataLoader.ts`（fetch+合并） | T02 | 响应式数据访问层 |
| T04 | 首页综合面板（P0 全量 + P1）：实现 §4.1 全部模块组件 + §5 图表封装 | T03 | 可交互首页驾驶舱 |
| T05 | 子项目详情页：AppDetail + 5 Tab 壳 + brain 专属信封/降级 Tab（§4.2） | T03, T04（复用图表/组件） | 三 App 详情页 |
| T06 | 候选矩阵页 + 治理透视页（§4.3/§4.4） | T03 | 矩阵下钻 + 宪法/红线看板 |
| T07 | 路由/导航集成：Sidebar + Breadcrumb + 下钻联动 + 全局样式打磨 | T04, T05, T06 | 完整 SPA 导航 |
| T08 | 部署接入：改 `vercel.json`（追加 rewrite）+ `.gitignore`（追加例外）+ 本地 `vite build` + 提交 `dist/` | T07 | `/workbench` 线上可用 |

> 关键路径：T01→T02→T03→(T04,T05,T06 并行)→T07→T08。P1 图表（雷达/热力/折线/契约树）可在 T04/T05 内一并实现，不单独成任务。

---

## 10. 风险与待明确事项

### 10.1 技术风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| ECharts 甘特（custom+timeline）实现复杂度高 | 路线图/里程碑排期开发耗时 | T04 优先用简化 custom 条形 + 时间轴；门禁行独立标注 |
| git 聚合脚本跨平台（Windows Git Bash）路径分隔符 | 目录分组错乱 | `gen-metrics.mjs` 用 `path.posix` 归一，CI 锁定 node>=20 |
| `metrics.json` 体积随 git 历史增长 | 加载变慢 | 仅聚合计数/周频，不存原始提交；C 类待建字段占位 |
| brain src 口径冲突导致 brain 数据失真 | 详情页/治理页误导 | 以磁盘为准 + 显式标注待核实（§6.4），不掩盖 |
| vercel.json rewrite 顺序冲突 | `/workbench` 路由 404 | 追加至数组末尾，复用 waimai/mart 已验证模式 |
| 多 App 共存红线误触 | 违反 L1-T5（事故级） | 仅改 vercel.json + .gitignore；code review 双人确认；禁 force push |

### 10.2 需用户最终拍板的确认项（回扣 PRD 待确认 + 主理人默认）

| # | 确认项 | 主理人推荐默认（已采纳于本方案） | 最终拍板权 |
|---|---|---|---|
| 1 | 技术栈 | Vue3+TS+Pinia+ECharts+Element Plus（§1） | 用户（默认已采用，可改 React/纯HTML） |
| 2 | 数据来源 | MVP 半静态：gen 脚本 + metrics.json + manual.json（§2.2/§6） | 用户（默认已采用，未来接 CI 见 §6.5） |
| 3 | 部署 | 新 App `whoknow-workbench/` + vercel.json `/workbench` rewrite（§2.3） | 用户（默认已采用） |
| 4 | brain src 口径 | 以磁盘为准（仅 docs/），标注 ROLES §6.5 冲突待 DuckyPC 核实，方案内不解决（§6.4） | 用户 + DuckyPC 核实 |
| 5 | 宪法红线可视化 | L1 5 条逐条绑状态灯；L2/L3 整体灯（§4.4） | 用户（默认已采用） |
| 6 | brain 信封 6 字段精确枚举 | 以 api-spec.md §信封 + roadmap §5（`app/category/persona_type/tone/memory_scope/fiction_flag`）为准，待与 api-spec 复核精确字段名 | 用户 + 701-PC（契约方） |
| 7 | 双实例负载数据 | MVP 由 git 目录分布自动派生（701-PC/DuckyPC），manual.json 可覆盖（§6.3） | 用户（默认派生） |

> 说明：PRD 原列「待确认问题」在本方案中按主理人 5 项默认方向落地；上表 6/7 为数据层派生补充确认项。所有默认均可在用户拍板后调整，方案已结构化以便替换。

---

## 附录 A：候选矩阵 16/8 数据来源

引用 `docs/studio/APP-MATRIX-ROADMAP.md`（2026-07-28 生成）：
- 16 候选：ride/fate/pet/weather/work/love/home/nav/salon/spa/ledger/move/rent/express/bar/cam
- 8 大类：A 出行 / B 到家服务 / C 变美健康 / D 居住 / E 消费钱包 / F 社交陪伴 / G 职场 / H 玄学日常
- 解锁门禁：金克木硬约束，任一款进入 Phase 1 前提 = waimai 真机 playtest PASS + mart v1 跑通；当前 `unlockGateStatus=false`。

## 附录 B：L1 真铁律 5 条（红线清单数据源）

引用 `CONSTITUTION.md` §L1（2026 版）：
- L1-T1 禁忌词红线 0 容忍
- L1-T2 配置与状态分离（玩家隐私底线）
- L1-T3 不害人·不违法·不互相踩·人格统一
- L1-T4 字段命名权威（跨 app 数据正确性底线）
- L1-T5 多 App 共存红线（部署安全底线，违反即事故）

## 附录 C：brain 4 级降级（契约中枢透视数据源）

引用 `whoknow-brain/docs/api-spec.md` §降级策略（4 层·质量优先）：
- L1 脑今日成功 → "🧠 今日 AI 更新"
- L2 脑昨日降级 → "⏰ 昨日 AI 内容"
- L3 静态 fallback → "🎭 经典段子"
- L4 全部失败 → "今天没新段子，喝杯水吧 ☕"（温和弹窗，绝不静默失败）
