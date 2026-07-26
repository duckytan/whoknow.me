<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { L1MART } from '../config/l1mart.static.ts'
import {
  createRound,
  selectMove,
  isSuccess,
  type MartRoundState,
  type RoundOutcome,
  type MoveId,
} from '../engine/martStateMachine.ts'
import { MemoryEngine } from '../store/memory.ts'
import { BrowserKVStore } from '../store/localStore.ts'
import { DELTA } from '../types/contract.ts'
import AffinityMeter from '../components/AffinityMeter.vue'
import OptionCard from '../components/OptionCard.vue'
import DialogBubble from '../components/DialogBubble.vue'
import ResultCard from '../components/ResultCard.vue'

const route = useRoute()
const router = useRouter()

const guideId = computed(() => (route.params.guideId as string) ?? L1MART.guides[0].id)
const guide = computed(() => L1MART.guides.find((g) => g.id === guideId.value) ?? L1MART.guides[0])
const affinityCfg = L1MART.affinity
const moves = L1MART.moves.map((m) => m.id)

// PWA 单机持久化（localStorage 后端注入 MemoryEngine）
const mem = new MemoryEngine(new BrowserKVStore())

// 导购金句：按记忆分级桶（首触/回头客/真爱粉）从 lineBuckets 取真实台词（PHASE4-CONTENT §1），
// 轮内保持稳定；导购切换或重开时重 roll 一条。
const currentLine = ref<string>(pickLine())
function pickLine(): string {
  const tier = mem.getMemoryTier(guide.value.id)
  const bucket = guide.value.lineBuckets[tier] ?? guide.value.lineBuckets.first
  return bucket[Math.floor(Math.random() * bucket.length)]
}
// 导购切换（route param 变化）时重 roll，同导购内保持稳定
watch(guideId, () => {
  currentLine.value = pickLine()
})

const state = ref<MartRoundState>(
  createRound({
    guideId: guide.value.id,
    guideArchetype: guide.value.archetype,
    moves,
    affinity: affinityCfg.initial,
    roundCap: affinityCfg.roundCap,
  }),
)
const outcome = ref<RoundOutcome | null>(null)
const floatNum = ref<{ value: number; kind: 'hit' | 'miss' | 'neutral' } | null>(null)
const lastChosen = ref<MoveId | null>(null)
let floatTimer: ReturnType<typeof setTimeout> | null = null

// 双胜利皆 success（G-4 / ART-BIBLE §2.4）；归零态（WIN_ANTI）绝不红叉
const winOutcome = computed<Extract<RoundOutcome, 'WIN_BREAK' | 'WIN_ANTI'> | null>(() => {
  const o = outcome.value
  return o === 'WIN_BREAK' || o === 'WIN_ANTI' ? o : null
})

// 阶段文案（轻劝/狠劝/松动/破防在即/破防）— 非颜色独载（ACCESSIBILITY §7.2 L）
function stageText(aff: number): string {
  if (aff >= affinityCfg.max) return '破防'
  if (aff >= 75) return '破防在即'
  if (aff >= 50) return '松动'
  if (aff >= 25) return '狠劝'
  return '轻劝'
}

function choose(moveId: MoveId) {
  if (outcome.value) return
  const res = selectMove(state.value, moveId, L1MART.matrix, affinityCfg)
  state.value = res.state
  outcome.value = res.outcome
  lastChosen.value = moveId

  // 轮内反馈态（瞬时游戏反馈，非失败屏）：命中绿光 / 踩雷红边闪 / 中性上移
  const kind: 'hit' | 'miss' | 'neutral' =
    res.delta === DELTA.WEAKNESS ? 'hit' : res.delta === DELTA.MINE ? 'miss' : 'neutral'
  floatNum.value = { value: res.delta, kind }
  if (floatTimer) clearTimeout(floatTimer)
  floatTimer = setTimeout(() => (floatNum.value = null), 600)

  if (isSuccess(res.outcome)) {
    mem.recordOrder(guide.value.id, { affinityPeak: res.affinity, flags: [res.outcome] })
    mem.markSeen(guide.value.id)
    if (res.delta === DELTA.WEAKNESS) mem.markWeakpoint(guide.value.id)
    mem.markMoveSeen(moveId)
  }
}

function restart() {
  state.value = createRound({
    guideId: guide.value.id,
    guideArchetype: guide.value.archetype,
    moves,
    affinity: affinityCfg.initial,
    roundCap: affinityCfg.roundCap,
  })
  outcome.value = null
  lastChosen.value = null
  floatNum.value = null
  currentLine.value = pickLine()
}

function backHome() {
  router.push('/')
}
</script>

<template>
  <section class="game">
    <!-- 宿主伪装层顶栏（L1） -->
    <header class="host-nav">
      <div class="h-title">对线中</div>
      <div class="h-sub">{{ guide.name }}</div>
    </header>

    <div class="page-pad">
      <!-- 导购金句气泡（截图爆点，无水印） -->
      <DialogBubble
        :archetype="guide.archetype"
        :name="guide.name"
        :line="currentLine"
        :glow="!!(lastChosen && floatNum && floatNum.kind === 'hit')"
      />

      <!-- 破防度 meter（role=progressbar + aria + 数值 + 阶段文案） -->
      <div class="meter-wrap">
        <AffinityMeter
          :affinity="state.affinity"
          :min="affinityCfg.min"
          :max="affinityCfg.max"
          :stage="stageText(state.affinity)"
        />
        <div class="round">第 {{ state.round }} / {{ affinityCfg.roundCap }} 轮</div>
      </div>

      <!-- 选招制 4 选项卡（位置随机、icon+文字双标识） -->
      <div v-if="!outcome" class="options">
        <OptionCard
          v-for="(m, i) in state.optionsThisRound"
          :key="m + '-' + state.round + '-' + i"
          :move="m"
          :index="i"
          :state="lastChosen === m && floatNum ? floatNum.kind : 'none'"
          @choose="choose"
        />
      </div>

      <!-- 浮动反馈数字（+40 / −10 / +10） -->
      <div
        v-if="floatNum"
        class="float"
        :class="floatNum.kind"
        aria-hidden="true"
      >
        {{ floatNum.value > 0 ? '+' : '' }}{{ floatNum.value }}
      </div>

      <!-- 双胜利结算卡（归零态禁红叉） -->
      <ResultCard
        v-if="winOutcome"
        :outcome="winOutcome"
        :archetype="guide.archetype"
        :name="guide.name"
        :affinity="state.affinity"
      />
      <div v-if="winOutcome" class="actions">
        <button class="ghost" @click="backHome">回首页</button>
        <button class="host-cta inline" @click="restart">再来一局</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.game {
  position: relative;
}
.meter-wrap {
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.meter-wrap > :first-child {
  flex: 1;
}
.round {
  font-size: var(--fs-xs);
  color: var(--fg-dim);
  white-space: nowrap;
}
.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 0;
}
.float {
  position: absolute;
  left: 50%;
  top: 42%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: var(--fs-2xl);
  pointer-events: none;
  animation: floatUp 0.6s var(--ease-smooth) forwards;
}
.float.hit {
  color: var(--brand-green);
}
.float.miss {
  color: var(--c-error);
}
.float.neutral {
  color: var(--fg-dim);
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.actions .host-cta.inline {
  width: auto;
  flex: 1;
}
.ghost {
  flex: 1;
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--bg-2);
  color: var(--fg);
  font-weight: 700;
  font-size: var(--fs-base);
}
@keyframes floatUp {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-32px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .float {
    animation: none;
    opacity: 0;
  }
}
</style>
