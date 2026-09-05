/**
 * 工作台入口：挂载 Pinia + Router + Element Plus（按需） + 皮肤状态 + 全局样式。
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/theme-chalk/dark/css-vars.css'; // 仅 CSS 变量，体积极小；组件/样式由 resolver 按需接管
import './styles/tokens.css';
import './skins/tokens.cosmos-dark.css';
import './skins/tokens.paper-light.css';
import './skins/tokens.legacy.css';
import './styles/fonts.css'; // T2 产出：5 套字体 @font-face（font-display: swap）
import './styles/global.css';
import App from './App.vue';
import router from './router';
import { useSkinStore } from '@/stores/skin';

const app = createApp(App);

app.use(createPinia());
app.use(router);
// locale 经 app.use(ElementPlus) 注入中文文案；组件/样式由 vite 的 ElementPlusResolver 按需引入
app.use(ElementPlus, { locale: zhCn });

// 挂载前应用皮肤（写入 <html data-skin> + dark 类 + 解析 chartTokens），与 index.html 内联脚本双重保险
useSkinStore().apply();

app.mount('#app');
