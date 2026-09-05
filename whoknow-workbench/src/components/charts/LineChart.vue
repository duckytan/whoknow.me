<script setup lang="ts">
/**
 * 折线图：git 提交周频等时间序列趋势。
 */
import type { EChartsOption } from 'echarts';
import type { NamedSeries } from '@/types/metrics';
import { useChart } from './useChart';
import { useSkinStore } from '@/stores/skin';
import {
  categoryAxisBase,
  legendBase,
  tooltipBase,
  valueAxisBase,
} from './palette';

const props = withDefaults(
  defineProps<{
    categories: string[];
    series: NamedSeries[];
    height?: number;
    smooth?: boolean;
    area?: boolean;
    showLegend?: boolean;
  }>(),
  {
    height: 230,
    smooth: true,
    area: true,
    showLegend: false,
  },
);

function buildOption(): EChartsOption {
  const t = useSkinStore().chartTokens;
  return {
    color: t.series,
    tooltip: { ...tooltipBase(t), trigger: 'axis', axisPointer: { type: 'line' } },
    legend: props.showLegend ? { ...legendBase(t), top: 0, right: 0, icon: 'circle' } : { show: false },
    grid: { left: 44, right: 18, top: props.showLegend ? 30 : 14, bottom: 34 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.categories,
      ...categoryAxisBase(t),
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      ...valueAxisBase(t),
    },
    series: props.series.map((s, index) => ({
      name: s.name,
      type: 'line' as const,
      smooth: props.smooth,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { width: 2 },
      areaStyle: props.area
        ? {
            opacity: 0.18,
            color: t.series[index % t.series.length],
          }
        : undefined,
      data: s.values,
    })),
  };
}

const { chartRef } = useChart(buildOption, () => [props.categories, props.series]);
</script>

<template>
  <div ref="chartRef" class="wb-chart" :style="{ height: `${height}px` }" />
</template>

<style scoped>
.wb-chart {
  width: 100%;
}
</style>
