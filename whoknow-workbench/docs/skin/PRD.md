# 胡闹宇宙 · 开发工作台 · 换肤改造 产品需求文档（PRD）

> 交付角色：产品经理 许清楚（Xu）｜团队：software-workbench-skin
> 文档定位：方案文档，**零实现代码**；供架构师细化技术方案
> 事实基准日：**2026-09-05**（下文所有「现状」均指该日 `whoknow-workbench` 分支 `b26d9bd` 的代码状态）
> 约束来源：`CONSTITUTION.md` L2-C5（品牌视觉规范）、L2-C9（客观表述红线）、`BRAND.md` §2 / §3 / §12 / §13 / §15 / §17

---

## 〇、项目信息

| 项 | 值 |
|---|---|
| Language | 中文（简体） |
| Programming Language | TypeScript + Vue 3.4 SFC（Vite 构建）；样式为原生 CSS 变量体系（**非** Tailwind，属既有技术栈，不随本次改造更换） |
| Project Name | `workbench_skin_system` |
| 改造对象 | `D:\AI-Project\whoknow.me\whoknow-workbench` |
| 部署形态 | 内部开发工具，单实例（Vercel 静态托管，`/workbench` 路由），**唯一使用者为主理人 duckytan** |
| 关联硬约束 | L2-C5 锚色不可替换 + WCAG AA + 字体阵容；L2-C9 客观表述红线 |

### 原始需求复述（已转写为客观表述）

- **需求一**：采用**双皮肤 + 切换器**（深色一套 + 浅色一套，运行时可切换）。
- **需求二（主理人 duckytan 于 2026-09-05 提出）**：换肤范围不限于配色，须覆盖**页面布局、配图、字体、配色**全部维度；页面须**区域模块化**，使皮肤配置可直接调整各区域的布局。

### 2026-09-05 现状核查（实测，非估算）

| 核查项 | 实测结论 |
|---|---|
| 组件规模 | 21 个 `.vue` 组件（charts 7 + common 4 + modules 10）+ 5 个页面 + `App.vue` |
| 样式组织 | `src/styles/global.css` 单文件，`:root` 内 **18 个 `--wb-*` 变量**，中性冷灰（bg `#0f1117` / panel `#171a23` / text-muted `#79819a`） |
| 硬编码色值 | `grep -oE` 实测 **54 处匹配（分布在 45 行 / 13 个文件）**：`palette.ts` 22 处、5 个图表组件 11 处、`format.ts` 4 处、`App.vue` 3 处、其余 4 处 |
| 图表配色 | `src/components/charts/palette.ts` 硬编码 **14 个颜色常量**；`useChart.ts` L34 `echarts.init(el, undefined, …)` **未传主题**，ECharts 无法读取 CSS 变量 |
| Element Plus | `main.ts` L7 全量引入组件 + L9/L10 两个完整 CSS；**26 处 `<el-*>`** 涉及 7 个组件（el-row 6 / el-col 10 / el-tabs 1 / el-tab-pane 6 / el-steps 1 / el-step 1 / el-tree 1） |
| 深色挂载点 | `index.html` L2 **硬编码 `<html lang="zh-CN" class="dark">`**；`global.css` L68–112 的 `--el-*` 覆盖全部挂在 `html.dark` 下 → **2026-09-05 状态下浅色态零 Element Plus 主题覆盖** |
| 字体 | `global.css` L42 body 字体栈为 `Inter / Helvetica Neue / PingFang SC / Microsoft YaHei`；**未引入任何品牌字体文件**；`JetBrains Mono` 出现在 **11 处字体族声明（分布于 8 个文件：`AppDetail.vue` 4 处、`global.css` / `MetricCard.vue` / `AppStatusLightsModule.vue` / `CandidateMatrixModule.vue` / `CandidateList.vue` / `GovernanceView.vue` / `RingChart.vue` 各 1 处）**但无字体源，实际回退系统等宽字体 → **BRAND §3.1 阵容完全未落地** |
| 配图 | `public/` 下**仅 `data/metrics.json` 与 `data/manual.json`**，零图片资源；品牌标识为 `App.vue` L78 的 emoji `🛰️` |
| 数据驱动 | `HomeDashboard.vue` 硬编码 6 组 `el-row/el-col` 装配 10 个模块；`AppDetail.vue` 按 `section.kind` 分派渲染 **9 种 kind**（stat-grid / list / keywords / matrix / timeline / branches / shops / pairs / callout） |
| 品牌令牌 | 仓库根 `styles/design-tokens.css`（6712 B）已存在，用 `[data-theme="dark"|"light"]` 选择器 + BRAND §3.1 字体栈；**工作台未引用** |
| 无障碍 | `global.css` L133–144 已有 `:focus-visible` 与 `prefers-reduced-motion` 降级；`App.vue` L189 导航链接 `padding: 5px 11px` + 13px 字号 ≈ **27px 高，不满足 44px 触控** |

---

## 一、产品目标

| ID | 目标 | 一句话定义 | 可度量终点 |
|---|---|---|---|
| **G1** | 视觉合规 | 把工作台从 2026-09-05 现状的中性冷灰临时皮肤，升级为符合 `BRAND.md` §2.2（宇宙暗色）+ §2.3（产品浅色）的**双主题令牌体系**，锚色三色值在两套皮肤中完全不变，WCAG AA 全项达标 | 两套皮肤 × 5 页面，对比度 <4.5:1 的项数 = 0；锚色计算值三处完全一致 |
| **G2** | 布局可编排 | 建立「**皮肤 = 令牌集 + 区域布局声明**」机制，使皮肤能改变区域排列、模块变体、密度与视觉风格，而**不触碰任何业务数据** | 5 个页面的布局不再硬编码在页面组件里；切换皮肤后区域排布可见变化；皮肤配置文件中业务数值字符串数 = 0 |
| **G3** | 零内容侵入 | 全程保持 `metrics.json` / `manual.json` 数据驱动架构不变，换肤不引入任何编造数据，隐藏值标注纪律不退化 | 换肤前后两个数据文件 diff 为空；「待建管道」「待标定/隐藏」标注在两套皮肤下均存在且可读 |

---

## 二、用户故事

| ID | 用户故事 | 关联目标 |
|---|---|---|
| **US-1** | As 主理人 duckytan，I want 打开工作台即以深色宇宙皮肤呈现宇宙综合面板，so that 每日晨间巡检时的视觉氛围与 `whoknow.me` 主站一致，不必在两套视觉语言间来回适应 | G1 |
| **US-2** | As 主理人 duckytan，I want 在白天强光 / 投屏 / 长时间阅读场景切到浅色皮肤，so that 文字与图表在环境光干扰下仍保持清晰可读 | G1 |
| **US-3** | As 主理人 duckytan，I want 皮肤选择在浏览器端被持久化，so that 关闭再打开工作台时无需重复切换（注：localStorage 为 per-machine 存储，701-PC 与 DuckyPC 各自独立，见 Q6） | G1 |
| **US-4** | As 主理人 duckytan，I want 在浅色皮肤下巡检 waimai 详情页时，特征档案的 9 个 section 以纵向流水布局展开而非收进 5 个 Tab，so that 长文案可一屏扫完，不必点击 5 次切换 | G2 |
| **US-5** | As 主理人 duckytan，I want 做治理决策（红线 / 门禁）时，红黄绿状态灯在两套皮肤下都不单独依赖颜色承载，so that 状态判断在任何视觉条件与色觉条件下都可靠 | G1 |
| **US-6** | As 主理人 duckytan，I want 在皮肤配置中直接调整首页区域模块的排列与密度档位，so that 更换信息组织方式不必修改 Vue 组件源码 | G2 |
| **US-7** | As 主理人 duckytan，I want 换肤后页面所有数值仍来自 `metrics.json` / `manual.json`，so that 视觉改造不会引入编造指标，数据可信度不退化 | G3 |
| **US-8** | As 主理人 duckytan，I want 两套皮肤下的关键面板都达到可截图质量，so that 需向他人展示宇宙进展时能直接截图使用（对齐 `CONSTITUTION.md` L3-D4 截图价值优先） | G1 / G2 |

---

## 三、需求池

> 优先级定义 —— **P0**：本次改造必须交付，缺失则目标不成立；**P1**：目标成立后的体验增强，可延至下一迭代；**P2**：探索项，需先评估成本。

### 3.1 P0 · 必须交付（8 条）

---

#### R-P0-01　双主题设计令牌体系

**需求描述**
将 2026-09-05 现状 `:root` 下的 18 个 `--wb-*` 变量拆分为两层：

1. **品牌锚色层（不可替换，两套皮肤共用一份声明）** —— 胡闹绿 `#6eda78` / 橙红 `#ff7849` / 宇宙紫 `#8b5cf6`，对应 `BRAND.md` §2.1 与 L2-C5。
2. **主题语义层（按皮肤切换）** —— bg / bg-soft / panel / panel-2 / border / border-soft / text / text-dim / text-muted / radius / shadow / 语义色。

深色皮肤（`cosmos-dark`）语义层取值**必须**采用 `BRAND.md` §2.2 宇宙暗色色板：

| 令牌 | 取值 | 令牌 | 取值 |
|---|---|---|---|
| `--wb-bg` | `#0a0612` | `--wb-text` | `#ededef` |
| `--wb-bg-soft` | `#120a1a` | `--wb-text-dim` | `#a094b8` |
| `--wb-panel` | `#1a1126` | `--wb-text-muted` | `#6b6480` |
| `--wb-panel-2` | `#1a1126` 提亮档 | `--wb-border` | `#1f1828` |
| `--wb-border-soft` | `#1f1828` | `--wb-border-strong` | `#2a2236` |

浅色皮肤（`paper-light`）语义层采用 `BRAND.md` §2.3（bg `#f7f7f8` / bg-2 `#ffffff` / bg-3 `#f0f0f2` / line `#ededed` / line-2 `#dcdce0` / fg `#222222` / fg-dim `#666666` / fg-mute `#999999`）。

深色态下 2026-09-05 现状的中性冷灰（`#0f1117` / `#171a23` / `#262b36` / `#79819a`）全部作废。

**验收标准（可验证）**
1. `grep -rn "#0f1117\|#171a23\|#262b36\|#79819a" src/` 命中数 = **0**。
2. 两套皮肤下分别执行 `getComputedStyle(document.documentElement).getPropertyValue('--wb-green' | '--wb-orange' | '--wb-purple')`，计算值恒为 `rgb(110,218,120)` / `rgb(255,120,73)` / `rgb(139,92,246)`。
3. `cosmos-dark` 下 `--wb-bg` 计算值 = `rgb(10,6,18)`；`paper-light` 下 = `rgb(247,247,248)`。
4. 锚色声明在代码库中**仅出现一处**（集中常量文件），其余位置一律以 `var(--wb-*)` 引用。

**影响文件范围（架构师细化）**
- 重写 `src/styles/global.css`
- 新增 `src/styles/tokens.css`（锚色层 + 语义层骨架）
- 新增 `src/skins/tokens.cosmos-dark.css`、`src/skins/tokens.paper-light.css`
- 参考资产：仓库根 `styles/design-tokens.css`（已存在，需对齐选择器命名）

---

#### R-P0-02　主题切换器与持久化

**需求描述**
顶部导航右侧（`App.vue` L108 `.wb-app__meta` 区块之后）新增皮肤切换控件。切换行为落到 `<html data-skin="cosmos-dark|paper-light">` 属性上。

取值优先级链（由高到低）：
```
URL 查询参数 ?skin=  >  localStorage['wb.skin']  >  prefers-color-scheme  >  默认 cosmos-dark
```

**关键实现约束**
- 2026-09-05 现状 `index.html` L2 硬编码 `class="dark"`，Element Plus 2.7 依赖 `html.dark` 类名开启深色 CSS 变量。切换至浅色皮肤时**必须同步移除该类名**，故皮肤状态需同时驱动 `data-skin` 属性与 `dark` 类名。
- 首屏无闪烁：须在 `index.html` 内以**同步内联脚本**于 `<div id="app">` 渲染前写入 `data-skin`（2026-09-05 状态的 `index.html` 无 `<script>`，属新增，见 Q7）。

**验收标准**
1. 切换皮肤后按 F5 刷新，皮肤保持；清空 localStorage 后回落至 `prefers-color-scheme` 推导值。
2. 冷启动逐帧检查：从导航开始到首帧绘制，`body` 背景色始终为目标皮肤色，**无白闪 / 无黑闪**。
3. 键盘可达：Tab 可聚焦切换器，Enter/Space 触发切换；`:focus-visible` 焦点环 2px 且 offset 2px，对比度 ≥3:1。
4. 切换器触控区实测 **≥44×44px**（`BRAND.md` §13.3）。
5. `?skin=paper-light` 链接可直接以浅色皮肤打开，覆盖 localStorage。

**影响文件范围**
- `index.html`（内联同步脚本 + `class="dark"` 改由脚本注入）
- `src/main.ts`（挂载前应用皮肤）
- `src/App.vue`（切换器 UI）
- 新增 `src/stores/skin.ts`、`src/composables/useSkin.ts`

---

#### R-P0-03　ECharts 配色跟随皮肤

**需求描述**
`src/components/charts/palette.ts` 的 14 个硬编码颜色常量改为从皮肤令牌读取（运行时 `getComputedStyle` 解析，或由 `skin` store 以 TS 常量双份同步导出，二选一由架构师定）。`useChart.ts` 需新增皮肤依赖：皮肤切换时对全部 7 个图表组件（`BarChart` / `FunnelChart` / `GanttChart` / `HeatmapChart` / `LineChart` / `RadarChart` / `RingChart`）触发重绘。现有 `useChart.ts` L24 `setOption(option, { notMerge: true })` 已可满足重绘语义，复用即可。

配色分层原则：
- **锚色与数据序列色**：两套皮肤共用，不变（`CHART_PALETTE` 8 色）
- **容器色**：轴轴线、分割线、tooltip 背景/边框、图例文字、轴标签文字 —— 随皮肤切换

**验收标准**
1. 切换皮肤后 7 张图表在 **≤1 帧（≤16.7ms）** 内完成重绘，无残留旧色像素。
2. 浅色皮肤下，图表轴标签文字（`--chart-text-muted`）对 `--wb-panel` 底的对比度 **≥4.5:1**；tooltip 文字对 tooltip 底色对比度 ≥4.5:1。
3. `palette.ts` 中 hex 字面量数量 = **0**（锚色例外：以单一 `BRAND_ANCHORS` 常量集中声明，两套皮肤共用）。
4. 5 个图表组件内 11 处硬编码 hex 全部清零。

**影响文件范围**
- `src/components/charts/palette.ts`（重写）
- `src/components/charts/useChart.ts`（新增皮肤依赖）
- `src/components/charts/{Bar,Funnel,Heatmap,Radar,Ring}Chart.vue`（11 处 hex）
- `src/services/format.ts`（L176–179 的 4 处状态色，随语义层联动）

---

#### R-P0-04　Element Plus 跟随皮肤

**需求描述**
2026-09-05 现状 `global.css` L68–112 的 `--el-*` 覆盖全部挂在 `html.dark` 下，浅色态零覆盖 → 切到浅色皮肤后 el-tabs / el-steps / el-tree 会呈现 Element Plus 默认浅色，但与工作台令牌不一致，且深色态的局部覆盖（如 `AppDetail.vue` L503 / L657 的 `--el-color-primary: var(--wb-green)`）是硬编码在组件里的。

改造要求：
1. `--el-*` 覆盖扩展为两套：深色走 `html.dark`，浅色走 `html`（默认态），两套均指向 `--wb-*` 令牌。
2. 组件内散落的 `--el-color-primary` 局部覆盖（至少 `AppDetail.vue` 2 处）改为跟随令牌或上提至全局。
3. 7 个在用的 `el-*` 组件（el-row / el-col / el-tabs / el-tab-pane / el-steps / el-step / el-tree）在两套皮肤下均需目视核验。

**验收标准**
1. 浅色皮肤下 `el-tabs` 选中项文字对 `--wb-panel` 底对比度 ≥4.5:1；`el-tabs__nav-wrap::after` 分隔线在两套皮肤下均可见。
2. `el-tree` 展开箭头、节点 hover 底色、`el-steps` 完成态图标在两套皮肤下均可见（对比度 ≥3:1）。
3. `grep -rn "html\.dark" src/` 结果中，不存在仅覆盖单皮肤而另一皮肤缺失的 `--el-*` 变量（人工逐条核对）。
4. `grep -rn "el-color-primary" src/pages/ src/components/` 命中数 = 0。

**影响文件范围**
- `src/styles/global.css`（双份 `--el-*` 覆盖）
- `src/main.ts`（L9/L10 两个完整 CSS 的加载策略，见 Q8）
- `src/pages/AppDetail.vue`（L503 / L657 局部覆盖）
- `src/pages/CandidateMatrix.vue`、`src/pages/GovernanceView.vue`（核验）

---

#### R-P0-05　字体体系落地（BRAND §3.1 阵容）

**需求描述**
2026-09-05 现状工作台**未加载任何品牌字体**：`global.css` L42 的 body 字体栈为 `Inter / Helvetica Neue / PingFang SC / Microsoft YaHei / system-ui`，且 `Inter` 本身也无字体源；`JetBrains Mono` 出现在 **11 处字体族声明**（`AppDetail.vue` L867 / L912 / L961 / L987、`global.css` L116、`MetricCard.vue` L93、`AppStatusLightsModule.vue` L203、`CandidateMatrixModule.vue` L156、`CandidateList.vue` L156、`GovernanceView.vue` L221、`RingChart.vue` L49）中但无字体源，实际回退系统等宽字体。

须按 `BRAND.md` §3.1 建立四字号角色，并在**皮肤层允许角色映射切换**：

| 令牌 | 字体 | 深色皮肤用途 | 浅色皮肤用途 |
|---|---|---|---|
| `--wb-font-display` | **Bungee** | 顶栏字标、页面大标题 | 同（点缀） |
| `--wb-font-title` | **ZCOOL QingKe HuangYou**（站酷庆科黄油体） | 卡片标题、区块标题 | 可切换为 `Noto Sans SC` 700（长文阅读更稳） |
| `--wb-font-body` | **Inter** + **Noto Sans SC** | 全部正文与 UI | 同 |
| `--wb-font-mono` | **JetBrains Mono** | 数值、代码、标签 | 同 |

**硬约束**：`BRAND.md` §3.1 与 L2-C5 明令**禁用柳建毛草草书（Liu Jian Mao Cao）**；本次改造需在工作台侧显式建立该禁令的可校验痕迹。

**验收标准**
1. `document.fonts.check('16px Bungee')` 与 `document.fonts.check('16px "JetBrains Mono"')` 在两套皮肤下均为 `true`。
2. `grep -rni "Liu Jian Mao Cao\|柳建毛草" src/ ` 命中数 = **0**。
3. 字体加载失败（离线 / `fonts.googleapis.com` 不可达）时，回退栈可用，页面不破版、不出现豆腐块。
4. 字体以 `font-display: swap` + `<link rel="preconnect">` / `preload` 引入，首屏文字不出现长时间空白（FOIT ≤100ms）。
5. 全部 11 处硬编码 `JetBrains Mono` 字体族声明改为 `var(--wb-font-mono)`（ECharts 侧 `RingChart.vue` L49 的 `fontFamily` 改为读取令牌常量）。

**影响文件范围**
- 新增 `src/styles/fonts.css`（@font-face / @import + 回退栈）
- `src/styles/tokens.css`（4 个字号角色令牌）
- `src/styles/global.css`（L42 body 字体栈、L116 `.wb-mono`）
- `src/pages/AppDetail.vue`（4 处）、`CandidateList.vue`（1 处）、`GovernanceView.vue`（1 处）
- `src/components/common/MetricCard.vue`、`src/components/modules/AppStatusLightsModule.vue`、`src/components/modules/CandidateMatrixModule.vue`、`src/components/charts/RingChart.vue`

---

#### R-P0-06　区域布局注册表 + 皮肤布局声明（MVP 版）★核心

**需求描述**

建立「**区域（Region）→ 模块（Module）→ 变体（Variant）**」三层机制，使皮肤配置可声明页面布局：

```
皮肤 JSON
  ├─ tokens    → 指向令牌集（R-P0-01）
  ├─ fonts     → 字号角色映射（R-P0-05）
  └─ pages
       └─ home
            ├─ layout  : "home-spotlight"      ← 从「布局变体注册表」中选取（有限枚举）
            ├─ density : "comfortable"         ← 密度档位（comfortable | compact）
            └─ regions : [                     ← 模块 → 区域 的映射
                  { region: "hero",      module: "UniverseProgressModule", variant: "spotlight" },
                  { region: "rail",      module: "AppStatusLightsModule",  variant: "row" },
                  { region: "timeline",  module: "MilestoneGanttModule",   variant: "full" },
                  …
              ]
```

三层职责边界：

| 层 | 是什么 | 谁定义 | 是否含业务数据 |
|---|---|---|---|
| **Module** | 21 个现有 `.vue` 组件，登记进注册表（`id` / `component` / `dataRequirements`） | 代码 | 否（数据仍由 store / `metrics.json` 注入） |
| **Region** | 页面上的可放置槽位（如 `hero` / `rail` / `timeline` / `footer`） | 布局变体组件内定义 | 否 |
| **Layout Variant** | 一组区域与其栅格关系的**预设模板**，注册于 `src/skins/registry.ts` | 代码（新增变体需写 Vue 布局组件） | 否 |

**MVP 交付的布局变体（宇宙综合面板，3 个）**

| 变体 id | 结构 | 默认用于 |
|---|---|---|
| `home-classic` | 2026-09-05 现状六行 `el-row/el-col` 栅格的令牌化等价版（8/16、24、12/12、10/14、12/12、24） | `paper-light` |
| `home-spotlight` | 焦点式：`hero`（宇宙进度，4 列放大）+ `rail`（App 状态灯，8 列）+ `timeline` 全宽 + `pairL/pairR` 两列 + 四联区 + `footer` 全宽 | `cosmos-dark` |
| `home-dense` | 紧凑三列：10 个模块按 `auto-fill minmax(320px, 1fr)` 瀑布排布 | 备用 / Dev 面板可选 |

**MVP 边界 —— 明确不做**（成本失控防线）：
- ❌ 不做自由拖拽搭建器（等于做低代码平台，与「内部工具、唯一使用者」的定位不匹配）
- ❌ 不支持在配置中填写任意栅格数值（如 `span: 7.5`）
- ❌ 不支持运行时动态新增/注册布局变体
- ✅ **新增布局变体 = 写一个 Vue 布局组件并登记进注册表（代码动作）；选择变体 / 调整模块到区域的映射 / 调整密度 = 改配置（配置动作）**

**验收标准**
1. `HomeDashboard.vue` 中 `el-row` / `el-col` 硬编码清零，改为 `<SkinPage page="home" />` 单一入口渲染。
2. 切换皮肤后宇宙综合面板区域排布**可见变化**（`cosmos-dark` → spotlight 三区焦点；`paper-light` → classic 六行均分），且 **10 个模块全部仍在页面上**（功能不丢，见 Q3）。
3. 皮肤配置文件零业务数据：以脚本校验 `src/skins/*.json` 中不含 `public/data/metrics.json` 与 `manual.json` 内的任何数值字符串（如 `62`、`45/45`、`#6eda78` 除外——色值属令牌层）。
4. 皮肤声明了未注册的 `layout` id 时，页面**降级为 `home-classic`** 并在控制台输出 `[skin] unknown layout variant: <id>` 告警，不白屏。
5. 皮肤声明了未注册的 `module` id 时，该区域渲染占位块「模块未注册：<id>」，其余区域正常。
6. `SectionCard` / `MetricCard` / `StatusLight` 三个通用组件在两种布局变体下均不溢出、不压扁（1024 / 1440 / 1920 三个宽度实测）。

**影响文件范围**
- 新增 `src/skins/registry.ts`（模块注册表 + 布局变体注册表）
- 新增 `src/skins/layouts/HomeClassic.vue`、`HomeSpotlight.vue`、`HomeDense.vue`
- 新增 `src/skins/cosmos-dark.json`、`src/skins/paper-light.json`
- 新增 `src/skins/types.ts`（皮肤配置类型定义）
- 新增 `src/components/SkinPage.vue`（按皮肤声明渲染页面区域）
- 改造 `src/pages/HomeDashboard.vue`（移除硬编码栅格，保留页头与 store 消费）

---

#### R-P0-07　无障碍与品牌合规闸门（L2-C5）

**需求描述**
两套皮肤 × 5 个页面，逐条过 `BRAND.md` §17 完整无障碍清单：正文对比度 ≥4.5:1、大字（≥24px / ≥19px 粗）≥3:1、触控目标 ≥44×44px、焦点可见、`prefers-reduced-motion` 降级、状态不独载颜色、`<html lang="zh-CN">`、语义标签与 `aria-label`。

2026-09-05 现状已知欠账：
- `App.vue` L189–191 导航链接 `padding: 5px 11px` + 13px 字号 ≈ **27px 高，不满足 44px 触控**
- `global.css` L139–144 已有 `prefers-reduced-motion` 降级，但需覆盖本次新增组件（`SkinBackdrop` 光晕、切换器、布局变体组件）
- 装饰性元素（光晕、图标）缺 `aria-hidden`

**验收标准**
1. 两套皮肤 × 5 页面，axe-core 扫描对比度类问题 **0 项**；人工复核正文全部 ≥4.5:1、大字 ≥3:1。
2. 顶栏全部导航链接与皮肤切换器，实测触控区 **≥44×44px**。
3. 开启 `prefers-reduced-motion: reduce` 后，全部 `transition-duration` / `animation-duration` 计算值 ≤0.01ms；背景光晕降级为静态渐变（保留视觉，去除动画）。
4. 红黄绿状态灯在两套皮肤下均带**文字标签**（`StatusLight` 组件已有 `label` / `caption` 双字段，核验覆盖完整性），不单独依赖颜色。
5. 锚色在三处（深色 / 浅色 / 降级态）计算值完全一致。
6. 装饰性元素（`SkinBackdrop`、图标）均带 `aria-hidden="true"`。

**影响文件范围**
- `src/App.vue`（导航链接触控区）
- `src/styles/global.css`（reduced-motion 覆盖面）
- 全部 5 个页面 + 21 个组件（核验）
- 新增 `src/components/SkinBackdrop.vue`（R-P0-08）

---

#### R-P0-08　深色皮肤视觉精修（宇宙暗色氛围）

**需求描述**
按 `BRAND.md` §2.2 与 §6 建立两套皮肤的差异化的「氛围层」：

- **深色 `cosmos-dark`**：注入三处背景光晕 —— 左上紫 `rgba(139,92,246,.18)`、右下绿 `rgba(110,218,120,.10)`、中橙 `rgba(255,120,73,.06)`；卡片层级改用「低光晕替代投影」（`--shadow-glow-green` `0 0 24px rgba(110,218,120,.25)` / `--shadow-glow-orange` / `--shadow-card` `0 8px 24px rgba(0,0,0,.4)`）。
- **浅色 `paper-light`**：无光晕；卡片用标准投影 `--shadow-sm` `0 1px 2px rgba(0,0,0,.05)` / `--shadow-md` / `--shadow-lg`。

**验收标准**
1. 深色皮肤首页可见三处径向渐变光晕，且 `SkinBackdrop` 层 `pointer-events: none` 不影响任何交互（点击穿透实测）。
2. `prefers-reduced-motion` 下光晕**保留**（静态渐变非动画），不整体消失。
3. 光晕层 `z-index` 低于内容层且不产生横向滚动条（`overflow-x` 实测无溢出）。
4. 浅色皮肤下 `SkinBackdrop` 不渲染（或渲染为透明），卡片使用标准投影。
5. 两套皮肤下卡片 hover 反馈符合 `BRAND.md` §18.3（浅色 上移 2px + 阴影加深；深色 上移 2px + 绿光晕）。

**影响文件范围**
- 新增 `src/components/SkinBackdrop.vue`
- `src/styles/tokens.css`（光晕令牌 + 双套阴影）
- `src/components/common/SectionCard.vue`（`.wb-card` 阴影与 hover）
- `src/App.vue`（光晕层挂载点）

---

### 3.2 P1 · 体验增强（5 条）

---

#### R-P1-01　布局编排 Dev 面板（可视化切换，非拖拽）

**需求描述**
皮肤切换器展开面板中增加「布局」分组，提供：
- 每个页面的**已注册布局变体**下拉选择
- **密度档位**切换（comfortable / compact）
- **模块显隐**开关（按注册表列出的模块 id）
- 「导出 JSON」按钮：产出可直接粘贴回 `src/skins/*.json` 的配置文本

改动实时生效并写入 `localStorage['wb.layout.<pageId>']`（优先级高于皮肤 JSON 声明，低于 URL 参数）。

**验收标准**
1. 面板内切换布局变体后，页面重排完成时间 <100ms（10 个模块规模）。
2. 导出的 JSON 与手工修改 `src/skins/*.json` 的效果完全一致（diff 验证）。
3. 隐藏某模块后，其余模块的 store 数据订阅不报错；被隐藏模块的数据仍在 store 中（仅不渲染）。
4. 面板本身满足 44×44px 触控与键盘可达。

**影响文件范围**
- 新增 `src/components/SkinPanel.vue`
- 改造 `src/stores/skin.ts`、`src/components/SkinPage.vue`

---

#### R-P1-02　配图与图标体系

**需求描述**
2026-09-05 现状 `public/` 下仅有 `data/*.json`，零图片资源；品牌标识为 `App.vue` L78 的 emoji `🛰️`。按 `BRAND.md` §12 / §13 建立：

1. **顶栏字标**：Bungee 全小写 `whoknow` + 锚色 `?`（§12.1 / §12.4），替代 emoji，字标高度 ≥24px，四周留白 ≥h/4
2. **功能图标集**：24×24 网格、内容区留白 2px、线宽 2px（浅色）/1.5px（深色）、端点 round（§13.1）
3. **空状态插图**：数据缺失态、未找到子项目态（`AppDetail.vue` L451）
4. **App 卡片角标**：宿主形状 + 右下 16px 绿底白「?」（§12.5）

**验收标准**
1. 图标以 SVG 内联或 sprite 引入，无位图缩放（禁用 `@1x` 拉伸至 `@2x`）。
2. 装饰图标带 `aria-hidden="true"`；功能性图标按钮带 `aria-label`。
3. 图标颜色跟随 `--wb-fg-dim`（默认）/ `--wb-orange`（选中），两套皮肤下均可见（§13.2）。
4. 图标按钮触控区 ≥44×44px（用透明 padding 撑，§13.3）。
5. 字标在两套皮肤下使用 §12.4 合法变体（浅底用锚色彩标 / 暗底用反白标），不改色、不加投影（§12.6）。

**影响文件范围**
- 新增 `src/assets/icons/`（SVG sprite）、`src/assets/brand/`（字标）
- 新增 `src/components/common/WbIcon.vue`
- 改造 `src/App.vue`（L78 emoji 替换）、`src/pages/AppDetail.vue`（L451 空态）、`src/components/modules/AppStatusLightsModule.vue`

---

#### R-P1-03　其余 4 个页面的布局变体

**需求描述**
将 R-P0-06 机制推广至 `AppDetail` / `CandidateMatrix` / `CandidateList` / `GovernanceView`，每页注册 ≥2 个变体。示例：

| 页面 | 变体 A | 变体 B |
|---|---|---|
| `AppDetail` | `detail-tabs`（2026-09-05 现状：概览卡 + 特征档案卡 + el-tabs 五/六 Tab） | `detail-stacked`（概览卡 + 9 个 section 纵向流水展开 + 进度/质量/协作平铺，取消 Tab 点击） |
| `CandidateMatrix` | `matrix-grid`（2026-09-05 现状：漏斗 + 八簇网格） | `matrix-list`（漏斗 + 八簇纵向清单） |
| `GovernanceView` | `gov-panel`（2026-09-05 现状：Gate + L1 + L2/L3 分区） | `gov-flat`（红线平铺优先，Gate 上移为横幅） |

**验收标准**
1. 两套皮肤下 5 个页面的区域排布**均有差异**，且功能完整无缺失。
2. `AppDetail.vue` 中 9 种 `section.kind` 分派渲染在两套皮肤、两种变体（共 4 种组合）下均正常，无渲染空白。
3. `detail-stacked` 变体下，brain 专属「契约信封」Tab 内容仍可达（`el-tree` 六级字段树 + 四级降级列表）。

**影响文件范围**
- 改造 `src/pages/AppDetail.vue`、`CandidateMatrix.vue`、`CandidateList.vue`、`GovernanceView.vue`
- 新增 `src/skins/layouts/DetailTabs.vue`、`DetailStacked.vue`、`MatrixGrid.vue`、`MatrixList.vue` 等

---

#### R-P1-04　密度与留白档位

**需求描述**
`--wb-density` 令牌驱动间距档位，皮肤 JSON 可声明默认档位，Dev 面板可覆盖：

| 档位 | 区块间距 | 卡片内边距 | 卡片圆角 |
|---|---|---|---|
| `comfortable` | 24px（`--sp-6`） | 16px（`--sp-4`） | 12px |
| `compact` | 16px（`--sp-4`） | 10px | 8px |

**验收标准**
1. 切换档位后，全部 `SectionCard` 内边距与页面区块间距同步变化，无遗漏组件。
2. 紧凑档下文字不溢出、图表不被压扁（7 张图表在 1024 / 1440 宽度下实测高度 ≥180px）。
3. 文档站 200% 浏览器缩放下不破版（`BRAND.md` §17 文字缩放项）。

**影响文件范围**
- `src/styles/tokens.css`
- `src/components/common/SectionCard.vue`
- `src/skins/layouts/*`

---

#### R-P1-05　内容真实性纪律保持

**需求描述**
换肤全过程不得引入任何编造数据：
- `AppDetail.vue` L130–132 `fmtMetric()` 对 null 值返回「待建管道」的行为不得改变
- mart 克制矩阵 delta 等游戏运行时隐藏值仍标注「待标定/隐藏」
- 皮肤配置文件中禁止出现任何业务数值、文案、指标

**验收标准**
1. 换肤前后 `public/data/metrics.json` 与 `public/data/manual.json` 的 `git diff` 为**空**。
2. 两套皮肤下「待建管道」「待标定」「待补」（`AppDetail.vue` L396 文档缺失态）文案均存在，且对比度 ≥4.5:1。
3. 皮肤 JSON 的 schema 校验通过：仅允许 `tokens` / `fonts` / `pages[].layout` / `pages[].density` / `pages[].regions[]` 字段，出现任何数值型业务字段即报错。

**影响文件范围**
- `src/skins/*.json`
- 新增 `src/skins/validate.ts`（schema 校验 + 业务数据污染检测）
- `src/pages/AppDetail.vue`（核验，不改逻辑）

---

### 3.3 P2 · 探索项（需先评估成本）

| ID | 需求 | 说明 | 成本提示 |
|---|---|---|---|
| **R-P2-01** | 第三套皮肤（如「终端绿」单色示波器风） | 验证皮肤机制的可扩展性，需先确认锚色在三套皮肤中的呈现策略 | 低（机制就绪后仅新增一套令牌 + 一份 JSON） |
| **R-P2-02** | 自定义皮肤导入 / 导出 | 上传 JSON 即刻应用，无需重新构建 | 中（需运行时 schema 校验与降级） |
| **R-P2-03** | 皮肤对比页（`/skins` 路由） | 同屏并排对比两套皮肤的同一页面 | 中（需 iframe 或双实例渲染） |
| **R-P2-04** | 布局变体可视化拖拽编辑 | **高风险**：等于向低代码平台演化，与「内部工具、唯一使用者」定位不匹配 | **高，建议不做** |

---

## 四、UI 设计稿描述

### 4.1 顶部导航（两套皮肤通用结构，元素位置不变）

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  [whoknow?]  胡闹宇宙 · 开发工作台      宇宙综合面板  大脑  外卖  导购  │ 治理      │
│   字标        宇宙综合面板/子项目/…      ──────────────────────────  [候选矩阵]    │
│  (≥24px高)                                                           [治理透视]   │
│                                                        数据可用  2026-09-04  [◐▾] │
│                                                                          ↑       │
│                                                              皮肤切换器 44×44    │
└──────────────────────────────────────────────────────────────────────────────────┘
   ↑ 原有 emoji 🛰️ 位置（R-P1-02 替换为 Bungee 字标）
```

皮肤切换器展开态（P0 最简版 / P1 增布局分组）：

```
                                              ┌──────────────────────────┐
                                              │  皮肤                     │
                                              │  ● 宇宙暗色  cosmos-dark  │
                                              │  ○ 纸感浅色  paper-light  │
                                              ├──────────────────────────┤  ← P1 增
                                              │  布局（本页）              │
                                              │  [ 焦点式 spotlight  ▾ ]  │
                                              │  密度  (舒适│紧凑)        │
                                              │  ☐ 宇宙进度  ☐ 契约枢纽 … │
                                              │  [ 导出 JSON ]            │
                                              └──────────────────────────┘
```

### 4.2 宇宙综合面板 · 深色皮肤 `cosmos-dark` / 变体 `home-spotlight`

```
╔════════════════════════════════════════════════════════════════════════════════╗
║ ▓▒░ 紫晕 rgba(139,92,246,.18)                        绿晕 rgba(110,218,120,.10)░║
║                                                                                ║
║  宇宙综合面板                                              62%   数据截至 …     ║
║  胡闹宇宙项目开发工作台                                                         ║
║                                                                                ║
║  ┌──────────────────────┬──────────────────────────────────────────────────┐   ║
║  │  REGION hero         │  REGION rail                                      │   ║
║  │  ┌────────────────┐  │  ┌────────────┬────────────┬────────────┐         │   ║
║  │  │  宇宙进度        │  │  │ 胡闹大脑 🟢│ 胡闹外卖 🟡│ 胡闹导购 🟢│         │   ║
║  │  │                 │  │  │ 阶段 5/7   │ 阶段 5/7   │ 阶段 2/7   │         │   ║
║  │  │      62%        │  │  └────────────┴────────────┴────────────┘         │   ║
║  │  │  ▓▓▓▓▓▓▓▓░░░░  │  │                                                   │   ║
║  │  │  48px Bungee    │  │  ← 低光晕卡片（--shadow-glow-green），无标准投影   │   ║
║  │  └────────────────┘  │                                                   │   ║
║  ├──────────────────────┴──────────────────────────────────────────────────┤   ║
║  │  REGION timeline  里程碑甘特（全宽 · 七阶段）                              │   ║
║  │  ──●────●────●────◎────○────○────○──                                     │   ║
║  ├────────────────────────────────┬────────────────────────────────────────┤   ║
║  │  REGION pairL  候选矩阵         │  REGION pairR  健康雷达                 │   ║
║  │  (漏斗图 + Top 簇)              │  (RadarChart · 五维)                    │   ║
║  ├───────────┬──────────┬─────────┼──────────────┬─────────────────────────┤   ║
║  │ REGION    │ REGION   │ REGION  │ REGION       │ REGION                   │   ║
║  │ gate      │ risk     │ load    │ activity     │ contract(→footer)        │   ║
║  │ 质量门     │ 风险板    │ 双实例   │ 贡献活跃度    │                          │   ║
║  ├───────────┴──────────┴─────────┴──────────────┴─────────────────────────┤   ║
║  │  REGION footer  契约枢纽（全宽）                                          │   ║
║  ╰────────────────────────────────────────────────────────────────────────╯   ║
║                                                                                ║
║ ░ 中橙晕 rgba(255,120,73,.06)                                                  ║
╚════════════════════════════════════════════════════════════════════════════════╝
   ── 卡片：低光晕替代投影（BRAND §6 暗色）／ 字号：标题 ZCOOL 黄油体，数值 JetBrains Mono
```

### 4.3 宇宙综合面板 · 浅色皮肤 `paper-light` / 变体 `home-classic`

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  （无光晕层）                                                                   │
│  宇宙综合面板                                              62%   数据截至 …     │
│                                                                                │
│  ┌──────────────────┬──────────────────────────────────────────────────────┐   │
│  │  宇宙进度  (8)    │  App 状态灯  (16)                                     │   │
│  └──────────────────┴──────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │  里程碑甘特  (24)                                                        │   │
│  ├──────────────────────────────┬─────────────────────────────────────────┤   │
│  │  候选矩阵  (12)                │  健康雷达  (12)                          │   │
│  ├──────────────────────┬───────┴─────────────────────────────────────────┤   │
│  │  质量门  (10)         │  风险板  (14)                                     │   │
│  ├──────────────────────┼─────────────────────────────────────────────────┤   │
│  │  双实例负载  (12)      │  贡献活跃度  (12)                                 │   │
│  ├──────────────────────┴─────────────────────────────────────────────────┤   │
│  │  契约枢纽  (24)                                                          │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                                                                                │
│  ── 卡片：白底 #ffffff + --shadow-sm/md（BRAND §6 浅色）／ 无光晕                │
│  ── 字号阶梯整体上调一档（正文 14px→15px），便于强光/投屏阅读                     │
│  ── 标题字体切换为 Noto Sans SC 700（长文阅读稳定性优先于海报感）                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 两套皮肤的区域布局差异对照

| 维度 | `cosmos-dark` + `home-spotlight` | `paper-light` + `home-classic` |
|---|---|---|
| 区域数 | 8（hero / rail / timeline / pairL / pairR / gate / risk / footer） | 6 行（与 2026-09-05 现状等价） |
| 焦点策略 | 宇宙进度独占 hero 区，数值字号放大至 48px（Bungee） | 无焦点区，10 模块均分 |
| 密度 | comfortable（区块间距 24px） | comfortable → 可切 compact |
| 卡片层级 | 低光晕 `0 0 24px rgba(110,218,120,.25)` | 标准投影 `0 1px 2px rgba(0,0,0,.05)` |
| 背景氛围 | 三处径向光晕（紫/绿/橙） | 纯色 `#f7f7f8`，无装饰 |
| 标题字体 | ZCOOL 庆科黄油体（海报感） | Noto Sans SC 700（阅读稳定性） |
| 数值字体 | JetBrains Mono（共用） | JetBrains Mono（共用） |
| 模块集合 | 10 个全部在页（**功能对等**） | 10 个全部在页（**功能对等**） |

### 4.5 子项目详情页 · 两种布局变体线框

```
【detail-tabs · 深色默认】              【detail-stacked · 浅色默认】
┌────────────────────────┐             ┌────────────────────────┐
│ 概览卡（标题/状态灯/指标）│             │ 概览卡（同左）           │
├────────────────────────┤             ├────────────────────────┤
│ 特征档案卡              │             │ 特征档案 · 纵向流水      │
│ ┌──────────────────┐   │             │  ├ boundary callout     │
│ │ boundary callout │   │             │  ├ highlightStats       │
│ │ highlightStats   │   │             │  ├ pillars ×3           │
│ │ pillars          │   │             │  ├ section 1 (stat-grid)│
│ │ section ×N       │   │             │  ├ section 2 (list)     │
│ └──────────────────┘   │             │  ├ section 3 (keywords) │
├────────────────────────┤             │  ├ section 4 (matrix)   │
│ [进度][质量][协作]       │             │  ├ section 5 (timeline) │
│ [文档][指标][契约信封]   │             │  └ …（9 种 kind 全展开） │
│ ────────────────────   │             ├────────────────────────┤
│ Tab 内容区              │             │ 进度 · 七阶段（平铺）     │
│ (el-steps / el-tree)   │             ├────────────────────────┤
└────────────────────────┘             │ 质量 · 指标卡（平铺）     │
                                       ├────────────────────────┤
  点击 5–6 次切换内容                    │ 协作 · 双实例 lane       │
                                       └────────────────────────┘
                                         零点击，一屏流式阅读
```

---

## 五、待确认问题

> 以下 10 项为主理人 duckytan 原始需求中的含糊点或需决策的分叉，请逐项确认后再进入技术方案设计。

| # | 问题 | 背景事实（2026-09-05 实测） | 建议 |
|---|---|---|---|
| **Q1** | 「配图」具体指哪些？ | 工作台 `public/` 下**零图片资源**，仅 `data/*.json`；品牌标识为 `App.vue` L78 的 emoji `🛰️` | 请勾选：(a) 品牌字标（Bungee `whoknow` + 锚色 `?`，§12）(b) 功能图标集（24×24 SVG，§13）(c) 空状态/错误态插图 (d) 装饰性背景（光晕/网格/纹理）(e) App 卡片角标（§12.5）。**建议 MVP 取 (a)+(b)+(d)，(c)(e) 视成本放 P1** |
| **Q2** | 「皮肤里调整布局」的交互形态？ | 2026-09-05 现状 `HomeDashboard.vue` 硬编码 6 组 `el-row/el-col` | **方案 A（推荐）**：皮肤 JSON 声明布局变体 id + 模块→区域映射 + 密度档位；顶栏 Dev 面板可视化切换已注册变体并可导出 JSON；新增变体需写代码。**方案 B**：纯改 JSON 文件、重新构建生效（成本最低）。**方案 C**：拖拽搭建器 —— 不建议，等于做低代码平台。**请确认 A / B** |
| **Q3** | 两套皮肤是否必须 100% 功能对等？ | 首页 10 个模块、详情页 5–6 个 Tab、9 种 section kind | **建议原则：模块集合 100% 对等，呈现方式可不对等** —— 即两套皮肤下所有功能都可达，但区域排布、密度、字号、是否用 Tab 承载可以不同。请确认 |
| **Q4** | 是否接受引入新依赖？ | 2026-09-05 状态下运行时依赖仅 5 个（vue / vue-router / pinia / echarts / element-plus） | ① **图标**：建议**自绘 SVG sprite（零新增运行时依赖）**，而非引入 `@element-plus/icons-vue` 或 lucide（需额外评估与 §13 网格规范的一致性）。② **字体**：BRAND §3.1 阵容源自 Google Fonts，国内网络存在阻断风险，建议**自托管字体子集**（零外部依赖、首屏可控）；备选为保留 CDN + 系统字体回退。③ **axe-core**：仅 devDependencies，用于 P0-07 自动化核验。**请逐项确认** |
| **Q5** | 深色皮肤是否严格等于 `BRAND.md` §2.2 色板？ | 任务指令已明确「必须基于该色板」；但 §2.2 的 `--bg #0a0612` 与 2026-09-05 现状 `#0f1117` 差异显著，改造后工作台视觉会明显更「紫」 | 需确认接受该视觉变化（该变化同时使工作台与 `whoknow.me` 主站一致）。若接受，R-P0-01 的验收标准即可固化 |
| **Q6** | 皮肤偏好是否需要跨机同步？ | `localStorage` 为 per-machine 存储；主理人在 **701-PC 与 DuckyPC** 双机多实例并行开发 | **方案**：① 各机独立持久化（简单，推荐）+ ③ URL 参数 `?skin=` 分享（已列入 P0）。不建议写入 `manual.json`（会污染数据文件，违反 G3）。**请确认** |
| **Q7** | 首屏无闪烁是否接受 `index.html` 内联同步脚本？ | 2026-09-05 状态下 `index.html` 为纯静态，**无任何 `<script>`**；Element Plus 依赖 `html.dark` 类名 | 需在 `<head>` 内增加约 10 行同步脚本，于 `<div id="app">` 渲染前写入 `data-skin` 与 `dark` 类名。**请确认接受该内联脚本**（否则首屏必然闪白/闪黑） |
| **Q8** | Element Plus 是否借机改为按需引入？ | 2026-09-05 状态下 `main.ts` L7 全量引入组件 + L9/L10 两个完整 CSS；双主题改造后会同时加载明暗两套 CSS 变量 | 改为按需引入（`unplugin-vue-components` + `unplugin-auto-import`）可显著减少 CSS 体积，功能不变，但需新增 2 个 devDependencies 并调整构建配置。**请确认是否纳入本次范围** |
| **Q9** | 是否保留旧视觉的回滚开关？ | 2026-09-05 现状中性冷灰（`#0f1117` / `#171a23` / `#79819a`）将被整体替换 | 建议保留 `?skin=legacy` 指向 2026-09-05 现状令牌集，作为**对照与回滚出口**，在 P1 全部完成后移除。**请确认是否纳入 P0** |
| **Q10** | 布局变体注册表放在 `src/skins/` 还是 `public/data/`？ | `public/data/` 为数据驱动层（`metrics.json` 由 `npm run gen` 生成、`manual.json` 人工维护） | **建议放 `src/skins/`** —— 编译期类型安全、与组件同仓、随构建产物打包；放入 `public/data/` 会混淆「内容」与「呈现」两层，且与 G3（零内容侵入）冲突。**请确认** |

---

## 六、交付边界声明

1. **本次改造不改动** `public/data/metrics.json` 与 `public/data/manual.json` 的内容与生成逻辑（`scripts/gen-metrics.mjs`）。
2. **本次改造不新增业务数据源**：页面全部内容仍由 `metrics.json` / `manual.json` 驱动，皮肤只决定「怎么呈现」。
3. **本次 PRD 为零实现代码文档**；架构师据此产出技术方案与文件级改动清单。
4. 全文已按 `CONSTITUTION.md` L2-C9 回扫：机器指代使用 `701-PC` / `DuckyPC`，位置指代使用文件路径或角色名，时间敏感词均带 `2026-09-05` 日期锚，无读者相对代词与模糊指代。

---

*文档版本：v1.0 ｜ 事实基准日：2026-09-05 ｜ 交付角色：产品经理 许清楚（Xu）*
