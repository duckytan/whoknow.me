<script setup lang="ts">
import { PERSONA_LABEL, PERSONA_CLASS, type Personality } from '../data/shops'
defineProps<{ personality: Personality }>()
</script>

<template>
  <span class="persona" :class="PERSONA_CLASS[personality]">{{ PERSONA_LABEL[personality] }}</span>
</template>
