<script setup lang="ts">
/**
 * 环图（pie + radius 内外径）：状态占比 / 进度环。
 */
import type { EChartsOption } from 'echarts';
import type { NamedValue } from '@/types/metrics';
import { useChart } from './useChart';
import { CHART_PALETTE, LEGEND_BASE, TEXT_COLOR, MUTED_COLOR, TOOLTIP_BASE } from './palette';

const props = withDefaults(
  defineProps<{
    items: NamedValue[];
    height?: number;
    centerLabel?: string;
    centerValue?: string;
    showLegend?: boolean;
  }>(),
  {
    height: 220,
    centerLabel: '',
    centerValue: '',
    showLegend: true,
  },
);

function buildOption(): EChartsOption {
  return {
    color: CHART_PALETTE,
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'item',
      formatter: '{b}：{c}（{d}%）',
    },
    legend: props.showLegend
      ? { ...LEGEND_BASE, bottom: 0, left: 'center', icon: 'circle' }
      : { show: false },
    graphic:
      props.centerValue || props.centerLabel
        ? [
            {
              type: 'text',
              left: 'center',
              top: props.showLegend ? '38%' : '44%',
              style: {
                text: props.centerValue,
                fill: TEXT_COLOR,
                fontSize: 24,
                fontWeight: 600,
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                align: 'center',
              },
            },
            {
              type: 'text',
              left: 'center',
              top: props.showLegend ? '52%' : '58%',
              style: {
                text: props.centerLabel,
                fill: MUTED_COLOR,
                fontSize: 12,
                align: 'center',
              },
            },
          ]
        : [],
    series: [
      {
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['50%', props.showLegend ? '45%' : '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: '#171a23',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 4,
          label: { show: false },
        },
        labelLine: { show: false },
        data: props.items.map((item) => ({
          name: item.name,
          value: item.value,
          itemStyle: item.color ? { color: item.color } : undefined,
        })),
      },
    ],
  };
}

const { chartRef } = useChart(buildOption, () => props.items);
</script>

<template>
  <div ref="chartRef" class="wb-chart" :style="{ height: `${height}px` }" />
</template>

<style scoped>
.wb-chart {
  width: 100%;
}
</style>
