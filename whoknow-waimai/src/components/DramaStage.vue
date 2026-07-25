<template>
  <div class="drama-event" :class="[`phase-${event.phase}`, `actor-${event.actor}`]">
    <div class="meta">
      <span class="actor">{{ actorLabel }}</span>
      <span class="phase">{{ phaseLabel }}</span>
      <span v-if="event.moodDelta !== undefined" class="mood" :class="event.moodDelta >= 0 ? 'up' : 'down'">
        {{ event.moodDelta >= 0 ? '+' : '' }}{{ event.moodDelta }} 老板心情
      </span>
      <span v-if="event.delay" class="delay">⏱ {{ Math.round(event.delay / 1000) }}s</span>
    </div>
    <p class="text">{{ event.text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DramaEventOut } from '../engine/dramaEngine'

const props = defineProps<{ event: DramaEventOut }>()

const actorLabel = computed(
  () => ({ boss: '老板', rider: '骑手', system: '系统' }[props.event.actor] ?? props.event.actor)
)
const phaseLabel = computed(
  () => ({ accept: '接单', cook: '备餐', deliver: '配送', complete: '完成' }[props.event.phase] ?? props.event.phase)
)
</script>

<style scoped>
.drama-event {
  background: var(--wk-surface);
  border-radius: var(--wk-radius);
  padding: 14px 16px;
  margin: 10px 0;
}
.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 6px;
}
.meta .actor {
  font-weight: 700;
}
.meta .phase {
  color: var(--wk-dim);
}
.meta .mood.up {
  color: #6ee7a0;
}
.meta .mood.down {
  color: #ff7a7a;
}
.meta .delay {
  color: var(--wk-rider);
  margin-left: auto;
}
.text {
  margin: 0;
  line-height: 1.6;
  font-size: 15px;
}
</style>
