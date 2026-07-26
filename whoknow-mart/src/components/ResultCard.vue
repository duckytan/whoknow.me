<script setup lang="ts">
import type { RoundOutcome } from '../engine/martStateMachine.ts'
import type { Archetype } from '../types/contract.ts'
import GuideAvatar from './GuideAvatar.vue'
import GuideChip from './GuideChip.vue'

const props = defineProps<{
  outcome: Extract<RoundOutcome, 'WIN_BREAK' | 'WIN_ANTI'>
  archetype: Archetype
  name: string
  affinity: number
}>()

const isBreak = props.outcome === 'WIN_BREAK'
const title = isBreak ? '服了，下单吧' : '省钱了，下次别来'
const sub = isBreak ? '导购破防 · 反骨劝退失败' : '反套路赢 · 反消费胜利'
</script>

<template>
  <!-- 双胜利结算卡（ASSET-SPECS §2.3 / ART-BIBLE §2.4）：
       破防态(≥100) 与 反消费胜利态(≤0) 皆 success 绿框；
       归零态禁红叉、禁「你输了」文案（§2.4 红线 #5） -->
  <div class="result drama-pop" :class="outcome.toLowerCase()">
    <div class="top">
      <GuideAvatar :archetype="archetype" :size="56" />
      <div class="id">
        <span class="nm">{{ name }}</span>
        <GuideChip :archetype="archetype" />
      </div>
    </div>
    <h2 class="title">{{ title }}</h2>
    <p class="sub">{{ sub }}</p>
    <div v-if="!isBreak" class="stamp" aria-hidden="true">反套路赢</div>
    <p class="aff">破防度终值 {{ affinity }} / 100</p>
  </div>
</template>

<style scoped>
.result {
  position: relative;
  padding: 20px;
  text-align: center;
  animation: pop 0.3s var(--ease-spring) both;
}
.top {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-bottom: 12px;
}
.id {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.nm {
  font-weight: 800;
  color: var(--brand-orange);
}
.title {
  font-family: var(--font-title);
  font-size: var(--fs-2xl);
  color: var(--fg);
  margin: 4px 0;
}
.sub {
  font-size: var(--fs-sm);
  color: var(--fg-dim);
}
.aff {
  margin-top: 10px;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--fg-dim);
}
.stamp {
  position: absolute;
  top: 16px;
  right: 16px;
  font-family: var(--font-brush);
  font-size: var(--fs-lg);
  color: var(--brand-green);
  border: 2px solid var(--brand-green);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  transform: rotate(-12deg);
}
@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .result {
    animation: none;
  }
}
</style>
