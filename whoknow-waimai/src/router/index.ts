import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ShopListView from '../views/ShopListView.vue'
import ShopView from '../views/ShopView.vue'
import OrderView from '../views/OrderView.vue'
import OrdersView from '../views/OrdersView.vue'
import AchievementsView from '../views/AchievementsView.vue'

const router = createRouter({
  history: createWebHistory('/waimai/'),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/shops', name: 'shops', component: ShopListView },
    { path: '/shop/:id', name: 'shop', component: ShopView },
    { path: '/order', name: 'order', component: OrderView },
    { path: '/orders', name: 'orders', component: OrdersView },
    { path: '/achievements', name: 'achievements', component: AchievementsView },
  ],
})

export default router
