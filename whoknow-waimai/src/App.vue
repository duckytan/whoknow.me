<script setup lang="ts">
import PhoneFrame from './components/PhoneFrame.vue'
import AppToast from './components/AppToast.vue'
</script>

<template>
  <PhoneFrame>
    <router-view />
  </PhoneFrame>
  <!-- 全局拟真提示：替代原生 alert，跨路由存活 -->
  <AppToast />
</template>
