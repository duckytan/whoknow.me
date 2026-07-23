import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import ShopList from '@/pages/ShopList.vue'
import ShopDetail from '@/pages/ShopDetail.vue'
import Checkout from '@/pages/Checkout.vue'
import CartPage from '@/pages/CartPage.vue'
import OrderHistory from '@/pages/OrderHistory.vue'
import OrderDetail from '@/pages/OrderDetail.vue'
import PrivacyPolicy from '@/pages/PrivacyPolicy.vue'
import TermsOfService from '@/pages/TermsOfService.vue'
import AchievementWall from '@/pages/AchievementWall.vue'
import FeedPage from '@/pages/FeedPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: { title: '胡闹外卖' },
    },
    {
      path: '/shops',
      name: 'ShopList',
      component: ShopList,
      meta: { title: '商家列表' },
    },
    {
      path: '/shop/:id',
      name: 'ShopDetail',
      component: ShopDetail,
      meta: { title: '点餐' },
    },
    {
      path: '/checkout',
      name: 'Checkout',
      component: Checkout,
      meta: { title: '确认下单' },
    },
    {
      path: '/cart',
      name: 'CartPage',
      component: CartPage,
      meta: { title: '购物车' },
    },
    {
      path: '/orders',
      name: 'OrderHistory',
      component: OrderHistory,
      meta: { title: '我的订单' },
    },
    {
      path: '/order/:id',
      name: 'OrderDetail',
      component: OrderDetail,
      meta: { title: '订单详情' },
    },
    {
      path: '/privacy',
      name: 'PrivacyPolicy',
      component: PrivacyPolicy,
      meta: { title: '隐私政策', hideBanner: true },
    },
    {
      path: '/terms',
      name: 'TermsOfService',
      component: TermsOfService,
      meta: { title: '用户协议', hideBanner: true },
    },
    {
      path: '/achievements',
      name: 'AchievementWall',
      component: AchievementWall,
      meta: { title: '我的成就' },
    },
    {
      path: '/feed',
      name: 'FeedPage',
      component: FeedPage,
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
