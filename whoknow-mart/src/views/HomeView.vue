<script setup lang="ts">
import { L1MART } from '../config/l1mart.static.ts'
import { useRouter } from 'vue-router'
const router = useRouter()
function start(guideId: string) {
  router.push(`/game/${guideId}`)
}
</script>

<template>
  <section>
    <h1>胡闹导购</h1>
    <p>反骨消费劝退模拟器 · 选招制对线</p>
    <h3>挑个导购开整</h3>
    <ul>
      <li v-for="g in L1MART.guides" :key="g.id">
        <button @click="start(g.id)">{{ g.name }}（{{ g.archetype }}）</button>
      </li>
    </ul>
  </section>
</template>
