<script setup lang="ts">
/**
 * App.vue
 *
 * v16 M3 合规 banner（7-23 锡哥拍板 · 决策 #011）
 * 在所有页面顶部挂载半透明合规 banner（隐私政策页 / 用户协议页自身不挂）
 */
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import ComplianceBanner from '@/components/base/ComplianceBanner.vue'

const route = useRoute()
const showBanner = computed(() => !route.meta.hideBanner)
</script>

<template>
  <ComplianceBanner v-if="showBanner" />
  <router-view />
</template>