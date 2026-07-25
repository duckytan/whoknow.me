<script setup lang="ts">
import type { Rider } from '../data/shops'
import PersonaBadge from './PersonaBadge.vue'

defineProps<{ rider: Rider }>()
</script>

<template>
  <div class="rider-card">
    <div class="av">{{ rider.emoji }}</div>
    <div class="info">
      <div class="nm">{{ rider.name }} <PersonaBadge personality="rider" /></div>
      <div class="sub">{{ rider.sub }}</div>
    </div>
  </div>
</template>
