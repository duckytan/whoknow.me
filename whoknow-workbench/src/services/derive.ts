/**
 * 派生计算：把自动采集的 git 聚合换算成模块可直接消费的视图数据。
 * 归属映射依据 ROLES.md §6.5 与 INDEX.md §8：701-PC 主责 mart + brain，DuckyPC 主责 waimai + 根门面。
 * manual.json 的 dualInstanceLoad 若非零则覆盖派生总量（SYSTEM_DESIGN §6.3 约定）。
 */

import type {
  CategoryCluster,
  DualInstanceLoad,
  GanttRow,
  GitAggregate,
  InstanceLoadRow,
  MilestonePhaseRow,
  NamedValue,
} from '@/types/metrics';
import { shortDirName } from './format';

export const INSTANCE_NAMES = ['701-PC', 'DuckyPC'] as const;
export type InstanceName = (typeof INSTANCE_NAMES)[number];

/** 目录桶 → 归属实例；未列出的桶归 shared（双实例共同改动） */
const DIR_OWNER: Record<string, InstanceName | 'shared'> = {
  'whoknow-mart': '701-PC',
  'whoknow-brain': '701-PC',
  'whoknow-waimai': 'DuckyPC',
  root: 'DuckyPC',
  docs: 'shared',
  data: 'DuckyPC',
  js: 'DuckyPC',
  styles: 'DuckyPC',
  archive: 'shared',
  'whoknow-workbench': 'shared',
};

const INSTANCE_SCOPE: Record<InstanceName, string> = {
  '701-PC': '主责 whoknow-mart + whoknow-brain（Agent-商城）',
  DuckyPC: '主责 whoknow-waimai + 根门面（Agent-外卖）',
};

export function ownerOfDir(dir: string): InstanceName | 'shared' {
  return DIR_OWNER[dir] ?? 'shared';
}

/** 双实例负载矩阵：实例 × 目录桶 提交数 */
export function deriveInstanceLoad(
  git: GitAggregate,
  override: DualInstanceLoad | null | undefined,
): InstanceLoadRow[] {
  const rows: InstanceLoadRow[] = INSTANCE_NAMES.map((instance) => ({
    instance,
    dirs: {},
    total: 0,
    scope: INSTANCE_SCOPE[instance],
  }));
  const sharedRow: InstanceLoadRow = {
    instance: '共同改动',
    dirs: {},
    total: 0,
    scope: '双实例均改动的共享目录（docs / archive / workbench）',
  };

  for (const [dir, count] of Object.entries(git.commitsByDir)) {
    const owner = ownerOfDir(dir);
    const target = owner === 'shared' ? sharedRow : rows.find((r) => r.instance === owner);
    if (!target) continue;
    target.dirs[dir] = (target.dirs[dir] ?? 0) + count;
    target.total += count;
  }

  const result = [...rows, sharedRow];

  // manual 覆盖：任一实例的人工值非 0 时以人工值为总量权威
  if (override) {
    for (const row of result) {
      if (row.instance === '701-PC' && override['701-PC'] > 0) row.total = override['701-PC'];
      if (row.instance === 'DuckyPC' && override.DuckyPC > 0) row.total = override.DuckyPC;
    }
  }

  return result;
}

/** 热力图所需的目录轴（按总提交量降序，最多 8 列） */
export function deriveLoadDirs(git: GitAggregate, limit = 8): string[] {
  return Object.entries(git.commitsByDir)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([dir]) => dir);
}

/** 作者分布 → 图表数据 */
export function deriveAuthorPairs(git: GitAggregate, limit = 6): NamedValue[] {
  return Object.entries(git.authorDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

/** 目录分布 → 图表数据（短名展示） */
export function deriveDirPairs(git: GitAggregate, limit = 8): NamedValue[] {
  return Object.entries(git.commitsByDir)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name: shortDirName(name), value }));
}

/** 候选解锁档位 → 合成排期区间（门禁冻结期内为方向性排期，非承诺日期） */
const TIER_WINDOW: Record<string, [string, string]> = {
  M2: ['2026-09-15', '2026-11-15'],
  M3: ['2026-11-15', '2027-02-15'],
  M4: ['2027-02-15', '2027-08-15'],
};

export function tierWindow(tier: string | undefined): [string, string] {
  return TIER_WINDOW[tier ?? 'M4'] ?? TIER_WINDOW.M4;
}

/**
 * 甘特行构建：里程碑七阶段（waimai 实际排期）+ 8 大类解锁窗口 + 门禁行。
 * 门禁未解锁时，全部候选类行标记 blocked（金克木冻结）。
 */
export function deriveGanttRows(
  milestoneGantt: MilestonePhaseRow[],
  categories: CategoryCluster[],
  gateOpen: boolean,
): GanttRow[] {
  const rows: GanttRow[] = [];

  for (const phase of milestoneGantt) {
    rows.push({
      label: phase.phase,
      group: '里程碑 · 胡闹外卖七阶段',
      start: phase.start,
      end: phase.end,
      status: phase.done ? 'done' : phase.status === 'designing' ? 'active' : 'planned',
      detail: phase.evidence ?? '',
    });
  }

  rows.push({
    label: '🔒 解锁门禁（金克木）',
    group: '门禁',
    start: '2026-07-28',
    end: gateOpen ? '2026-09-15' : '2026-12-31',
    status: gateOpen ? 'done' : 'blocked',
    detail: gateOpen
      ? '门禁已解锁'
      : 'waimai 真机 playtest 硬闸门 PASS + mart v1 跑通，二者全绿前禁止候选进入 Phase 1',
  });

  for (const cluster of categories) {
    const tiers = cluster.members.map((m) => m.unlockTier ?? 'M4');
    const earliest = tiers.includes('M2') ? 'M2' : tiers.includes('M3') ? 'M3' : 'M4';
    const [start, end] = tierWindow(earliest);
    rows.push({
      label: `${cluster.name}（${cluster.members.length} 款）`,
      group: '候选矩阵 · 8 大类成簇解锁',
      start,
      end,
      status: cluster.unlockGate.status ? 'planned' : 'blocked',
      detail: `${earliest} 档｜成员 ${cluster.members.map((m) => m.name).join('、')}`,
    });
  }

  return rows;
}

/** 候选推进漏斗：候选 → 已聚类 → 已立项 → 已上线 */
export function deriveFunnel(total: number, clustered: number, started: number, live: number): NamedValue[] {
  return [
    { name: `候选 backlog（${total}）`, value: Math.max(total, 1) },
    { name: `已聚类归档（${clustered}）`, value: Math.max(clustered, 1) },
    { name: `已立项在研（${started}）`, value: Math.max(started, 1) },
    { name: `已上线（${live}）`, value: Math.max(live, 1) },
  ];
}
