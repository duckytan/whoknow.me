<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAchievementStore } from '@/store/achievement'

defineProps<{
  active: 'home' | 'feed' | 'orders' | 'achievements'
}>()

const router = useRouter()
const achStore = useAchievementStore()
</script>

<template>
  <!--
    外层 .tabbar-wrapper: 宽屏时居中 + 限制最大宽度 + 灰色背景
    内层 van-tabbar: 撑满包裹容器,4 个 tab 在 480px 内居中
  -->
  <div class="tabbar-wrapper">
    <van-tabbar :model-value="active" fixed safe-area-inset-bottom>
      <van-tabbar-item name="home" icon="wap-home-o" @click="router.push('/')">
        首页
      </van-tabbar-item>
      <van-tabbar-item name="feed" icon="chat-o" @click="router.push('/feed')">
        动态
      </van-tabbar-item>
      <van-tabbar-item
        name="achievements"
        icon="medal-o"
        :badge="achStore.hasUnclaimed ? '' : undefined"
        @click="router.push('/achievements')"
      >
        成就
      </van-tabbar-item>
      <van-tabbar-item name="orders" icon="records-o" @click="router.push('/orders')">
        订单
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style lang="scss" scoped>
.tabbar-wrapper {
  /* 宽屏居中模拟手机宽度 */
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  /* 移动端 · 撑满 */
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  pointer-events: none;

  /* 宽屏留白 · 增加类似手机框效果 */
  @media (min-width: 768px) {
    bottom: 24px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  }
}

.tabbar-wrapper :deep(.van-tabbar) {
  pointer-events: auto;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.tabbar-wrapper :deep(.van-tabbar-item) {
  flex: 1;
}
</style>
