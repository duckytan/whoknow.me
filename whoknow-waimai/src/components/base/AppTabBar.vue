<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  active: 'home' | 'boss' | 'rider'
}>()

const router = useRouter()
</script>

<template>
  <van-tabbar :model-value="active" fixed>
    <van-tabbar-item name="home" icon="wap-home-o" @click="router.push('/')">
      买家
    </van-tabbar-item>
    <van-tabbar-item name="boss" icon="shop-o" @click="router.push('/shops')">
      老板演示
    </van-tabbar-item>
    <van-tabbar-item name="rider" icon="logistics" @click="router.push('/shops')">
      骑手演示
    </van-tabbar-item>
  </van-tabbar>
</template>
