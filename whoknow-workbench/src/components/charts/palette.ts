/**
 * 图表配色与公共样式片段。
 * 锚色遵循 CONSTITUTION.md L2-C5：绿 #6eda78 / 橙 #ff7849 / 紫 #8b5cf6 不可替换。
 */

export const CHART_PALETTE = [
  '#6eda78',
  '#ff7849',
  '#8b5cf6',
  '#38bdf8',
  '#fbbf24',
  '#f472b6',
  '#34d399',
  '#a78bfa',
];

export const TEXT_COLOR = '#c3cadb';
export const MUTED_COLOR = '#79819a';
export const AXIS_LINE_COLOR = '#333a4a';
export const SPLIT_LINE_COLOR = 'rgba(120, 130, 155, 0.16)';

export const GREEN = '#6eda78';
export const ORANGE = '#ff7849';
export const PURPLE = '#8b5cf6';
export const BLUE = '#38bdf8';
export const RED = '#ef4444';
export const GRAY = '#4b5563';

/** 统一 tooltip 外观 */
export const TOOLTIP_BASE = {
  backgroundColor: 'rgba(23, 26, 35, 0.96)',
  borderColor: '#333a4a',
  borderWidth: 1,
  padding: [8, 12] as [number, number],
  textStyle: { color: TEXT_COLOR, fontSize: 12 },
  extraCssText: 'box-shadow: 0 4px 18px rgba(0,0,0,0.45); border-radius: 6px;',
};

/** 统一图例外观 */
export const LEGEND_BASE = {
  textStyle: { color: MUTED_COLOR, fontSize: 11 },
  itemWidth: 10,
  itemHeight: 10,
  itemGap: 12,
};

/** 类目轴通用样式 */
export const CATEGORY_AXIS_BASE = {
  axisLine: { lineStyle: { color: AXIS_LINE_COLOR } },
  axisTick: { show: false },
  axisLabel: { color: MUTED_COLOR, fontSize: 11 },
  splitLine: { show: false },
};

/** 数值轴通用样式 */
export const VALUE_AXIS_BASE = {
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: MUTED_COLOR, fontSize: 11 },
  splitLine: { lineStyle: { color: SPLIT_LINE_COLOR, type: 'dashed' as const } },
};
