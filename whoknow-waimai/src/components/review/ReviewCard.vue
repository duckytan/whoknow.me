<script setup lang="ts">
import type { Review } from '@/types'

defineProps<{
  review: Review
  shopName: string
  bossPersonality: string
}>()

const PERSONALITY_AVATAR: Record<string, string> = {
  angry: '😤',
  gentle: '😊',
  weird: '🤪',
  lazy: '😴',
  philosophical: '🧘',
}
</script>

<template>
  <div class="review-card">
    <!-- 评价者行 -->
    <div class="reviewer-row">
      <div class="reviewer-avatar">🎭</div>
      <div class="reviewer-info">
        <div class="reviewer-name">匿名戏精食客</div>
        <van-rate
          :model-value="review.rating"
          :count="5"
          color="#ff7849"
          void-color="#ddd"
          size="12"
          readonly
        />
      </div>
      <div class="review-time">{{ review.createdAt }}</div>
    </div>

    <!-- 评价标签 -->
    <div v-if="review.tags?.length" class="tag-row">
      <span
        v-for="tag in review.tags"
        :key="tag"
        class="review-tag"
      >{{ tag }}</span>
    </div>

    <!-- 评价文本 -->
    <div class="review-text">{{ review.text }}</div>

    <!-- 老板回复 -->
    <div v-if="review.bossReply" class="boss-reply">
      <div class="boss-reply-header">
        <span class="boss-avatar">{{ PERSONALITY_AVATAR[bossPersonality] || '👨‍🍳' }}</span>
        <span class="boss-label">{{ shopName }} 老板回复：</span>
      </div>
      <div class="boss-reply-text">{{ review.bossReply }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.review-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin: 0 16px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}

.reviewer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.reviewer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff3ee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.reviewer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reviewer-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.review-time {
  font-size: 11px;
  color: #bbb;
  flex-shrink: 0;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.review-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #fff3ee;
  color: #ff7849;
  border-radius: 10px;
}

.review-text {
  font-size: 14px;
  color: #444;
  line-height: 1.6;
  margin-bottom: 10px;
}

.boss-reply {
  background: #fafafa;
  border-radius: 8px;
  padding: 10px 12px;
  border-left: 3px solid #ff7849;
}

.boss-reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
}

.boss-avatar { font-size: 14px; }

.boss-label {
  font-weight: 700;
  color: #ff7849;
}

.boss-reply-text {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  font-style: italic;
}
</style>
