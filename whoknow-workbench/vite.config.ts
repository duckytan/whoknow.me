import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * 工作台构建配置。
 * base 固定 '/workbench/'，与根 vercel.json 的 /workbench rewrite 口径一致
 * （rewrite 追加动作属 T08 部署任务，本配置先行对齐路径前缀）。
 */
export default defineConfig({
  base: '/workbench/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2400,
  },
  server: {
    port: 5183,
    strictPort: false,
    open: false,
  },
  preview: {
    port: 5184,
  },
});
