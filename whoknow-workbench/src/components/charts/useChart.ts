/**
 * ECharts 实例生命周期封装：onMounted 初始化、依赖变更重绘、resize 监听、onBeforeUnmount dispose。
 * 每个图表组件各持一个独立实例（SYSTEM_DESIGN §5 图表封装约定）。
 */

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { useSkinStore } from '@/stores/skin';

export interface UseChartResult {
  chartRef: ReturnType<typeof ref<HTMLDivElement | null>>;
  render: () => void;
}

export function useChart(
  optionFactory: () => echarts.EChartsOption,
  depsGetter: () => unknown,
): UseChartResult {
  const chartRef = ref<HTMLDivElement | null>(null);
  let instance: echarts.ECharts | null = null;
  let observer: ResizeObserver | null = null;

  const render = (): void => {
    if (!instance) return;
    instance.setOption(optionFactory(), { notMerge: true, lazyUpdate: false });
  };

  const handleResize = (): void => {
    instance?.resize();
  };

  onMounted(() => {
    const el = chartRef.value;
    if (!el) return;
    instance = echarts.init(el, undefined, { renderer: 'canvas' });
    render();
    window.addEventListener('resize', handleResize);
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(handleResize);
      observer.observe(el);
    }
  });

  // 皮肤切换触发重绘：skinId 变更 → buildOption 重跑 → chartTokens 经 store 重新解析
  const skinStore = useSkinStore();
  watch([depsGetter, () => skinStore.skinId], () => render(), { deep: true });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (instance) {
      instance.dispose();
      instance = null;
    }
  });

  return { chartRef, render };
}
