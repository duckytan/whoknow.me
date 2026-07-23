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
  <van-tabbar :model-value="active" fixed>
    <van-tabbar-item name="home" icon="wap-home-o" @click="router.push('/')">
      首页
    </van-tabbar-item>
    <van-tabbar-item name="feed" icon="chat-o" @click="router.push('/feed')">
      动态
    </van-tabbar-item>
    <van-tabbar-item name="achievements" icon="medal-o" :badge="achStore.hasUnclaimed ? '' : undefined" @click="router.push('/achievements')">
      成就
    </van-tabbar-item>
    <van-tabbar-item name="orders" icon="records-o" @click="router.push('/orders')">
      订单
    </van-tabbar-item>
  </van-tabbar>
</template>
