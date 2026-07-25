<script setup lang="ts">
import type { DramaEventOut } from '../engine/dramaEngine'

defineProps<{ events: DramaEventOut[] }>()

const actorMeta: Record<string, { who: string; av: string; cls: string }> = {
  boss: { who: '老板', av: '🍳', cls: 'boss' },
  rider: { who: '骑手', av: '🛵', cls: 'rider' },
  system: { who: '系统', av: '⚙️', cls: 'system' },
}
</script>

<template>
  <div class="timeline">
    <div class="row" v-for="(ev, i) in events" :key="i">
      <div class="dot-col">
        <span class="av" :class="actorMeta[ev.actor]?.cls">{{ actorMeta[ev.actor]?.av }}</span>
        <span v-if="i < events.length - 1" class="line"></span>
      </div>
      <div class="txt">
        <span class="who">{{ actorMeta[ev.actor]?.who }}</span>{{ ev.text }}
        <span v-if="ev.moodDelta !== undefined" class="mood" :class="ev.moodDelta >= 0 ? '' : 'down'">{{ ev.moodDelta >= 0 ? '+' : '' }}{{ ev.moodDelta }}</span>
        <span v-if="ev.delay" class="delay">⏱{{ Math.round(ev.delay / 1000) }}s</span>
      </div>
    </div>
  </div>
</template>
