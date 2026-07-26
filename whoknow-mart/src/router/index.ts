import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductView from '../views/ProductView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import GameView from '../views/GameView.vue'
import CodexView from '../views/CodexView.vue'
import ProfileView from '../views/ProfileView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/product/:id', name: 'product', component: ProductView },
    { path: '/checkout', name: 'checkout', component: CheckoutView },
    { path: '/game/:guideId?', name: 'game', component: GameView },
    { path: '/codex', name: 'codex', component: CodexView },
    { path: '/profile', name: 'profile', component: ProfileView },
  ],
})
