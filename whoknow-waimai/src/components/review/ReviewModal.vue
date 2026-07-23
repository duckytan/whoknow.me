<script setup lang="ts">
/**
 * ReviewModal.vue
 *
 * v15 M2 闭环完善（7-23 锡哥拍板 · 7-23 提交）
 * 评价弹窗 — 用户从打开 → 填表 → 提交 → 庆祝分享
 *
 * 改动：
 * - submit 后切到内部 `submitted` 状态，显示成功动画 + 老板回复 + 分享按钮
 * - 进入时显示 1 句 AI 引导（"已为你写好初稿"）
 * - 加"再来一单"按钮催用户回流
 */
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
const submitted = ref(false) // v15：提交后切到庆祝态

// 每次打开重置状态 + 自动生成评价文本
watch(() => props.show, (v) => {
  if (v) {
    reviewText.value = generateReviewText(props.ctx)
    bossReply.value = generateBossReply(props.ctx.bossPersonality)
    selectedTags.value = []
    rating.value = Math.random() < 0.2 ? 4 : 5
    submitted.value = false
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
  submitted.value = true // v15：进入庆祝态
}

function handleClose() {
  // 庆祝态关闭 = 关闭整个 modal；编辑态关闭 = 直接关
  submitted.value = false
  emit('close')
}

function handleShare() {
  // v15：调用 navigator.share 优先；不支持则降级为复制文本
  const shareText = `【胡闹外卖】给 ${props.ctx.shopName} 打了个 ${rating.value} 星：「${reviewText.value}」\n老板回复：${bossReply.value}\n#胡闹外卖`
  if (navigator.share) {
    navigator.share({
      title: '胡闹外卖戏精评价',
      text: shareText,
    }).catch(() => {
      // 用户取消分享或失败 → 降级
      copyToClipboard(shareText)
    })
  } else {
    copyToClipboard(shareText)
  }
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制戏精评价，去朋友圈贴一下 ✨')
    }).catch(() => {
      fallbackCopy(text)
    })
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    showToast('已复制戏精评价，去朋友圈贴一下 ✨')
  } catch {
    showToast('复制失败，请手动截图')
  }
  document.body.removeChild(ta)
}

function showToast(msg: string) {
  // 轻量 toast（不依赖 showToast import，避免循环依赖）
  if (typeof window !== 'undefined') {
    const toast = document.createElement('div')
    toast.textContent = msg
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#fff;padding:12px 24px;border-radius:24px;font-size:14px;z-index:9999;animation:fadeInOut 2s ease forwards'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2000)
  }
}
</script>

<template>
  <van-popup
    :show="show"
    round
    position="bottom"
    :style="{ maxHeight: '85vh', overflowY: 'auto' }"
    @click-overlay="handleClose"
  >
    <!-- ============ 编辑态 ============ -->
    <div v-if="!submitted" class="review-modal">
      <!-- 头部 -->
      <div class="modal-header">
        <span class="modal-title">🎭 写戏精评价</span>
        <span class="modal-close" @click="handleClose">✕</span>
      </div>

      <!-- 商家信息 -->
      <div class="shop-info">
        <span class="shop-emoji">🏪</span>
        <div class="shop-text">
          <div class="shop-name">{{ ctx.shopName }}</div>
          <div class="shop-sub">骑手 {{ ctx.riderAvatar }} {{ ctx.riderName }} · ¥{{ ctx.totalPrice.toFixed(2) }}</div>
        </div>
      </div>

      <!-- v15：AI 已写好初稿提示 -->
      <div class="ai-hint">
        ✨ AI 已为你写好初稿，点下面直接编辑
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

    <!-- ============ 庆祝态（v15 新增）============ -->
    <div v-else class="review-celebrate">
      <div class="celebrate-anim">🎉</div>
      <div class="celebrate-title">好戏已发布</div>
      <div class="celebrate-sub">老板已收到，他正在憋大招</div>

      <!-- 显示已发布的评价 -->
      <div class="celebrate-review">
        <div class="celebrate-rating">
          <span class="rating-num">{{ rating }}</span>
          <span class="rating-stars">
            <span v-for="i in 5" :key="i">{{ i <= rating ? '⭐' : '☆' }}</span>
          </span>
        </div>
        <div v-if="selectedTags.length" class="celebrate-tags">
          <span v-for="tag in selectedTags" :key="tag" class="celebrate-tag">{{ tag }}</span>
        </div>
        <div class="celebrate-text">{{ reviewText }}</div>
        <div class="celebrate-boss">
          <span class="boss-name">{{ ctx.shopName }} 老板：</span>
          <span class="boss-quote">{{ bossReply }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="celebrate-actions">
        <van-button block round class="share-btn" @click="handleShare">
          📤 分享到朋友圈
        </van-button>
        <van-button block round plain class="close-btn" @click="handleClose">
          收摊，继续演戏
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

/* v15：AI 引导 */
.ai-hint {
  background: linear-gradient(90deg, #fff3ee, #fff9f6);
  color: #ff6b35;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 16px;
  border-left: 3px solid #ff6b35;
  margin: 8px 0;
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

/* ============ v15 庆祝态样式 ============ */
.review-celebrate {
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0));
  text-align: center;
}

.celebrate-anim {
  font-size: 64px;
  line-height: 1;
  animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

.celebrate-title {
  font-size: 22px;
  font-weight: 800;
  color: #ff6b35;
  margin-top: 12px;
}

.celebrate-sub {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.celebrate-review {
  background: #fff9f6;
  border-radius: 12px;
  padding: 16px;
  margin: 20px 0;
  text-align: left;
  border: 1px dashed #ff6b35;
}

.celebrate-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.rating-num {
  font-size: 28px;
  font-weight: 800;
  color: #ff6b35;
}

.rating-stars {
  font-size: 18px;
  letter-spacing: 2px;
}

.celebrate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.celebrate-tag {
  font-size: 11px;
  padding: 2px 10px;
  background: #fff3ee;
  color: #ff6b35;
  border-radius: 10px;
  font-weight: 600;
}

.celebrate-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 10px;
}

.celebrate-boss {
  padding-top: 10px;
  border-top: 1px dashed #ffd6b8;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.boss-name {
  color: #ff6b35;
  font-weight: 700;
  font-size: 12px;
}

.boss-quote {
  color: #555;
  font-style: italic;
  line-height: 1.5;
}

.celebrate-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.share-btn {
  background: #ff6b35 !important;
  border-color: #ff6b35 !important;
  font-weight: 700;
}

.close-btn {
  color: #999 !important;
  border-color: #ddd !important;
}
</style>

<style>
/* 全局 toast fadeInOut 动画（避免 scoped 不生效）*/
@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, -45%); }
  15% { opacity: 1; transform: translate(-50%, -50%); }
  85% { opacity: 1; transform: translate(-50%, -50%); }
  100% { opacity: 0; transform: translate(-50%, -55%); }
}
</style>