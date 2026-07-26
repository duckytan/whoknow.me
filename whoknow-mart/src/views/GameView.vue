<script setup lang="ts">
import { ref } from 'vue'
import { L1MART } from '../config/l1mart.static.ts'
import {
  createRound,
  selectMove,
  isSuccess,
  type MartRoundState,
  type RoundOutcome,
  type MoveId,
} from '../engine/martStateMachine.ts'
import { MemoryEngine, MemStore } from '../store/memory.ts'

// 垂直切片核心循环：选招制对线（导购 4 选项位置随机 → 查矩阵 → 双胜利）
const guide = L1MART.guides[0]
const affinityCfg = L1MART.affinity
const moves = L1MART.moves.map((m) => m.id)
const mem = new MemoryEngine(new MemStore())

const state = ref<MartRoundState>(
  createRound({
    guideId: guide.id,
    guideArchetype: guide.archetype,
    moves,
    affinity: affinityCfg.initial,
    roundCap: affinityCfg.roundCap,
  }),
)
const outcome = ref<RoundOutcome | null>(null)
const message = ref('')

function choose(moveId: MoveId) {
  const res = selectMove(state.value, moveId, L1MART.matrix, affinityCfg)
  state.value = res.state
  outcome.value = res.outcome
  if (isSuccess(res.outcome)) {
    mem.recordOrder(guide.id, { affinityPeak: res.affinity })
    message.value = res.outcome === 'WIN_BREAK' ? '服了，下单吧！' : '省钱了，下次别来~'
  } else {
    message.value = `破防度 ${res.affinity} / ${affinityCfg.max}`
  }
}
</script>

<template>
  <section class="game">
    <h2>{{ guide.name }}</h2>
    <p>破防度：{{ state.affinity }} / {{ affinityCfg.max }} · 第 {{ state.round }} 轮</p>
    <div class="options">
      <button v-for="m in state.optionsThisRound" :key="m" @click="choose(m)">{{ m }}</button>
    </div>
    <p class="msg">{{ message }}</p>
  </section>
</template>

<style scoped>
.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}
.options button {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.msg {
  color: var(--brand-orange);
  font-weight: 600;
}
</style>
