<script setup lang="ts">
import type { MoveId } from '../types/contract.ts'
import { MOVE_META } from '../config/moveMeta.ts'

const props = defineProps<{
  move: MoveId
  disabled?: boolean
  state?: 'none' | 'hit' | 'miss' | 'neutral'
  index?: number
}>()

const emit = defineEmits<{ (e: 'choose', move: MoveId): void }>()
const meta = MOVE_META[props.move]
</script>

<template>
  <!-- 4 选项卡（ASSET-SPECS §2.2）：icon + 文字双标识（非色相）；焦点环品牌橙；
       白底 + --fg 文字 + 轻阴影；hover/active 微交互；命中绿光 / 踩雷红边闪烁（瞬时，非失败屏） -->
  <button
    class="opt-card"
    :class="state"
    :disabled="disabled"
    :aria-label="`招式 ${meta.label}`"
    :style="{ animationDelay: (index ?? 0) * 70 + 'ms' }"
    @click="emit('choose', move)"
  >
    <span class="ico" aria-hidden="true">{{ meta.icon }}</span>
    <span class="lbl">{{ meta.label }}</span>
  </button>
</template>

<style scoped>
.opt-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg-2);
  color: var(--fg);
  font-size: var(--fs-base);
  text-align: left;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.15s var(--ease-smooth),
    box-shadow 0.15s var(--ease-smooth),
    border-color 0.15s;
  animation: opt-in 0.28s var(--ease-smooth) both;
}
.opt-card:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.opt-card:active:not(:disabled) {
  transform: scale(0.97);
}
.opt-card .ico {
  font-size: 22px;
  flex-shrink: 0;
}
.opt-card .lbl {
  font-weight: 600;
}
.opt-card:disabled {
  opacity: 0.6;
  cursor: default;
}

/* 轮内反馈：命中弱点绿光（非红叉）；踩雷轻微红边闪烁（瞬时游戏反馈，非失败屏） */
.opt-card.hit {
  border-color: var(--brand-green);
  box-shadow: var(--shadow-glow-green);
}
.opt-card.miss {
  animation: miss-flash 0.2s var(--ease-smooth);
}

@keyframes opt-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes miss-flash {
  0%,
  100% {
    border-color: var(--line);
  }
  50% {
    border-color: var(--c-error);
  }
}
@media (prefers-reduced-motion: reduce) {
  .opt-card {
    animation: none;
  }
}
</style>
