<script setup lang="ts">
import Statusbar from './Statusbar.vue'
import TabBar from './TabBar.vue'

withDefaults(defineProps<{ showStatus?: boolean; showTab?: boolean }>(), {
  showStatus: true,
  showTab: true,
})
</script>

<template>
  <div class="phone">
    <Statusbar v-if="showStatus" />
    <div class="phone-body">
      <slot />
    </div>
    <TabBar v-if="showTab" />
  </div>
</template>
