<script setup lang="ts">
/**
 * 柱状图：横向 / 纵向对比（双实例负载、目录提交分布、App 进度对比）。
 */
import type { EChartsOption } from 'echarts';
import type { NamedSeries } from '@/types/metrics';
import { useChart } from './useChart';
import {
  CATEGORY_AXIS_BASE,
  CHART_PALETTE,
  LEGEND_BASE,
  TOOLTIP_BASE,
  VALUE_AXIS_BASE,
} from './palette';

const props = withDefaults(
  defineProps<{
    categories: string[];
    series: NamedSeries[];
    height?: number;
    horizontal?: boolean;
    stack?: boolean;
    showLegend?: boolean;
    maxValue?: number;
  }>(),
  {
    height: 230,
    horizontal: false,
    stack: false,
    showLegend: false,
    maxValue: 0,
  },
);

function buildOption(): EChartsOption {
  const valueAxis = {
    type: 'value' as const,
    minInterval: 1,
    max: props.maxValue > 0 ? props.maxValue : undefined,
    ...VALUE_AXIS_BASE,
  };
  const categoryAxis = {
    type: 'category' as const,
    data: props.categories,
    ...CATEGORY_AXIS_BASE,
  };

  return {
    color: CHART_PALETTE,
    tooltip: { ...TOOLTIP_BASE, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: props.showLegend ? { ...LEGEND_BASE, top: 0, right: 0, icon: 'circle' } : { show: false },
    grid: {
      left: props.horizontal ? 96 : 46,
      right: 24,
      top: props.showLegend ? 30 : 14,
      bottom: 30,
    },
    xAxis: props.horizontal ? valueAxis : categoryAxis,
    yAxis: props.horizontal ? categoryAxis : valueAxis,
    series: props.series.map((s) => ({
      name: s.name,
      type: 'bar' as const,
      stack: props.stack ? 'total' : undefined,
      barMaxWidth: 26,
      itemStyle: { borderRadius: props.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
      label: {
        show: props.series.length === 1,
        position: props.horizontal ? 'right' : 'top',
        color: '#a7aec1',
        fontSize: 11,
      },
      emphasis: { focus: 'series' },
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
