/**
 * 皮肤状态 store（T3 · 架构 §2.3）。
 * 职责：当前 skinId、解析后的图表容器色、布局/密度覆盖、应用与切换。
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SkinId, ChartTokenSet, Density } from '@/skins/types';
import { SKIN_REGISTRY } from '@/skins/registry';
import { resolveInitialSkin, persistSkin } from '@/composables/useSkin';

/** 数据序列色：两皮肤共用，引用 CSS 变量名（非 hex 字面量）；与 palette.CHART_PALETTE_VARS 保持一致 */
const DATA_SERIES_VARS = [
  '--wb-green',
  '--wb-orange',
  '--wb-purple',
  '--wb-blue',
  '--wb-yellow',
  '--wb-pink',
  '--wb-teal',
  '--wb-violet',
] as const;

/** 容器色：随皮肤切换，引用 --chart-* 变量名 */
const CONTAINER_VARS = {
  text: '--chart-text',
  muted: '--chart-muted',
  axisLine: '--chart-axis-line',
  splitLine: '--chart-split-line',
  tooltipBg: '--chart-tooltip-bg',
  tooltipBorder: '--chart-tooltip-border',
  legend: '--chart-legend',
  heatFrom: '--chart-heat-from',
  splitArea: '--chart-split-area',
  shadowColor: '--chart-shadow-color',
} as const;

function emptyChartTokens(): ChartTokenSet {
  return {
    text: '',
    muted: '',
    axisLine: '',
    splitLine: '',
    tooltipBg: '',
    tooltipBorder: '',
    legend: '',
    panel2: '',
    onAccent: '',
    fontFamily: '',
    heatFrom: '',
    splitArea: '',
    shadowColor: '',
    series: [],
  };
}

export const useSkinStore = defineStore('skin', () => {
  // ── 状态 ──
  const skinId = ref<SkinId>(resolveInitialSkin());
  const chartTokens = ref<ChartTokenSet>(emptyChartTokens());
  const layoutOverride = ref<Record<string, { layout?: string; density?: Density; hidden?: string[] }>>({});

  // ── 派生 ──
  const config = computed(() => SKIN_REGISTRY[skinId.value]);
  const density = computed<Density>(() => config.value.pages.home?.density ?? 'comfortable');

  // ── 动作 ──
  /** 经 getComputedStyle 重新解析 --chart-* 容器色与数据序列色（供 ECharts canvas） */
  function refreshChartTokens(): void {
    const cs = getComputedStyle(document.documentElement);
    const read = (name: string) => cs.getPropertyValue(name).trim();
    chartTokens.value = {
      text: read(CONTAINER_VARS.text),
      muted: read(CONTAINER_VARS.muted),
      axisLine: read(CONTAINER_VARS.axisLine),
      splitLine: read(CONTAINER_VARS.splitLine),
      tooltipBg: read(CONTAINER_VARS.tooltipBg),
      tooltipBorder: read(CONTAINER_VARS.tooltipBorder),
      legend: read(CONTAINER_VARS.legend),
      panel2: read('--wb-panel-2'),
      onAccent: read('--wb-on-accent'),
      fontFamily: read('--wb-font-mono'),
      heatFrom: read(CONTAINER_VARS.heatFrom),
      splitArea: read(CONTAINER_VARS.splitArea),
      shadowColor: read(CONTAINER_VARS.shadowColor),
      series: DATA_SERIES_VARS.map(read),
    };
  }

  /** 写 <html data-skin> + dark 类名 + 解析 chartTokens（幂等，可重复调用） */
  function apply(): void {
    const h = document.documentElement;
    h.setAttribute('data-skin', skinId.value);
    h.classList.toggle('dark', skinId.value !== 'paper-light');
    refreshChartTokens();
  }

  /** 按优先级链读取初始皮肤（首屏冷启动调用一次） */
  function resolveInitial(): void {
    skinId.value = resolveInitialSkin();
    apply();
  }

  /** 切换皮肤并持久化 localStorage['wb.skin'] */
  function setSkin(id: SkinId): void {
    skinId.value = id;
    persistSkin(id);
    apply();
  }

  /** 布局覆盖持久化键（per-page） */
  function layoutKey(page: string): string {
    return `wb.layout.${page}`;
  }

  function readLayoutOverride(page: string): void {
    try {
      const raw = localStorage.getItem(layoutKey(page));
      if (raw) layoutOverride.value[page] = JSON.parse(raw);
    } catch {
      /* 损坏的覆盖配置按无覆盖处理 */
    }
  }

  /** 更新某页布局覆盖（Dev 面板用）并持久化 localStorage['wb.layout.<page>'] */
  function setLayoutOverride(
    page: string,
    patch: { layout?: string; density?: Density; hidden?: string[] },
  ): void {
    const prev = layoutOverride.value[page] ?? {};
    layoutOverride.value[page] = { ...prev, ...patch };
    try {
      localStorage.setItem(layoutKey(page), JSON.stringify(layoutOverride.value[page]));
    } catch {
      /* 持久化失败不阻塞交互 */
    }
  }

  // 初始应用：保证首帧前 data-skin / dark 类名已就位（与 index.html 内联脚本双重保险）
  apply();
  readLayoutOverride('home');

  return {
    skinId,
    chartTokens,
    layoutOverride,
    config,
    density,
    resolveInitial,
    apply,
    setSkin,
    setLayoutOverride,
    refreshChartTokens,
  };
});
