import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router/index.ts'
import './style.css'
import { registerSW } from 'virtual:pwa-register'

// PWA 注册（vite-plugin-pwa 注入 virtual 模块；离线可玩）
registerSW({ immediate: true })

createApp(App).use(createPinia()).use(router).mount('#app')
