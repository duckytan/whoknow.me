<script setup lang="ts">
// AppToast.vue — 全局拟真提示挂载点（P1 审计 D6 替换原生 alert）
// 视觉复用 style.css 既有 .ph-toast（店铺页加购提示同款），不新增样式语言。
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
    <div v-if="message" class="ph-toast" role="status" aria-live="polite">{{ message }}</div>
  </Teleport>
</template>
