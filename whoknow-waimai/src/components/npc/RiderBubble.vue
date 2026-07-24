<script setup lang="ts">
defineProps<{
  riderId: string
  riderName: string
  riderAvatar: string
  quote: string
}>()
</script>

<template>
  <div class="rider-bubble">
    <div class="rider-avatar">{{ riderAvatar }}</div>
    <div class="rider-content">
      <div class="rider-name">🛵 {{ riderName }}</div>
      <div class="rider-quote">「{{ quote }}」</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rider-bubble {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #eafaf0;
  border-left: 3px solid #4fc46a;
  border-radius: 0 8px 8px 0;
  padding: 10px 12px;
  margin: 8px 0;
}

.rider-avatar {
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
}

.rider-name {
  font-size: 12px;
  font-weight: 700;
  color: #4fc46a;
  margin-bottom: 3px;
}

.rider-quote {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  font-style: italic;
}
</style>
