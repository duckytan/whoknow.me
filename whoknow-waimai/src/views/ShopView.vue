<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getShop } from '../data/shops'
import { getMenu } from '../data/dishes'
import { cart, addItem, decItem, dishCount, cartTotal } from '../store/cart'
import PersonaBadge from '../components/PersonaBadge.vue'

const route = useRoute()
const router = useRouter()
const shop = getShop(route.params.id as string)
const menu = computed(() => (shop ? getMenu(shop.id) : []))
const items = computed(() => (shop ? cart[shop.id] ?? {} : {}))
const count = computed(() => (shop ? dishCount(shop.id) : 0))
const total = computed(() => (shop ? cartTotal(shop.id) : 0))

// 外送/自取
const deliveryMode = ref<'delivery' | 'pickup'>('delivery')

// 菜单 Tab
const menuTab = ref('dishes')

// 分类侧栏：从菜品提取唯一分类，无 category 的归入"招牌"
const categories = computed(() => {
  const cats = new Set<string>()
  for (const d of menu.value) {
    cats.add(d.category || '招牌')
  }
  return Array.from(cats)
})
const activeCat = computed(() => categories.value[0] || '招牌')
const selectedCategory = ref(activeCat.value)

// 当前分类下的菜品
const filteredDishes = computed(() =>
  menu.value.filter(d => (d.category || '招牌') === selectedCategory.value)
)

function goCheckout() {
  if (shop && count.value > 0) router.push(`/order?shop=${shop.id}`)
}
</script>

<template>
  <div v-if="shop" class="shop-page">
    <!-- Hero 大图 -->
    <div class="shop-top">
      <div class="pic">{{ shop.emoji }}</div>
      <div class="nav">
        <div class="icon-btn" @click="router.push('/shops')">‹</div>
        <div class="title">{{ shop.name }}</div>
        <span style="font-size:18px;cursor:pointer">⭐</span>
        <span style="font-size:18px;cursor:pointer;margin-left:10px">⋯</span>
      </div>
    </div>

    <!-- 店铺信息卡 -->
    <div class="shop-info">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:50px;height:50px;border-radius:8px;background:linear-gradient(135deg,#FFE08A,#FFC93C);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">{{ shop.emoji }}</div>
        <div class="nm" style="padding-right:60px">{{ shop.name }} <PersonaBadge :personality="shop.personality" /></div>
      </div>
      <div class="stats" style="margin-top:8px">
        <span><span class="v" style="color:var(--mt-price);font-weight:800">{{ shop.score }}</span> 分</span>
        <span>{{ shop.monthlySales }}</span>
        <span>{{ shop.deliveryTime }}</span>
        <span style="color:var(--mt-text-2)">商家自配</span>
        <span class="price">配送 ¥{{ shop.deliveryFee }}</span>
      </div>
      <div class="new-cust">新客减2</div>
    </div>

    <!-- 外送 / 自取 分段控件 -->
    <div class="shop-seg">
      <button
        class="ss-pill on"
        :class="{ off: deliveryMode !== 'delivery' }"
        @click="deliveryMode = 'delivery'"
      >外送</button>
      <button
        class="ss-pill"
        :class="{ on: deliveryMode === 'pickup', off: deliveryMode !== 'pickup' }"
        @click="deliveryMode = 'pickup'"
      >自取</button>
      <span class="ss-dist">距您 {{ shop.distance }}</span>
    </div>

    <!-- 优惠公告行 -->
    <div class="promo-row">
      <span class="promo-tag red" v-for="(p, i) in shop.promo.split('|')" :key="i">{{ p.trim() }}</span>
      <span class="promo-tag yellow">免配送费</span>
      <span class="promo-tag yellow">0元起送</span>
    </div>

    <!-- 点菜 / 评价 / 商家 Tab -->
    <div class="shop-tabs">
      <button class="st on" :class="{ on: menuTab === 'dishes' }" @click="menuTab = 'dishes'">点菜</button>
      <button class="st" @click="menuTab = 'review'">评价</button>
      <button class="st" @click="menuTab = 'merchant'">商家</button>
    </div>

    <!-- 菜单区：左侧分类 + 右侧菜品 -->
    <template v-if="menuTab === 'dishes'">
      <div class="menu-two-col">
        <!-- 左侧分类侧栏 -->
        <div class="cat-side">
          <div
            v-for="cat in categories"
            :key="cat"
            class="cat-side__item"
            :class="{ on: selectedCategory === cat }"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </div>
        </div>

        <!-- 右侧菜品列表 -->
        <div class="dish-list-r">
          <!-- 横向促销区（神抢手） -->
          <div class="promo-h">
            <div class="ph-title">神抢手<span class="ph-badge">限时秒杀中</span></div>
            <div class="ph-scroll">
              <div class="ph-card"><div class="ph-t">特价优惠品质不打折</div><div class="ph-d">点击品尝 ›</div></div>
              <div class="ph-card"><div class="ph-t">大家都在说好</div><div class="ph-d">口碑推荐 ›</div></div>
            </div>
          </div>

          <!-- 菜品卡片列表 -->
          <div v-for="d in filteredDishes" :key="d.id" class="dish-card">
            <div class="dish-thumb">{{ d.emoji }}</div>
            <div class="dish-info-c">
              <div class="dc-name">{{ d.name }}</div>
              <div class="dc-sub">
                <span v-if="d.tags?.includes('月售')" class="dc-monthly">{{ d.tags.find(t => t.includes('月售')) }}</span>
                <span v-if="d.tags?.includes('人觉')" class="dc-review">{{ d.tags.find(t => t.includes('人觉')) }}</span>
                <span v-if="!d.tags?.length" class="dc-monthly">月售{{ Math.floor(Math.random() * 200 + 20) }}+</span>
              </div>
              <div class="dish-tags" v-if="d.tags?.length">
                <span v-for="t in d.tags" :key="t" class="dt" :class="{ 'dt-hot': t === '招牌', 'dt-safe': t === '买贵必赔', 'dt-promo': !['招牌','买贵必赔'].includes(t) }">{{ t }}</span>
              </div>
              <div class="dish-price-row">
                <span class="dc-now">¥{{ d.price }}</span>
                <span v-if="d.originalPrice" class="dc-old">¥{{ d.originalPrice }}</span>
                <span v-if="d.originalPrice && d.originalPrice > d.price * 1.3" class="dc-off">低至{{ Math.round(d.price / d.originalPrice * 100) }}折</span>
              </div>
            </div>
            <!-- 加购按钮 / Stepper -->
            <template v-if="items[d.id]">
              <div class="stepper" style="margin-top:22px">
                <button class="st" @click="decItem(shop.id, d.id)">−</button>
                <span class="q">{{ items[d.id] }}</span>
                <button class="st add" @click="addItem(shop.id, d.id)">＋</button>
              </div>
            </template>
            <template v-else>
              <button class="dish-cta" @click="addItem(shop.id, d.id)">+</button>
            </template>
          </div>

          <!-- 温馨提示 -->
          <div style="text-align:center;padding:16px;color:var(--mt-text-3);font-size:12px;border-top:1px solid var(--mt-line);margin-top:4px">
            温馨提示：请适量点餐
          </div>
        </div>
      </div>
    </template>

    <!-- 评价 tab 占位 -->
    <div v-else-if="menuTab === 'review'" style="padding:30px 14px;text-align:center;color:var(--mt-text-3);font-size:14px;background:#fff">
      暂无评价——老板说「好评都是刷的，差评才是真的」🤷
    </div>

    <!-- 商家 tab 占位 -->
    <div v-else style="padding:30px 14px;text-align:center;color:var(--mt-text-3);font-size:14px;background:#fff">
      {{ shop.greeting }}
    </div>

    <!-- 底部购物车栏 -->
    <div class="cart-bar" :class="{ empty: count === 0 }">
      <div class="cart-ico">🛒<span v-if="count" class="badge">{{ count }}</span></div>
      <div class="cart-total">
        <template v-if="count">¥{{ total }}<span class="tip">另需配送费 ¥{{ shop.deliveryFee }}</span></template>
        <template v-else>还没选菜</template>
      </div>
      <button class="cart-go" :disabled="count === 0" @click="goCheckout">去结算</button>
    </div>
  </div>
  <div v-else class="page-pad">
    店铺不存在。<router-link to="/shops" style="color: var(--mt-price)">返回列表</router-link>
  </div>
</template>
