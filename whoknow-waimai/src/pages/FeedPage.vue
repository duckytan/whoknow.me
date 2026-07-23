<script setup lang="ts">
/**
 * FeedPage.vue
 * v18 胡闹动态 · 假社交朋友圈
 * 每次刷新从订单重新生成 + 随机 NPC 互动
 */
import { ref, computed, onMounted } from 'vue'
import { useOrderStore } from '@/store/order'
import { generateFeed, formatFeedTime } from '@/utils/feedEngine'

const orderStore = useOrderStore()
const feed = ref(generateFeed(orderStore.orders))
const now = ref(Date.now())

// 每 30 秒刷新时间显示
onMounted(() => {
  const timer = setInterval(() => {
    now.value = Date.now()
  }, 30000)
  // 组件卸载时清理
  // 注意：Vue 不会自动清理页面级别的 setInterval，但用户切页面也 OK
})

function handleRefresh() {
  feed.value = generateFeed(orderStore.orders)
}

function handleShare(item: any) {
  // 生成分享链接
  const dish = item.dishName
  const shop = item.shopName
  const remark = item.remark || ''
  const text = `我在胡闹外卖点了一份「${dish}」！${remark ? '备注：' + remark + '。' : ''}老板说：「${item.bossQuote || '...'}」`
  // 复制到剪贴板
  navigator.clipboard?.writeText(text).catch(() => {})
  // 用 Vant 的 toast
  import('vant').then(({ showToast }) => {
    showToast('📋 段子已复制，去分享给朋友吧！')
  })
}
</script>

<template>
  <div class="feed-page">
    <!-- 头部 -->
    <div class="page-header">
      <h1 class="page-title">📰 胡闹动态</h1>
      <button class="refresh-btn" @click="handleRefresh">🔄 刷一刷</button>
    </div>

    <!-- 动态列表 -->
    <div v-if="feed.length === 0" class="empty-state">
      <div class="empty-icon">🍜</div>
      <p>还没有动态</p>
      <p class="empty-hint">去下一单胡闹外卖吧</p>
    </div>

    <div v-else class="feed-list">
      <div v-for="(item, idx) in feed" :key="item.id" class="feed-item">
        <!-- 时间轴装饰线 -->
        <div class="time-marker" v-if="idx === 0 || formatFeedTime(item.timestamp) !== formatFeedTime(feed[idx - 1]?.timestamp || 0)">
          <span class="time-tag">{{ formatFeedTime(item.timestamp) }}</span>
        </div>

        <!-- 动态卡片 -->
        <div class="feed-card">
          <div class="card-header">
            <div class="order-info">
              <span class="dish-icon">{{ item.dishIcon }}</span>
              <span class="dish-name">{{ item.dishName }}</span>
              <span class="shop-name">· {{ item.shopName }}</span>
            </div>
            <span class="time">{{ formatFeedTime(item.timestamp) }}</span>
          </div>

          <!-- NPC 对话 -->
          <div class="npc-quotes">
            <div v-if="item.bossQuote" class="quote boss-quote">
              <span class="quote-label">老板</span>
              <span class="quote-text">{{ item.bossQuote }}</span>
            </div>
            <div v-if="item.riderQuote" class="quote rider-quote">
              <span class="quote-label">骑手</span>
              <span class="quote-text">{{ item.riderQuote }}</span>
            </div>
            <div v-if="item.remark" class="remark-line">
              <span class="remark-label">备注</span>
              <span class="remark-text">{{ item.remark }}</span>
            </div>
          </div>

          <!-- 互动区 -->
          <div class="interactions">
            <div class="likes">
              ❤️ {{ item.likes }}
            </div>
            <div class="action-btns">
              <button class="action-btn" @click="handleShare(item)">📤 分享</button>
            </div>
          </div>

          <!-- 评论区 -->
          <div v-if="item.comments.length > 0" class="comments-section">
            <div v-for="(c, ci) in item.comments" :key="ci" class="comment">
              <span class="comment-icon">{{ c.icon }}</span>
              <span class="comment-author">{{ c.author }}</span>
              <span class="comment-text">{{ c.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- v18: TabBar 移到 App.vue 全局挂载 -->
  </div>
</template>

<style scoped>
.feed-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.page-header {
  background: #fff;
  padding: 16px 16px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}
.page-title {
  margin: 0;
  font-size: 18px;
}
.refresh-btn {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
}
.refresh-btn:active {
  background: #f5f5f5;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.empty-hint {
  font-size: 13px;
  color: #bbb;
  margin-top: 4px;
}

.feed-list {
  padding: 8px 12px;
}

.time-marker {
  padding: 12px 0 6px;
}
.time-tag {
  display: inline-block;
  font-size: 12px;
  color: #999;
  background: #e9e9e9;
  padding: 2px 10px;
  border-radius: 10px;
}

.feed-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}
.order-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dish-icon {
  font-size: 20px;
}
.dish-name {
  font-size: 15px;
  font-weight: 600;
}
.shop-name {
  font-size: 12px;
  color: #888;
}
.time {
  font-size: 11px;
  color: #bbb;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 8px;
}

.npc-quotes {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.quote {
  margin-bottom: 4px;
  line-height: 1.5;
}
.quote:last-child {
  margin-bottom: 0;
}
.quote-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 0 6px;
  border-radius: 4px;
  margin-right: 6px;
}
.boss-quote .quote-label {
  background: #ffe0e0;
  color: #d63031;
}
.rider-quote .quote-label {
  background: #e0f0ff;
  color: #2979ff;
}
.quote-text {
  font-size: 13px;
  color: #444;
}
.remark-line {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
  border-top: 1px dashed #e0e0e0;
  padding-top: 4px;
}
.remark-label {
  color: #aaa;
  margin-right: 4px;
}
.remark-text {
  font-style: italic;
}

.interactions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.likes {
  font-size: 13px;
  color: #e74c3c;
}

.action-btns {
  display: flex;
  gap: 8px;
}
.action-btn {
  border: none;
  background: none;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
}
.action-btn:active {
  background: #f0f0f0;
}

.comments-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}
.comment {
  font-size: 12px;
  margin-bottom: 4px;
  line-height: 1.5;
}
.comment-icon {
  margin-right: 4px;
}
.comment-author {
  font-weight: 600;
  color: #2979ff;
  margin-right: 6px;
}
.comment-text {
  color: #555;
}
</style>
