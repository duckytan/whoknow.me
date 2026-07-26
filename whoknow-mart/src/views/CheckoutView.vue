<script setup lang="ts">
import { useRouter } from 'vue-router'
import { L1MART } from '../config/l1mart.static.ts'
const router = useRouter()
function enterGame() {
  router.push(`/game/${L1MART.guides[0].id}`)
}
</script>

<template>
  <section>
    <h2>结算</h2>
    <p>点结算 → 移交博弈对线</p>
    <button @click="enterGame">开始对线</button>
  </section>
</template>
