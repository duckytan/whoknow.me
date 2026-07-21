<script setup lang="ts">
defineProps<{
  personality: 'angry' | 'gentle' | 'weird' | 'lazy' | 'philosophical'
  quote: string
  shopName?: string
}>()

const personalityConfig = {
  angry:        { emoji: '😤', color: '#ff4444', bg: '#fff0f0', label: '暴躁' },
  gentle:       { emoji: '🥰', color: '#ff69b4', bg: '#fff5f9', label: '温柔' },
  weird:        { emoji: '🤪', color: '#9b59b6', bg: '#f9f0ff', label: '奇葩' },
  lazy:         { emoji: '😪', color: '#95a5a6', bg: '#f5f5f5', label: '佛系' },
  philosophical:{ emoji: '🧘', color: '#27ae60', bg: '#f0fff4', label: '哲学' },
}
</script>

<template>
  <div
    class="boss-bubble"
    :style="{
      borderLeftColor: personalityConfig[personality].color,
      background: personalityConfig[personality].bg,
    }"
  >
    <div class="bubble-header">
      <span class="bubble-emoji">{{ personalityConfig[personality].emoji }}</span>
      <span class="bubble-label" :style="{ color: personalityConfig[personality].color }">
        {{ shopName ? `【${shopName}老板】` : '【老板】' }}
      </span>
      <van-tag :color="personalityConfig[personality].color" size="mini" class="bubble-tag">
        {{ personalityConfig[personality].label }}
      </van-tag>
    </div>
    <div class="bubble-quote">「{{ quote }}」</div>
  </div>
</template>

<style lang="scss" scoped>
.boss-bubble {
  border-left: 3px solid;
  border-radius: 0 8px 8px 0;
  padding: 10px 12px;
  margin: 8px 0;
  transition: all 0.3s;
}

.bubble-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.bubble-emoji { font-size: 16px; }
.bubble-label { font-size: 12px; font-weight: 700; }
.bubble-tag { margin-left: 4px; }

.bubble-quote {
  font-size: 13px;
  color: #444;
  line-height: 1.6;
  font-style: italic;
}
</style>
