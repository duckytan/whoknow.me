import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

// 部署在 /mart 下（Vercel: /mart → whoknow-mart/dist，对齐根 vercel.json 重写）
// PWA：纯前端离线可玩（MVP 单机 0 成本）；图标待美术资产补齐（v2），此处不引用缺失文件避免构建失败。
export default defineConfig({
  base: '/mart/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '胡闹导购',
        short_name: '导购',
        description: '反骨消费劝退模拟器',
        theme_color: '#FF5000',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'zh-CN',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5174 },
})
