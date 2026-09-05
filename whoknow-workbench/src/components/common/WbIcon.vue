<script setup lang="ts">
/**
 * 功能图标（T8 · BRAND §13）：自绘 SVG，24×24 网格、1.5px 线宽、round 端点，
 * 零新增运行时依赖（PRD Q4 拍板：不用 @element-plus/icons-vue / lucide）。
 * 颜色跟随 currentColor；装饰场景由调用方加 aria-hidden，功能按钮加 aria-label。
 */
const props = withDefaults(
  defineProps<{
    /** 图标名：dashboard | brain | bag | cart | matrix | shield | palette | gauge */
    name: string;
    size?: number;
  }>(),
  { size: 16 },
);
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="props.name === 'dashboard'">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </template>
    <template v-else-if="props.name === 'brain'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17M3.5 12h17M6 6c2 2 2 4 0 6M18 6c-2 2-2 4 0 6" />
    </template>
    <template v-else-if="props.name === 'bag'">
      <path d="M6.5 8.5h11l-1 11.5h-9z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </template>
    <template v-else-if="props.name === 'cart'">
      <path d="M4 5h2l2.2 10.5h9.6L20 8H7" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="16.5" cy="19" r="1.4" />
    </template>
    <template v-else-if="props.name === 'matrix'">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" />
    </template>
    <template v-else-if="props.name === 'shield'">
      <path d="M12 3 19 5.8v5.4c0 4.7-3 7.8-7 9.8-4-2-7-5.1-7-9.8V5.8z" />
      <path d="M9 11.5l2.2 2.2L15.5 9.5" />
    </template>
    <template v-else-if="props.name === 'palette'">
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-.8 2-1.7 0-1.2-1-1.5-1-2.5 0-.9.8-1.6 2-1.6h1.7c2.1 0 3.8-1.6 3.8-3.7C20.5 6.6 16.7 3.5 12 3.5z" />
      <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="props.name === 'gauge'">
      <path d="M4.5 17a8.5 8.5 0 1 1 15 0" />
      <path d="M12 14.5 16 9.5" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </template>
  </svg>
</template>
