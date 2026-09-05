<script setup lang="ts">
/**
 * 雷达图：健康度五维（进度 / 质量 / 风险 / 协作 / 商业）。
 */
import type { EChartsOption } from 'echarts';
import type { NamedSeries, RadarIndicator } from '@/types/metrics';
import { useChart } from './useChart';
import { useSkinStore } from '@/stores/skin';
import { BRAND_ANCHORS, legendBase, tooltipBase } from './palette';

const props = withDefaults(
  defineProps<{
    indicators: RadarIndicator[];
    series: NamedSeries[];
    height?: number;
  }>(),
  { height: 260 },
);

function buildOption(): EChartsOption {
  const t = useSkinStore().chartTokens;
  return {
    color: t.series,
    tooltip: { ...tooltipBase(t), trigger: 'item' },
    legend: { ...legendBase(t), bottom: 0, left: 'center', icon: 'circle' },
    radar: {
      center: ['50%', '46%'],
      radius: '62%',
      indicator: props.indicators.map((item) => ({ name: item.name, max: item.max })),
      axisName: { color: t.muted, fontSize: 11 },
      axisLine: { lineStyle: { color: t.axisLine } },
      splitLine: { lineStyle: { color: t.splitLine } },
      splitArea: {
        /* 锚色 rgb 微透底纹：锚色值不变，仅透明度形式（L2-C5 允许的锚色家族用法） */
        areaStyle: { color: [`${BRAND_ANCHORS.green}08`, `${BRAND_ANCHORS.purple}08`] },
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
