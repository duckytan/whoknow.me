<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { memory } from '../store/memoryStore'
import { SHOPS } from '../data/shops'
import { showToast } from '../lib/toast'

const router = useRouter()

// 二次确认改用 app 内底部抽屉（复用 style.css 既有 .sheet-* 样式）。
// 原生 confirm/alert 是最强"出戏"信号，会当场击穿"真美团外壳"。
const confirmOpen = ref(false)

function askClear() {
  confirmOpen.value = true
}
function cancelClear() {
  confirmOpen.value = false
}
function doClear() {
  confirmOpen.value = false
  memory.reset()
  for (const s of SHOPS) memory.reset(s.id)
  showToast('已清空，欢迎重新开演。')
  router.push('/shops')
}
</script>

<template>
  <div class="mt-nav">
    <div class="mt-nav__top">
      <div class="mt-nav__back" @click="router.back()">‹</div>
      <div class="mt-nav__title">设置</div>
    </div>
  </div>
  <div class="page-pad">
    <div class="entry-list">
      <div class="entry" @click="router.push('/about')">ℹ️ 关于胡闹</div>
      <div class="entry" @click="router.push('/privacy')">🔒 隐私政策</div>
      <div class="entry" @click="router.push('/terms')">📜 用户条款</div>
      <div class="entry" @click="router.push('/service')">🎧 客服</div>
    </div>
    <button class="submit-btn danger" @click="askClear">清空所有数据</button>
    <div class="muted" style="margin-top: 12px">数据仅存于本机，清空不影响任何真实交易。</div>
  </div>

  <!-- 清空确认抽屉（纯点击，无输入框） -->
  <Teleport to="body">
    <div v-if="confirmOpen" class="sheet-overlay" @click.self="cancelClear">
      <div class="sheet-panel">
        <div class="sheet-handle"></div>
        <div class="sheet-title">清空所有数据？</div>
        <div style="font-size:13px;color:var(--mt-text-3);text-align:center;margin-bottom:12px">
          成就 / 订单 / 访问记录会全部消失，此操作不可恢复
        </div>
        <div class="sheet-options">
          <div class="sheet-opt" style="color:#ff4b10" @click="doClear">确定清空</div>
          <div class="sheet-opt" @click="cancelClear">再想想</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
