import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/pages/Home.vue'),
      meta: { title: '胡闹外卖' },
    },
    {
      path: '/shops',
      name: 'ShopList',
      component: () => import('@/pages/ShopList.vue'),
      meta: { title: '商家列表' },
    },
    {
      path: '/shop/:id',
      name: 'ShopDetail',
      component: () => import('@/pages/ShopDetail.vue'),
      meta: { title: '点餐' },
    },
    {
      path: '/checkout',
      name: 'Checkout',
      component: () => import('@/pages/Checkout.vue'),
      meta: { title: '确认下单' },
    },
    {
      path: '/cart',
      name: 'CartPage',
      component: () => import('@/pages/CartPage.vue'),
      meta: { title: '购物车' },
    },
    {
      path: '/orders',
      name: 'OrderHistory',
      component: () => import('@/pages/OrderHistory.vue'),
      meta: { title: '我的订单' },
    },
    {
      path: '/order/:id',
      name: 'OrderDetail',
      component: () => import('@/pages/OrderDetail.vue'),
      meta: { title: '订单详情' },
    },
    {
      path: '/privacy',
      name: 'PrivacyPolicy',
      component: () => import('@/pages/PrivacyPolicy.vue'),
      meta: { title: '隐私政策', hideBanner: true },
    },
    {
      path: '/terms',
      name: 'TermsOfService',
      component: () => import('@/pages/TermsOfService.vue'),
      meta: { title: '用户协议', hideBanner: true },
    },
    {
      path: '/achievements',
      name: 'AchievementWall',
      component: () => import('@/pages/AchievementWall.vue'),
      meta: { title: '我的成就' },
    },
    {
      path: '/feed',
      name: 'FeedPage',
      component: () => import('@/pages/FeedPage.vue'),
      meta: { title: '胡闹动态' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) || '胡闹外卖'
})

export default router
