<script setup lang="ts">
/**
 * 指标卡：主数值 + 单位 + 副标题 + 状态点 + 可选进度条。
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    unit?: string;
    caption?: string;
    accent?: string;
    dotColor?: string;
    progress?: number;
    clickable?: boolean;
  }>(),
  {
    unit: '',
    caption: '',
    accent: 'var(--wb-text)',
    dotColor: '',
    progress: -1,
    clickable: false,
  },
);

const showProgress = computed(() => props.progress >= 0);
const clampedProgress = computed(() => Math.max(0, Math.min(100, props.progress)));
</script>

<template>
  <div class="wb-metric" :class="{ 'wb-metric--click': clickable }">
    <div class="wb-metric__label">
      <span
        v-if="dotColor"
        class="wb-metric__dot"
        :style="{ background: dotColor, boxShadow: `0 0 8px ${dotColor}66` }"
      />
      <span>{{ label }}</span>
    </div>
    <div class="wb-metric__value" :style="{ color: accent }">
      {{ value }}
      <span v-if="unit" class="wb-metric__unit">{{ unit }}</span>
    </div>
    <div v-if="showProgress" class="wb-metric__bar">
      <span
        class="wb-metric__bar-fill"
        :style="{ width: `${clampedProgress}%`, background: accent }"
      />
    </div>
    <div v-if="caption" class="wb-metric__caption">{{ caption }}</div>
  </div>
</template>

<style scoped>
.wb-metric {
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  padding: 10px 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wb-metric--click {
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.wb-metric--click:hover {
  border-color: var(--wb-green);
}

.wb-metric__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--wb-text-muted);
}

.wb-metric__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.wb-metric__value {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.25;
}

.wb-metric__unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--wb-text-muted);
  margin-left: 3px;
}

.wb-metric__bar {
  height: 4px;
  border-radius: 2px;
  background: #2a3040;
  overflow: hidden;
}

.wb-metric__bar-fill {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.wb-metric__caption {
  font-size: 11px;
  color: var(--wb-text-muted);
  line-height: 1.45;
}
</style>
