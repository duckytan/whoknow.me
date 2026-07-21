<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { generateReviewText, generateBossReply, REVIEW_TAGS } from '@/utils/reviewGenerator'
import type { ReviewContext } from '@/utils/reviewGenerator'

const props = defineProps<{
  show: boolean
  ctx: ReviewContext
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: {
    rating: number
    tags: string[]
    text: string
    bossReply: string
  }): void
}>()

const rating = ref(5)
const selectedTags = ref<string[]>([])
const reviewText = ref('')
const bossReply = ref('')

// 每次打开自动生成一条评价文本
watch(() => props.show, (v) => {
  if (v) {
    reviewText.value = generateReviewText(props.ctx)
    bossReply.value = generateBossReply(props.ctx.bossPersonality)
    selectedTags.value = []
    rating.value = Math.random() < 0.2 ? 4 : 5 // 80% 五星，人设
  }
})

function toggleTag(label: string) {
  const idx = selectedTags.value.indexOf(label)
  if (idx === -1) selectedTags.value.push(label)
  else selectedTags.value.splice(idx, 1)
}

function handleSubmit() {
  emit('submit', {
    rating: rating.value,
    tags: selectedTags.value,
    text: reviewText.value,
    bossReply: bossReply.value,
  })
}
</script>

<template>
  <van-popup
    :show="show"
    round
    position="bottom"
    :style="{ maxHeight: '85vh', overflowY: 'auto' }"
    @click-overlay="emit('close')"
  >
    <div class="review-modal">
      <!-- 头部 -->
      <div class="modal-header">
        <span class="modal-title">🎭 写戏精评价</span>
        <span class="modal-close" @click="emit('close')">✕</span>
      </div>

      <!-- 商家信息 -->
      <div class="shop-info">
        <span class="shop-emoji">🏪</span>
        <div class="shop-text">
          <div class="shop-name">{{ ctx.shopName }}</div>
          <div class="shop-sub">骑手 {{ ctx.riderAvatar }} {{ ctx.riderName }} · ¥{{ ctx.totalPrice.toFixed(2) }}</div>
        </div>
      </div>

      <!-- 星级 -->
      <div class="section">
        <div class="section-label">满分是几星？</div>
        <van-rate v-model="rating" :count="5" color="#ff6b35" void-color="#ddd" size="28" />
      </div>

      <!-- 标签 -->
      <div class="section">
        <div class="section-label">选个标签（可多选）</div>
        <div class="tag-grid">
          <div
            v-for="tag in REVIEW_TAGS"
            :key="tag.label"
            class="review-tag"
            :class="{ active: selectedTags.includes(tag.label) }"
            @click="toggleTag(tag.label)"
          >
            {{ tag.emoji }} {{ tag.label }}
          </div>
        </div>
      </div>

      <!-- 评价文本 -->
      <div class="section">
        <div class="section-label">戏精评论（AI 生成，可编辑）</div>
        <van-field
          v-model="reviewText"
          type="textarea"
          rows="3"
          autosize
          :border="false"
          class="review-textarea"
          placeholder="说点什么..."
        />
      </div>

      <!-- 老板预回复预览 -->
      <div class="boss-preview">
        <span class="boss-label">老板将回复：</span>
        <span class="boss-text">{{ bossReply }}</span>
      </div>

      <!-- 提交 -->
      <div class="submit-area">
        <van-button type="primary" block round class="submit-btn" @click="handleSubmit">
          🎭 发布这出好戏
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<style lang="scss" scoped>
.review-modal {
  padding: 0 0 env(safe-area-inset-bottom, 0);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f5f5f5;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.modal-close {
  font-size: 16px;
  color: #bbb;
  padding: 4px;
  cursor: pointer;
}

.shop-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fff9f6;
}

.shop-emoji { font-size: 28px; }

.shop-name {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.shop-sub {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.section {
  padding: 12px 16px 8px;
  border-bottom: 1px solid #f5f5f5;
}

.section-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.review-tag {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  border: 1px solid #e8e8e8;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;

  &.active {
    background: #fff3ee;
    border-color: #ff6b35;
    color: #ff6b35;
    font-weight: 600;
  }
}

.review-textarea {
  background: #f9f9f9;
  border-radius: 8px;
  font-size: 13px;
}

.boss-preview {
  padding: 10px 16px;
  font-size: 12px;
  color: #888;
  background: #fafafa;
  display: flex;
  gap: 6px;
}

.boss-label {
  color: #ff6b35;
  font-weight: 600;
  flex-shrink: 0;
}

.boss-text {
  color: #666;
  font-style: italic;
}

.submit-area {
  padding: 12px 16px 20px;
}

.submit-btn {
  background: #ff6b35 !important;
  border-color: #ff6b35 !important;
  font-weight: 700;
}
</style>
