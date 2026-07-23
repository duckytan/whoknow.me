import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/styles/vant-override.scss'
import '@/styles/global.scss'
import { installErrorTracking } from '@/utils/metrics'
import { useAchievementStore } from '@/store/achievement'
import { useOrderStore } from '@/store/order'
import { useShopStore } from '@/store/shop'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// v17 数据指标（决策 #023）· 全局错误捕获
installErrorTracking()

// v18 成就系统：冷启动时检测已有订单是否符合成就条件
const achStore = useAchievementStore()
const orderStore = useOrderStore()
const shopStore = useShopStore()
achStore.check(null, orderStore.orders, shopStore.shops)