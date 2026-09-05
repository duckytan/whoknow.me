/**
 * 图表配色与公共样式片段（T5 重写）。
 * ─────────────────────────────────────────────────────────────
 * 令牌分层：跨皮肤恒定色（锚色 + 恒定语义色）在此声明为唯一真源；
 * 随皮肤切换的容器色经 skin store 的 chartTokens（getComputedStyle 解析 --chart-*）注入，
 * canvas（ECharts）读不了 CSS var()，故必须解析为具体色值后再进 option。
 * 锚色遵循 CONSTITUTION.md L2-C5：绿 #6eda78 / 橙 #ff7849 / 紫 #8b5cf6 不可替换。
 */

import type { ChartTokenSet } from '@/skins/types';

/** 品牌锚色（L2-C5 硬约束：三值在任何皮肤中不变） */
export const BRAND_ANCHORS = {
  green: '#6eda78',
  orange: '#ff7849',
  purple: '#8b5cf6',
} as const;

/** 恒定语义色（明暗共用，值同 tokens.css 的 --wb-red / --wb-gray，集中于此以便 palette 侧引用） */
export const FIXED_COLORS = {
  red: '#ef4444',
  gray: '#4b5563',
} as const;

/** 热力图渐变中段（锚色绿的深化梯度，跨皮肤恒定；仅作数据编码非品牌呈现） */
export const HEAT_RAMP_MID = ['#2f5d47', '#4f9a63'] as const;

/** 数据序列色对应的 CSS 变量名（供 skin store 解析为具体色值；跨皮肤共用不变） */
export const CHART_PALETTE_VARS = [
  '--wb-green',
  '--wb-orange',
  '--wb-purple',
  '--wb-blue',
  '--wb-yellow',
  '--wb-pink',
  '--wb-teal',
  '--wb-violet',
] as const;

/** 统一 tooltip 外观（容器色随皮肤） */
export function tooltipBase(t: ChartTokenSet) {
  return {
    backgroundColor: t.tooltipBg,
    borderColor: t.tooltipBorder,
    borderWidth: 1,
    padding: [8, 12] as [number, number],
    textStyle: { color: t.text, fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 18px rgba(0,0,0,0.45); border-radius: 6px;',
  };
}

/** 统一图例外观 */
export function legendBase(t: ChartTokenSet) {
  return {
    textStyle: { color: t.legend, fontSize: 11 },
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 12,
  };
}

/** 类目轴通用样式 */
export function categoryAxisBase(t: ChartTokenSet) {
  return {
    axisLine: { lineStyle: { color: t.axisLine } },
    axisTick: { show: false },
    axisLabel: { color: t.muted, fontSize: 11 },
    splitLine: { show: false },
  };
}

/** 数值轴通用样式 */
export function valueAxisBase(t: ChartTokenSet) {
  return {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: t.muted, fontSize: 11 },
    splitLine: { lineStyle: { color: t.splitLine, type: 'dashed' as const } },
  };
}
