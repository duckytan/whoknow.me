<script setup lang="ts">
import { L1MART } from '../config/l1mart.static.ts'
</script>

<template>
  <section>
    <h2>图鉴</h2>
    <ul>
      <li v-for="g in L1MART.guides" :key="g.id">{{ g.name }} · {{ g.archetype }}</li>
    </ul>
  </section>
</template>
