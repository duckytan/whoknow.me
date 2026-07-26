<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { L1MART } from '../config/l1mart.static.ts'
const route = useRoute()
const router = useRouter()
const product = computed(
  () => L1MART.products.find((p) => p.id === route.params.id) ?? L1MART.products[0],
)
function checkout() {
  router.push('/checkout')
}
</script>

<template>
  <section>
    <h2>{{ product.name }}</h2>
    <p>价格占位：{{ product.price }}</p>
    <button @click="checkout">去结算</button>
  </section>
</template>
