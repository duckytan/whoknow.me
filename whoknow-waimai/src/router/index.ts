import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ShopListView from '../views/ShopListView.vue'
import ShopView from '../views/ShopView.vue'
import OrderView from '../views/OrderView.vue'
import OrdersView from '../views/OrdersView.vue'
import AchievementsView from '../views/AchievementsView.vue'
import ServiceView from '../views/ServiceView.vue'
import FeedView from '../views/FeedView.vue'
import PrivacyView from '../views/PrivacyView.vue'
import TermsView from '../views/TermsView.vue'
import ProfileView from '../views/ProfileView.vue'
import SettingsView from '../views/SettingsView.vue'
import AboutView from '../views/AboutView.vue'

const router = createRouter({
  history: createWebHistory('/waimai/'),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/shops', name: 'shops', component: ShopListView },
    { path: '/shop/:id', name: 'shop', component: ShopView },
    { path: '/order', name: 'order', component: OrderView },
    { path: '/orders', name: 'orders', component: OrdersView },
    { path: '/achievements', name: 'achievements', component: AchievementsView },
    { path: '/feed', name: 'feed', component: FeedView },
    { path: '/service', name: 'service', component: ServiceView },
    { path: '/privacy', name: 'privacy', component: PrivacyView },
    { path: '/terms', name: 'terms', component: TermsView },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/about', name: 'about', component: AboutView },
  ],
})

export default router
