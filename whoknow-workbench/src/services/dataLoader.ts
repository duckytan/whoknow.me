/**
 * 运行时数据加载与合并（SYSTEM_DESIGN.md §2.2 / §6.3）。
 *
 * 流程：fetch(BASE_URL + 'data/metrics.json') 与 fetch(BASE_URL + 'data/manual.json')
 *       → 深度合并（manual.json 同名字段优先覆盖 metrics.json 的占位）
 *       → 返回 WorkbenchData 供 4 个 Pinia store 注入。
 *
 * 演进路径见 SYSTEM_DESIGN §6.5：接 CI 后仅替换本文件的取数实现，store 接口不变。
 */

import type {
  DataNote,
  ManualMetrics,
  ManualPayload,
  MetricsBundle,
  WorkbenchData,
} from '@/types/metrics';

const METRICS_PATH = 'data/metrics.json';
const MANUAL_PATH = 'data/manual.json';

/** 数据源不可用时的空壳，保证页面渲染不崩 */
export function createEmptyBundle(): MetricsBundle {
  return {
    schemaVersion: 'unavailable',
    generatedAt: '',
    source: { gitRepo: 'whoknow.me', statusDocs: [] },
    universe: {
      overallProgressPct: 0,
      appStatusLights: [],
      milestoneGantt: [],
      candidateMatrix: [],
      riskBoard: [],
      qualityGate: [],
      git: {
        commitsTotal: 0,
        commitsByDir: {},
        authorDist: {},
        commitTimeseries: [],
        branches: [],
        firstCommitAt: null,
        lastCommitAt: null,
        degraded: true,
      },
    },
    apps: [],
    candidates: { total: 0, categories: [] },
    governance: { l1: [], l2: [], l3: [], redLights: [] },
  };
}

export function createEmptyManual(): ManualMetrics {
  return {
    healthScore: {},
    playtestResult: {},
    brainEnvelopeAutomation: 'paused',
    redlightList: [],
    constitutionLevel: { l1: [], l2: [], l3: [] },
    dualInstanceLoad: { '701-PC': 0, DuckyPC: 0 },
  };
}

export function createEmptyData(): WorkbenchData {
  const bundle = createEmptyBundle();
  return {
    ...bundle,
    manual: createEmptyManual(),
    contract: {
      specRef: 'whoknow-brain/docs/api-spec.md',
      specVersion: 'unavailable',
      envelope: [],
      degrade: [],
      automation: 'paused',
    },
    notes: [],
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 深度合并：patch 的非空值覆盖 base；数组整体替换（不做逐元素合并）；
 * patch 中的 undefined / null 不覆盖 base 已有值。
 */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === undefined || patch === null) return base;
  if (Array.isArray(patch)) {
    return (patch.length > 0 ? patch : base) as unknown as T;
  }
  if (!isPlainObject(patch) || !isPlainObject(base)) {
    return patch as unknown as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (key.startsWith('_')) continue;
    const current = out[key];
    if (isPlainObject(value) && isPlainObject(current)) {
      out[key] = deepMerge(current, value);
    } else if (Array.isArray(value)) {
      out[key] = value.length > 0 ? value : (current ?? []);
    } else if (value !== undefined && value !== null) {
      out[key] = value;
    }
  }
  return out as unknown as T;
}

async function fetchJson<T>(relPath: string): Promise<T | null> {
  const base = import.meta.env.BASE_URL ?? '/';
  const url = `${base.endsWith('/') ? base : `${base}/`}${relPath}`;
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      console.warn(`[dataLoader] ${relPath} 响应异常 HTTP ${response.status}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[dataLoader] ${relPath} 读取失败：${message}`);
    return null;
  }
}

/** 合并结果附带的加载诊断，供页面标注数据可用性 */
export interface LoadDiagnostics {
  metricsOk: boolean;
  manualOk: boolean;
  messages: string[];
}

export interface LoadResult {
  data: WorkbenchData;
  diagnostics: LoadDiagnostics;
}

/**
 * 加载并合并工作台全部数据。
 * 任一数据源缺失时以空壳兜底，并在 diagnostics.messages 登记原因。
 */
export async function loadWorkbenchData(): Promise<LoadResult> {
  const messages: string[] = [];
  const [metricsRaw, manualRaw] = await Promise.all([
    fetchJson<MetricsBundle & { warnings?: string[] }>(METRICS_PATH),
    fetchJson<ManualPayload>(MANUAL_PATH),
  ]);

  const metricsOk = metricsRaw !== null;
  const manualOk = manualRaw !== null;

  if (!metricsOk) {
    messages.push('metrics.json 不可用：执行 npm run gen 生成自动采集数据');
  }
  if (!manualOk) {
    messages.push('manual.json 不可用：人工维护层缺失，健康度与红线状态为空');
  }

  const bundle = deepMerge(createEmptyBundle(), metricsRaw ?? {});
  if (Array.isArray(metricsRaw?.warnings)) {
    for (const w of metricsRaw.warnings) messages.push(`采集降级：${w}`);
  }

  const manualBase = createEmptyManual();
  const manual = deepMerge(manualBase, manualRaw ?? {});

  const contract = deepMerge(createEmptyData().contract, manualRaw?.contract ?? {});
  const notes: DataNote[] = Array.isArray(manualRaw?.notes) ? manualRaw.notes : [];

  // manual 覆盖：红线看板与宪法层级以人工维护为权威（自动采集仅提供标题兜底）
  const riskBoard = manual.redlightList.length > 0 ? manual.redlightList : bundle.universe.riskBoard;
  const governance = {
    ...bundle.governance,
    l1: manual.constitutionLevel.l1.length > 0 ? manual.constitutionLevel.l1 : bundle.governance.l1,
    l2: manual.constitutionLevel.l2.length > 0 ? manual.constitutionLevel.l2 : bundle.governance.l2,
    l3: manual.constitutionLevel.l3.length > 0 ? manual.constitutionLevel.l3 : bundle.governance.l3,
    redLights: riskBoard,
  };

  // 每个 app 挂上人工维护的健康度 / playtest / 自动化状态切片
  const apps = bundle.apps.map((app) => ({
    ...app,
    manual: {
      healthScore: manual.healthScore,
      playtestResult: manual.playtestResult,
      brainEnvelopeAutomation: manual.brainEnvelopeAutomation,
    },
  }));

  const data: WorkbenchData = {
    ...bundle,
    apps,
    universe: {
      ...bundle.universe,
      riskBoard,
      appStatusLights: apps.length > 0 ? apps : bundle.universe.appStatusLights,
    },
    governance,
    manual,
    contract: { ...contract, automation: manual.brainEnvelopeAutomation },
    notes,
  };

  return {
    data,
    diagnostics: { metricsOk, manualOk, messages },
  };
}
