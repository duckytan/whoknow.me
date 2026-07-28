<script setup lang="ts">
// PushNotifier.vue — 美团 in-app toast 推送（拟真外壳 · 纯外壳 · 零胡闹）
//
// 设计规格：docs/designs/waimai-realism-shell-spec.md §3 / §5.5
// 用户拍板（决策2）：采用 §3.3 样式 B（美团 in-app toast）——浅色细条、
//   左侧小黄点 + 黑字、从顶部下滑、非模态、约 3500ms 自动消失。（非 iOS 锁屏 banner）
//
// 监听 useDramaProgress 的 phase 切换，4 phase → 4 条真实配送文案。
// Teleport 到 body，position:fixed 居中（与 .phone 对齐），避免被 .order-detail 裁剪。
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useDramaProgressInjected } from '../composables/useDramaProgress'
import { etaForAddress, fmtMMSS } from '../lib/eta'
import type { AddressTag } from '../engine/sliceDrama'

const props = defineProps<{
  addressTag?: AddressTag | ''
  shopName?: string
}>()

const dp = useDramaProgressInjected()
const { currentPhase } = dp

interface Toast {
  id: number
  title: string
  text: string
}
const toasts = ref<Toast[]>([])
let seq = 0
const live = new Set<ReturnType<typeof setTimeout>>()

function push(t: { title: string; text: string }): void {
  const id = ++seq
  toasts.value.push({ id, ...t })
  const tm = setTimeout(() => {
    live.delete(tm)
    toasts.value = toasts.value.filter((x) => x.id !== id)
  }, 3500)
  live.add(tm)
}

function toastFor(phase: string): { title: string; text: string } | null {
  switch (phase) {
    case 'accept':
      return { title: '商家已接单', text: `${props.shopName ?? '商家'}已确认您的订单` }
    case 'cook':
      return { title: '商家备餐中', text: '商家正在备餐，请稍候' }
    case 'deliver': {
      const eta = etaForAddress(props.addressTag)
      return { title: '骑手已取餐·配送中', text: `骑手已取餐，正在赶来（预计 ${fmtMMSS(eta)}）` }
    }
    case 'complete':
      return { title: '订单已送达', text: '订单已送达，请取餐 🎉' }
    default:
      return null
  }
}

onMounted(() => {
  // 首条 accept 在时钟启动前已置位，手动补发一次
  const t = toastFor('accept')
  if (t) push(t)
})
watch(currentPhase, (phase) => {
  const t = toastFor(phase)
  if (t) push(t)
})

onBeforeUnmount(() => {
  live.forEach((id) => clearTimeout(id))
  live.clear()
})
</script>

<template>
  <Teleport to="body">
    <div class="push-layer">
      <TransitionGroup name="push">
        <div class="push-toast" v-for="t in toasts" :key="t.id">
          <span class="dot"></span>
          <div class="push-body">
            <div class="push-title">{{ t.title }}</div>
            <div class="push-text">{{ t.text }}</div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.push-layer {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--maxw);
  z-index: 1000;
  pointer-events: none;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.push-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid var(--mt-line);
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: var(--shadow-pop);
  will-change: transform;
}
.push-toast .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--mt-yellow);
  flex-shrink: 0;
}
.push-body {
  flex: 1;
  min-width: 0;
}
.push-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--mt-text);
}
.push-text {
  font-size: 12px;
  color: var(--mt-text-2);
  margin-top: 1px;
  line-height: 1.4;
}
.push-enter-active,
.push-leave-active {
  transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.32s ease;
}
.push-enter-from,
.push-leave-to {
  transform: translateY(-120%);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .push-enter-active,
  .push-leave-active {
    transition: opacity 0.2s ease;
  }
  .push-enter-from,
  .push-leave-to {
    transform: none;
    opacity: 0;
  }
}
</style>
