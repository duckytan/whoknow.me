<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  active: 'home' | 'orders'
}>()

const router = useRouter()
</script>

<template>
  <van-tabbar :model-value="active" fixed>
    <van-tabbar-item name="home" icon="wap-home-o" @click="router.push('/')">
      首页
    </van-tabbar-item>
    <van-tabbar-item name="orders" icon="records-o" @click="router.push('/orders')">
      订单
    </van-tabbar-item>
  </van-tabbar>
</template>
