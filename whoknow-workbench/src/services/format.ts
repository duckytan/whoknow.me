/**
 * 数值 / 百分比 / 日期 / 状态文案格式化辅助（SYSTEM_DESIGN.md §2.1 services 层）。
 * 所有函数对 null / undefined / NaN 输入均返回安全占位串，不抛异常。
 */

import type {
  AppStatus,
  AutomationStatus,
  BuildStatus,
  GanttRowStatus,
  LightStatus,
  PlaytestGrade,
} from '@/types/metrics';
import { BRAND_ANCHORS, FIXED_COLORS } from '@/components/charts/palette';

export const PLACEHOLDER = '—';

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** 整数计数，千分位分隔 */
export function formatCount(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return PLACEHOLDER;
  return Math.round(value).toLocaleString('zh-CN');
}

/** 百分比，入参已是 0-100 的数值 */
export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (!isFiniteNumber(value)) return PLACEHOLDER;
  return `${value.toFixed(digits)}%`;
}

/** 比率，入参为 0-1 小数 */
export function formatRate(value: number | null | undefined, digits = 1): string {
  if (!isFiniteNumber(value)) return PLACEHOLDER;
  return `${(value * 100).toFixed(digits)}%`;
}

/** 通过数 / 总数，总数为 0 时标注无测试 */
export function formatPassRatio(pass: number | null | undefined, total: number | null | undefined): string {
  if (!isFiniteNumber(pass) || !isFiniteNumber(total)) return PLACEHOLDER;
  if (total === 0) return '无自动化测试';
  return `${pass}/${total}`;
}

/** 通过率 0-100 */
export function passPct(pass: number | null | undefined, total: number | null | undefined): number {
  if (!isFiniteNumber(pass) || !isFiniteNumber(total) || total <= 0) return 0;
  return Math.round((pass / total) * 100);
}

/** ISO 字符串 → YYYY-MM-DD */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return PLACEHOLDER;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO 字符串 → YYYY-MM-DD HH:mm */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return PLACEHOLDER;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(iso)} ${hh}:${mm}`;
}

/** ISO 周标识 2026-W31 → 2026 第 31 周 */
export function formatWeek(week: string | null | undefined): string {
  if (!week) return PLACEHOLDER;
  const match = /^(\d{4})-W(\d{1,2})$/.exec(week);
  if (!match) return week;
  return `${match[1]} 第 ${Number(match[2])} 周`;
}

/** ISO 周标识精简展示 W31 */
export function shortWeek(week: string | null | undefined): string {
  if (!week) return PLACEHOLDER;
  const match = /^(\d{4})-W(\d{1,2})$/.exec(week);
  if (!match) return week;
  return `W${match[2]}`;
}

// ── 状态文案与配色 ─────────────────────────────────────────

const APP_STATUS_LABEL: Record<AppStatus, string> = {
  live: '已上线',
  designing: '设计中',
  planning: '规划中',
};

const APP_STATUS_COLOR: Record<AppStatus, string> = {
  live: 'var(--wb-green)',
  designing: 'var(--wb-orange)',
  planning: 'var(--wb-gray)',
};

export function appStatusLabel(status: AppStatus | null | undefined): string {
  if (!status) return PLACEHOLDER;
  return APP_STATUS_LABEL[status] ?? status;
}

export function appStatusColor(status: AppStatus | null | undefined): string {
  if (!status) return 'var(--wb-gray)';
  return APP_STATUS_COLOR[status] ?? 'var(--wb-gray)';
}

export function appStatusTone(status: AppStatus | null | undefined): 'success' | 'warning' | 'info' {
  if (status === 'live') return 'success';
  if (status === 'designing') return 'warning';
  return 'info';
}

const LIGHT_LABEL: Record<LightStatus, string> = {
  on: '已落地',
  partial: '部分落地',
  off: '未落地',
};

const LIGHT_COLOR: Record<LightStatus, string> = {
  on: 'var(--wb-green)',
  partial: 'var(--wb-orange)',
  off: 'var(--wb-red)',
};

export function lightLabel(status: LightStatus | null | undefined): string {
  if (!status) return PLACEHOLDER;
  return LIGHT_LABEL[status] ?? status;
}

export function lightColor(status: LightStatus | null | undefined): string {
  if (!status) return 'var(--wb-gray)';
  return LIGHT_COLOR[status] ?? 'var(--wb-gray)';
}

const BUILD_LABEL: Record<BuildStatus, string> = {
  pass: '构建 PASS',
  fail: '构建 FAIL',
  unknown: '构建未知',
};

export function buildStatusLabel(status: BuildStatus | null | undefined): string {
  if (!status) return PLACEHOLDER;
  return BUILD_LABEL[status] ?? status;
}

export function buildStatusColor(status: BuildStatus | null | undefined): string {
  if (status === 'pass') return 'var(--wb-green)';
  if (status === 'fail') return 'var(--wb-red)';
  return 'var(--wb-gray)';
}

const AUTOMATION_LABEL: Record<AutomationStatus, string> = {
  paused: '暂停（P0-C）',
  running: '运行中',
  done: '已完成',
};

export function automationLabel(status: AutomationStatus | null | undefined): string {
  if (!status) return PLACEHOLDER;
  return AUTOMATION_LABEL[status] ?? status;
}

export function automationLight(status: AutomationStatus | null | undefined): LightStatus {
  if (status === 'done') return 'on';
  if (status === 'running') return 'partial';
  return 'off';
}

/* 甘特四色跨皮肤恒定（锚色 + 恒定语义色），经 palette 单一真源引用；值同 tokens.css 的 --wb-red/--wb-gray */
const GANTT_COLOR: Record<GanttRowStatus, string> = {
  done: BRAND_ANCHORS.green,
  active: BRAND_ANCHORS.orange,
  planned: FIXED_COLORS.gray,
  blocked: FIXED_COLORS.red,
};

export function ganttColor(status: GanttRowStatus): string {
  return GANTT_COLOR[status] ?? GANTT_COLOR.planned;
}

const GANTT_LABEL: Record<GanttRowStatus, string> = {
  done: '已完成',
  active: '进行中',
  planned: '规划中',
  blocked: '门禁冻结',
};

export function ganttLabel(status: GanttRowStatus): string {
  return GANTT_LABEL[status] ?? '规划中';
}

export function playtestLabel(grade: PlaytestGrade | null | undefined): string {
  if (!grade) return '未跑（口径待拍板）';
  const map: Record<PlaytestGrade, string> = {
    A: 'A 轻量',
    B: 'B 自然回收',
    C: 'C 全量',
  };
  return map[grade] ?? grade;
}

/** 复用度 → ★☆ 字符串（满 5 星） */
export function reuseStars(level: number | null | undefined): string {
  if (!isFiniteNumber(level)) return PLACEHOLDER;
  const filled = Math.max(0, Math.min(5, Math.round(level)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/** Record<string, number> → 按值降序的数组，便于图表消费 */
export function recordToPairs(record: Record<string, number> | null | undefined): { name: string; value: number }[] {
  if (!record) return [];
  return Object.entries(record)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** 目录桶名 → 展示短名（whoknow-waimai → waimai） */
export function shortDirName(dir: string): string {
  if (dir.startsWith('whoknow-')) return dir.slice('whoknow-'.length);
  if (dir === 'root') return '根门面';
  return dir;
}
