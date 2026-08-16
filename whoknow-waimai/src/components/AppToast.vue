<script setup lang="ts">
// AppToast.vue — 全局轻提示挂载点（P1 审计 D6 替换原生 alert）
// 视觉统一为 PushNotifier 同款（白卡片 + 小黄点 + 顶部滑入），
// 与配送推送共用一套"通知"语言。所有页面的 showToast 都走 toast.ts 全局总线，
// 由本组件单一渲染，不再有底部黑条 / 居中深色弹层等其他长相。
// 挂在 App.vue 顶层 + Teleport to body：跨路由存活（设置页清空数据后会跳转）。
import { onMounted, onUnmounted, ref } from 'vue'
import { onToast, TOAST_DURATION_MS } from '../lib/toast'

const message = ref('')
let timer: ReturnType<typeof setTimeout> | null = null
let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = onToast((msg) => {
    message.value = msg
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      message.value = ''
      timer = null
    }, TOAST_DURATION_MS)
  })
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  timer = null
  unsubscribe?.()
  unsubscribe = null
})
</script>

<template>
  <Teleport to="body">
    <div class="app-toast-layer">
      <Transition name="push">
        <div v-if="message" class="push-toast app-toast" role="status" aria-live="polite">
          <span class="dot"></span>
          <div class="push-body">
            <div class="push-text">{{ message }}</div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.app-toast-layer {
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
.push-text {
  font-size: 13px;
  color: var(--mt-text);
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
