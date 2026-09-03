<script setup lang="ts">
/**
 * 雷达图：健康度五维（进度 / 质量 / 风险 / 协作 / 商业）。
 */
import type { EChartsOption } from 'echarts';
import type { NamedSeries, RadarIndicator } from '@/types/metrics';
import { useChart } from './useChart';
import {
  AXIS_LINE_COLOR,
  CHART_PALETTE,
  LEGEND_BASE,
  MUTED_COLOR,
  SPLIT_LINE_COLOR,
  TOOLTIP_BASE,
} from './palette';

const props = withDefaults(
  defineProps<{
    indicators: RadarIndicator[];
    series: NamedSeries[];
    height?: number;
  }>(),
  { height: 260 },
);

function buildOption(): EChartsOption {
  return {
    color: CHART_PALETTE,
    tooltip: { ...TOOLTIP_BASE, trigger: 'item' },
    legend: { ...LEGEND_BASE, bottom: 0, left: 'center', icon: 'circle' },
    radar: {
      center: ['50%', '46%'],
      radius: '62%',
      indicator: props.indicators.map((item) => ({ name: item.name, max: item.max })),
      axisName: { color: MUTED_COLOR, fontSize: 11 },
      axisLine: { lineStyle: { color: AXIS_LINE_COLOR } },
      splitLine: { lineStyle: { color: SPLIT_LINE_COLOR } },
      splitArea: {
        areaStyle: { color: ['rgba(110, 218, 120, 0.03)', 'rgba(139, 92, 246, 0.03)'] },
      },
    },
    series: [
      {
        type: 'radar',
        symbolSize: 5,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.16 },
        emphasis: { focus: 'series' },
        data: props.series.map((s) => ({ name: s.name, value: s.values })),
      },
    ],
  };
}

const { chartRef } = useChart(buildOption, () => [props.indicators, props.series]);
</script>

<template>
  <div ref="chartRef" class="wb-chart" :style="{ height: `${height}px` }" />
</template>

<style scoped>
.wb-chart {
  width: 100%;
}
</style>
