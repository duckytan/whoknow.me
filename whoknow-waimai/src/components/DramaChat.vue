<script setup lang="ts">
// DramaChat.vue — 真实商家 IM / 聊天 UI（拟真外壳）
//
// 设计规格：docs/designs/waimai-realism-shell-spec.md §2 / §5.4
//
// 把旧 DramaTimeline 的"逐条演出时间线"重包为真实 IM 聊天：
//   - 左：boss/rider/system；右：玩家选择气泡（chip 展示，纯渲染、零 <input>）
//   - "正在输入…"命名 NPC 打字指示，替代旧"🎭 演出中…"
//   - moodDelta / delay 改居中系统 pill（§2.5）
//   - 新消息 scrollIntoView 贴底；保留 revealIn 淡入上移
//
// 台词 text / 数据结构 一律不改（内核放大器）。消费 useDramaProgress 共享时钟。
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useDramaProgressInjected } from '../composables/useDramaProgress'
import type { DramaEventOut } from '../engine/dramaEngine'

interface Chip {
  id: string
  label: string
  emoji: string
}

const props = defineProps<{
  events: DramaEventOut[]
  addressChip?: Chip | null
  remarkChip?: Chip | null
}>()

const dp = useDramaProgressInjected()
const { revealedCount, typingIndex } = dp

const actorMeta: Record<string, { who: string; av: string; cls: string }> = {
  boss: { who: '老板', av: '🍳', cls: 'boss' },
  rider: { who: '骑手', av: '🛵', cls: 'rider' },
  system: { who: '系统', av: '⚙️', cls: 'system' },
}

const reducedMotion =
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 命名 NPC 打字指示（system 无打字，直接以 pill 呈现）
const typing = computed(() => {
  const i = typingIndex.value
  if (i < 0) return null
  const ev = props.events[i]
  if (!ev || ev.actor === 'system') return null
  if (i < revealedCount.value) return null
  const meta = actorMeta[ev.actor]
  return { actor: ev.actor, who: meta?.who ?? ev.actor }
})

// 时间戳：NPC 气泡记录 reveal 时刻墙钟
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}
function fmtNow(): string {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const revealTimes = ref<string[]>([])
watch(revealedCount, (n) => {
  while (revealTimes.value.length < n) revealTimes.value.push(fmtNow())
})
function timeFor(i: number): string {
  return revealTimes.value[i] ?? fmtNow()
}

// 新消息贴底
const rootEl = ref<HTMLElement | null>(null)
watch(revealedCount, () => {
  nextTick(() => {
    const el = rootEl.value
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' })
  })
})
onMounted(() => {
  nextTick(() => {
    const el = rootEl.value
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' })
  })
})

function fmtSigned(n: number): string {
  return n > 0 ? `+${n}` : `${n}`
}
function delaySeconds(ev: DramaEventOut): number {
  return ev.delay ? Math.round(ev.delay / 1000) : 0
}
</script>

<template>
  <div ref="rootEl" class="chat">
    <!-- 玩家选择气泡（右·显示性·非输入）：进入结果态立即作为首条渲染 -->
    <div class="msg right" v-if="props.addressChip || props.remarkChip">
      <div class="col">
        <div class="meta">
          <span class="who">你</span>
          <span class="time">刚刚</span>
        </div>
        <div class="bubble choice">
          <span class="chip" v-if="props.addressChip">
            <span class="ce">{{ props.addressChip.emoji }}</span>
            <span class="cl">{{ props.addressChip.label }}</span>
          </span>
          <span class="chip" v-if="props.remarkChip">
            <span class="ce">{{ props.remarkChip.emoji }}</span>
            <span class="cl">{{ props.remarkChip.label }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- NPC 事件气泡（左）+ mood/delay 系统 pill（居中） -->
    <template v-for="(ev, i) in props.events.slice(0, revealedCount)" :key="i">
      <div class="msg left reveal-in" :class="ev.actor">
        <div class="av" :class="ev.actor">{{ actorMeta[ev.actor]?.av }}</div>
        <div class="col">
          <div class="meta">
            <span class="who">{{ actorMeta[ev.actor]?.who }}</span>
            <span class="time">{{ timeFor(i) }}</span>
          </div>
          <div class="bubble">{{ ev.text }}</div>
        </div>
      </div>
      <div
        class="pill mood reveal-in"
        v-if="ev.moodDelta !== undefined && ev.moodDelta !== 0"
        :class="ev.moodDelta >= 0 ? 'up' : 'down'"
      >
        老板心情 {{ fmtSigned(ev.moodDelta) }} {{ ev.moodDelta > 0 ? '😊' : '😠' }}
      </div>
      <div class="pill delay reveal-in" v-else-if="ev.delay && ev.delay > 0">
        ⏱ {{ ev.phase === 'cook' ? '出餐较慢' : '骑手预计晚到' }} ＋{{ delaySeconds(ev) }}s
      </div>
    </template>

    <!-- 命名 NPC 打字指示（替代旧"🎭 演出中…"） -->
    <div class="msg left reveal-in" :class="typing?.actor" v-if="typing">
      <div class="av" :class="typing.actor">{{ actorMeta[typing.actor]?.av }}</div>
      <div class="col">
        <div class="bubble typing">
          <span class="dots"><i></i><i></i><i></i></span>
          {{ typing.who }}正在输入…
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat {
  background: var(--mt-card);
  padding: 14px 12px 18px;
  max-height: 62vh;
  overflow-y: auto;
}
.msg {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.msg.left {
  flex-direction: row;
}
.msg.right {
  flex-direction: row-reverse;
}
.av {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
.av.boss {
  background: var(--mt-yellow);
}
.av.rider {
  background: var(--role-rider);
}
.av.system {
  background: var(--mt-text-3);
}
.col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 78%;
}
.meta {
  display: flex;
  gap: 6px;
  align-items: baseline;
}
.msg.right .meta {
  flex-direction: row-reverse;
}
.who {
  font-size: 12px;
  font-weight: 700;
  color: var(--mt-text);
}
.time {
  font-size: 11px;
  color: var(--mt-text-3);
}
.bubble {
  background: #fff;
  border: 1px solid var(--mt-line);
  border-radius: 12px;
  border-top-left-radius: 4px;
  padding: 8px 11px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--mt-text);
  box-shadow: var(--shadow-card);
}
.msg.right .bubble {
  background: var(--mt-yellow);
  color: #1a1a1a;
  border-color: var(--mt-yellow-deep);
  border-radius: 12px;
  border-top-right-radius: 4px;
}
.bubble.choice {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}
.bubble.choice .chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 13px;
}
.bubble.choice .chip .ce {
  font-size: 14px;
}

/* 系统 pill（moodDelta / delay） */
.pill {
  align-self: center;
  margin: -4px 0 12px;
  background: rgba(0, 0, 0, 0.06);
  color: var(--mt-text-2);
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 999px;
  text-align: center;
}
.pill.mood.up {
  color: var(--brand-green);
}
.pill.mood.down {
  color: var(--mt-price);
}
.pill.delay {
  color: var(--role-rider);
}

/* 打字指示 */
.bubble.typing {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--mt-text-3);
  font-size: 12px;
}
.dots {
  display: inline-flex;
  gap: 3px;
}
.dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--mt-text-3);
  display: inline-block;
  animation: dotblink 1.2s infinite;
}
.dots i:nth-child(2) {
  animation-delay: 0.2s;
}
.dots i:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes dotblink {
  0%,
  80%,
  100% {
    opacity: 0.25;
  }
  40% {
    opacity: 1;
  }
}

/* 入场：淡入 + 上移（保留手感） */
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
</style>
