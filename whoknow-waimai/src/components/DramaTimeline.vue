<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { DramaEventOut } from '../engine/dramaEngine'

// 逐条 reveal：相邻间隔随机 1.5–4s；出餐慢阶段（事件自带 delay ≥ 45s）拉长到 2.5–4s。
// 仅 reveal 时机随机；剧情内容由 sliceDrama 确定性产出，此处零随机。
const props = withDefaults(
  defineProps<{
    events: DramaEventOut[]
    stepDelayMin?: number
    stepDelayMax?: number
  }>(),
  { stepDelayMin: 1500, stepDelayMax: 4000 }
)

const actorMeta: Record<string, { who: string; av: string; cls: string }> = {
  boss: { who: '老板', av: '🍳', cls: 'boss' },
  rider: { who: '骑手', av: '🛵', cls: 'rider' },
  system: { who: '系统', av: '⚙️', cls: 'system' },
}

const revealed = ref(0)
const performingIndex = ref(-1)
let timer: ReturnType<typeof setTimeout> | null = null

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// 第 idx 条登场前的等待：出餐慢阶段拉长，呼应 delay
function intervalFor(idx: number): number {
  const ev = props.events[idx]
  if (ev && typeof ev.delay === 'number' && ev.delay >= 45_000) {
    return rand(2500, props.stepDelayMax)
  }
  return rand(props.stepDelayMin, props.stepDelayMax)
}

function revealNext() {
  if (revealed.value >= props.events.length) {
    performingIndex.value = -1
    return
  }
  performingIndex.value = revealed.value
  revealed.value += 1
  if (revealed.value < props.events.length) {
    timer = setTimeout(revealNext, intervalFor(revealed.value))
  } else {
    // 最后一条演出中指示停留片刻再收起
    timer = setTimeout(() => {
      performingIndex.value = -1
    }, 1600)
  }
}

onMounted(() => {
  timer = setTimeout(revealNext, 400)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="timeline">
    <div class="row reveal-in" v-for="(ev, i) in events.slice(0, revealed)" :key="i">
      <div class="dot-col">
        <span class="av" :class="actorMeta[ev.actor]?.cls">{{ actorMeta[ev.actor]?.av }}</span>
        <span v-if="i < revealed - 1" class="line"></span>
      </div>
      <div class="txt">
        <span class="who">{{ actorMeta[ev.actor]?.who }}</span>{{ ev.text }}
        <span v-if="ev.moodDelta !== undefined" class="mood" :class="ev.moodDelta >= 0 ? '' : 'down'">{{ ev.moodDelta >= 0 ? '+' : '' }}{{ ev.moodDelta }}</span>
        <span v-if="ev.delay" class="delay">⏱{{ Math.round(ev.delay / 1000) }}s</span>
        <span v-if="performingIndex === i" class="performing">🎭 演出中…</span>
      </div>
    </div>
    <div v-if="revealed < events.length" class="pending">· · ·</div>
  </div>
</template>

<style scoped>
/* 入场动画：淡入 + 上移 */
.reveal-in {
  animation: revealIn 0.5s ease both;
}
@keyframes revealIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* 演出中指示：轻微呼吸，呼应「NPC 为你一条条演出」 */
.performing {
  display: inline-block;
  margin-left: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-orange);
  animation: blink 1s steps(2, jump-none) infinite;
}
@keyframes blink {
  50% {
    opacity: 0.35;
  }
}
.pending {
  text-align: center;
  color: var(--mt-text-3);
  letter-spacing: 4px;
  padding: 4px;
  font-size: 14px;
}
@media (prefers-reduced-motion: reduce) {
  .reveal-in {
    animation: none;
  }
  .performing {
    animation: none;
  }
}
</style>
