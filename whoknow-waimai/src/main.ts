import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/styles/vant-override.scss'
import '@/styles/global.scss'
import { installErrorTracking } from '@/utils/metrics'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// v17 数据指标（决策 #023）· 全局错误捕获
installErrorTracking()