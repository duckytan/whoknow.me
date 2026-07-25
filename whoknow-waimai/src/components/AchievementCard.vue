<script setup lang="ts">
import type { AchievementMeta } from '../data/achievements'
import PersonaBadge from './PersonaBadge.vue'

defineProps<{ meta: AchievementMeta; unlocked: boolean }>()
</script>

<template>
  <div class="achv-card" :class="{ lock: !unlocked }">
    <div class="ic">{{ meta.icon }}</div>
    <div class="info">
      <div class="nm">{{ meta.name }} <PersonaBadge :personality="meta.persona" /></div>
      <div class="desc">{{ meta.desc }}</div>
      <div class="reward">奖励 · <b>{{ meta.reward }}</b></div>
    </div>
  </div>
</template>
