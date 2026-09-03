<script setup lang="ts">
/**
 * 交通灯状态色块（非 ECharts，SYSTEM_DESIGN §5）。
 * tone 直接给色值；也可传 status（LightStatus）由组件换算。
 */
import { computed } from 'vue';
import type { LightStatus } from '@/types/metrics';
import { lightColor, lightLabel } from '@/services/format';

const props = withDefaults(
  defineProps<{
    status?: LightStatus;
    color?: string;
    label?: string;
    caption?: string;
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
    clickable?: boolean;
  }>(),
  {
    status: undefined,
    color: '',
    label: '',
    caption: '',
    size: 'md',
    pulse: false,
    clickable: false,
  },
);

const dotColor = computed(() => props.color || lightColor(props.status));
const text = computed(() => props.label || lightLabel(props.status));
const dotSize = computed(() => ({ sm: 8, md: 11, lg: 15 })[props.size]);
</script>

<template>
  <div class="wb-light" :class="{ 'wb-light--click': clickable }">
    <span
      class="wb-light__dot"
      :class="{ 'wb-light__dot--pulse': pulse }"
      :style="{
        width: `${dotSize}px`,
        height: `${dotSize}px`,
        background: dotColor,
        boxShadow: `0 0 ${dotSize}px ${dotColor}66`,
      }"
      role="img"
      :aria-label="text"
    />
    <span class="wb-light__body">
      <span class="wb-light__label">{{ text }}</span>
      <span v-if="caption" class="wb-light__caption">{{ caption }}</span>
    </span>
  </div>
</template>

<style scoped>
.wb-light {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.wb-light--click {
  cursor: pointer;
}

.wb-light__dot {
  display: inline-block;
  border-radius: 50%;
  flex-shrink: 0;
}

.wb-light__dot--pulse {
  animation: wb-pulse 1.8s ease-in-out infinite;
}

.wb-light__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wb-light__label {
  font-size: 13px;
  color: var(--wb-text);
  line-height: 1.35;
}

.wb-light__caption {
  font-size: 11px;
  color: var(--wb-text-muted);
  line-height: 1.4;
}

@keyframes wb-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
