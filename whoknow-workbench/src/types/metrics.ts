/**
 * 胡闹宇宙开发工作台 · 数据模型
 * 权威依据：docs/SYSTEM_DESIGN.md §3（数据模型）与 §6.2（metrics.json schema）
 *
 * source 标记口径：
 *   auto   —— scripts/gen-metrics.mjs 自动采集（git log 聚合 + docs/studio 文档正则解析）
 *   manual —— public/data/manual.json 人工维护（责任人见 SYSTEM_DESIGN §6.3）
 *   todo   —— 采集管道待建，MVP 阶段为 null/占位
 *
 * 与 SYSTEM_DESIGN §3 的差异：仅**新增可选字段与 UI 层辅助类型**（GitAggregate / ContractHub /
 * GanttRow / DataNote 等），既有字段名与类型零改动，向后兼容。
 */

// ── 基础枚举 ────────────────────────────────────────────────
export type SourceTag = 'auto' | 'manual' | 'todo';
export type AppStatus = 'live' | 'designing' | 'planning';
export type BuildStatus = 'pass' | 'fail' | 'unknown';
export type PlaytestGrade = 'A' | 'B' | 'C';
export type LightStatus = 'on' | 'off' | 'partial';
export type AutomationStatus = 'paused' | 'running' | 'done';
export type CategoryId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
export type RedLightId = 'L1-T1' | 'L1-T2' | 'L1-T3' | 'L1-T4' | 'L1-T5';

// ── A 类：自动采集 ──────────────────────────────────────────
export interface AutoMetrics {
  /** auto: 目录扫描 whoknow- 前缀子目录得到，去前缀后的短名（waimai / mart / brain） */
  appKey: string;
  /** auto: 由 STATUS 文档完成度 + dist/src 存在性推断 */
  appStatus: AppStatus;
  /** auto: 解析七阶段表连续 ✅ 数量（1-7） */
  milestonePhase: number;
  /** auto: 解析各 app 测试汇总行（waimai=45 / mart=12） */
  testPass: number;
  /** auto: 同上（waimai=45 / mart=12 / brain 无测试=0） */
  testTotal: number;
  /** auto: dist/ 产物存在性 + 文档构建结论 */
  buildStatus: BuildStatus;
  /** auto: git log 计数（限定改动落在该 app 目录的提交） */
  gitCommitsTotal: number;
  /** auto: 按改动文件顶层目录分组 */
  gitCommitsByDir: Record<string, number>;
  /** auto: 按 author 名分组 */
  gitAuthorDist: Record<string, number>;
  /** auto: 解析 APP-MATRIX-ROADMAP 候选数 */
  candidateCount: number;
  /** auto: 同上，大类数 */
  candidateCategories: number;
  /** auto: 解析路线图门禁段（金克木冻结 = false） */
  unlockGateStatus: boolean;
  /** auto（新增可选）：磁盘证据，用于口径追溯 */
  diskEvidence?: AppDiskEvidence;
  /** auto（新增可选）：完成度百分比 = milestonePhase / 7 */
  progressPct?: number;
  /** auto（新增可选）：该 app 归属实例（ROLES.md §6.5） */
  ownerInstance?: string;
  /** auto（新增可选）：中文展示名，如 胡闹外卖 */
  label?: string;
}

/** 磁盘核查证据（新增：支撑 SYSTEM_DESIGN §6.4 brain 口径冲突的客观呈现） */
export interface AppDiskEvidence {
  hasSrc: boolean;
  hasDist: boolean;
  hasDocs: boolean;
  docCount: number;
}

// ── C 类：可由 git 直接聚合（脚本生成，归 auto）─────────────
export interface CommitWeek {
  /** ISO 周标识，形如 2026-W31 */
  week: string;
  count: number;
}

export interface BizMetrics {
  laughRate: number | null;
  retention: number | null;
}

export interface DoraMetrics {
  deployFreq: number | null;
  leadTime: number | null;
  mtbf: number | null;
  mttr: number | null;
}

export interface DerivedMetrics {
  /** C→auto: git log 按 ISO 周分桶（MVP 已落地） */
  commitTimeseries: CommitWeek[];
  /** C: 未来接 CI；MVP 以 buildStatus 近似 */
  ciResult: BuildStatus;
  /** C: 待建，MVP=null */
  realtimeProgressPct: number | null;
  /** C: 待建 */
  playtestMetrics: null;
  /** C: 待建 */
  bizMetrics: BizMetrics;
  /** C: 待建 */
  dora: DoraMetrics;
}

// ── B 类：手动维护 ──────────────────────────────────────────
export interface HealthScore {
  /** 进度 0-100 */
  progress: number;
  /** 质量 0-100 */
  quality: number;
  /** 风险（数值越高越可控）0-100 */
  risk: number;
  /** 协作 0-100 */
  collab: number;
  /** 商业 0-100 */
  business: number;
}

export interface RedLight {
  id: RedLightId;
  title: string;
  status: LightStatus;
  evidence: string;
}

export interface LawStatus {
  id: string;
  title: string;
  status: LightStatus;
}

export interface ConstitutionLevel {
  l1: LawStatus[];
  l2: LawStatus[];
  l3: LawStatus[];
}

export interface DualInstanceLoad {
  '701-PC': number;
  DuckyPC: number;
}

export interface ManualMetrics {
  /** manual: 每 app 五维健康度 */
  healthScore: Record<string, HealthScore>;
  /** manual: 真机 playtest 判定（A 轻量 / B 自然回收 / C 全量），未跑为 null */
  playtestResult: Record<string, PlaytestGrade | null>;
  /** manual: brain 信封自动化状态，2026-09-03 为 paused（P0-C 暂停） */
  brainEnvelopeAutomation: AutomationStatus;
  /** manual: L1 真铁律 5 条状态 */
  redlightList: RedLight[];
  /** manual: 宪法三层状态 */
  constitutionLevel: ConstitutionLevel;
  /** manual: 双实例提交负载（可由 git 派生后人工复核覆盖） */
  dualInstanceLoad: DualInstanceLoad;
}

// ── 顶层聚合 ────────────────────────────────────────────────
export interface AppMetrics extends AutoMetrics, Partial<DerivedMetrics> {
  manual?: Pick<ManualMetrics, 'healthScore' | 'playtestResult' | 'brainEnvelopeAutomation'>;
}

export interface CandidateApp {
  /** 代号，如 whoknow-ride */
  code: string;
  /** 中文名，如 胡闹打车 */
  name: string;
  /** 复用度（★ 数量 1-5） */
  reuseLevel: number;
  categoryId: string;
  /** 新增可选：外衣品类（路线图 §2.0 第 3 列） */
  shell?: string;
  /** 新增可选：解锁档位（路线图 §4：M2 / M3 / M4） */
  unlockTier?: string;
  /** 新增可选：路线图小节号，如 2.1 */
  section?: string;
}

export interface CategoryCluster {
  id: CategoryId;
  /** 如 "A 出行 Mobility" */
  name: string;
  members: CandidateApp[];
  unlockGate: { status: boolean; condition: string };
}

export interface MilestonePhaseRow {
  phase: string;
  start: string;
  end: string;
  status: AppStatus;
  /** 新增可选：阶段完成标记与证据 */
  done?: boolean;
  evidence?: string;
}

export interface QualityGateRow {
  app: string;
  pass: number;
  total: number;
  /** 新增可选：门禁结论文案 */
  verdict?: string;
  buildStatus?: BuildStatus;
}

/** 新增：仓库级 git 聚合（AutoMetrics.gitCommitsTotal 为 app 级，二者口径不同） */
export interface GitAggregate {
  commitsTotal: number;
  commitsByDir: Record<string, number>;
  authorDist: Record<string, number>;
  commitTimeseries: CommitWeek[];
  branches: string[];
  firstCommitAt: string | null;
  lastCommitAt: string | null;
  /** true 表示 git 命令不可用，已降级为占位数据 */
  degraded: boolean;
}

export interface MetricsSource {
  gitRepo: string;
  statusDocs: string[];
}

export interface UniverseBundle {
  overallProgressPct: number;
  appStatusLights: AppMetrics[];
  milestoneGantt: MilestonePhaseRow[];
  candidateMatrix: CategoryCluster[];
  riskBoard: RedLight[];
  qualityGate: QualityGateRow[];
  /** 新增：仓库级 git 聚合，供贡献活跃度 / 双实例负载模块使用 */
  git: GitAggregate;
}

export interface GovernanceBundle extends ConstitutionLevel {
  redLights: RedLight[];
  /** 新增可选：门禁面板数据 */
  gate?: GateInfo;
}

export interface GateInfo {
  status: boolean;
  condition: string;
  prerequisites: string[];
  frozenBy: string;
}

export interface MetricsBundle {
  /** 如 2026-09-03.001 */
  schemaVersion: string;
  /** ISO8601 UTC */
  generatedAt: string;
  source: MetricsSource;
  universe: UniverseBundle;
  apps: AppMetrics[];
  candidates: { total: number; categories: CategoryCluster[] };
  governance: GovernanceBundle;
}

// ── 契约中枢（brain 信封 + 4 级降级，manual.json 维护）─────
export interface EnvelopeDimension {
  /** 信封字段名，如 meta.category */
  field: string;
  /** JSON 路径 */
  path: string;
  type: string;
  enumValues: string[];
  note: string;
}

export interface DegradeLevelRow {
  level: 'L1' | 'L2' | 'L3' | 'L4';
  trigger: string;
  watermark: string;
  dataSource: string;
  userVisible: string;
  /** 降级深度 1-4，用于排序与配色 */
  depth: number;
}

export interface ContractHub {
  /** 契约出处文档路径 */
  specRef: string;
  /** 契约版本，如 v2.2 */
  specVersion: string;
  envelope: EnvelopeDimension[];
  degrade: DegradeLevelRow[];
  automation: AutomationStatus;
}

// ── 数据口径备注（冲突与待核实项的客观呈现）────────────────
export interface DataNote {
  id: string;
  scope: string;
  text: string;
  severity: 'info' | 'warn';
}

/** manual.json 的完整载荷：ManualMetrics + 契约中枢 + 备注 */
export interface ManualPayload extends ManualMetrics {
  contract: ContractHub;
  notes: DataNote[];
}

/** dataLoader 合并 metrics.json 与 manual.json 后的运行时数据 */
export interface WorkbenchData extends MetricsBundle {
  manual: ManualMetrics;
  contract: ContractHub;
  notes: DataNote[];
}

// ── UI 层辅助类型 ──────────────────────────────────────────
export type GanttRowStatus = 'done' | 'active' | 'planned' | 'blocked';

export interface GanttRow {
  label: string;
  group: string;
  start: string;
  end: string;
  status: GanttRowStatus;
  detail: string;
}

export interface RadarIndicator {
  name: string;
  max: number;
}

export interface NamedSeries {
  name: string;
  values: number[];
}

export interface NamedValue {
  name: string;
  value: number;
  color?: string;
}

export interface HeatPoint {
  xIndex: number;
  yIndex: number;
  value: number;
}

export interface InstanceLoadRow {
  instance: string;
  dirs: Record<string, number>;
  total: number;
  scope: string;
}
