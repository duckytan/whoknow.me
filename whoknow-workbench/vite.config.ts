import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

/**
 * 工作台构建配置。
 * base 固定 '/workbench/'，与根 vercel.json 的 /workbench rewrite 口径一致
 * （rewrite 追加动作属 T08 部署任务，本配置先行对齐路径前缀）。
 *
 * T3：接入 unplugin-auto-import + unplugin-vue-components（ElementPlusResolver），
 * 实现 Element Plus 组件 / 样式按需引入；并产出 auto-imports.d.ts / components.d.ts。
 */
export default defineConfig({
  base: '/workbench/',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
      imports: ['vue', 'vue-router', 'pinia'],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
      dirs: [],
    }),
  ],
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
    rollupOptions: {
      output: {
        // 字体 woff2 用稳定文件名（无内容哈希），便于 index.html 的 <link preload> 长期有效
        assetFileNames: (assetInfo) => {
          const names = [assetInfo.name, assetInfo.originalFileName].filter(
            (n): n is string => typeof n === 'string',
          );
          const isFont = names.some((n) => /\.woff2?$/i.test(n));
          if (isFont) {
            const base = (assetInfo.name || 'font').replace(/\.[^.]+$/, '');
            return `assets/fonts/${base}[extname]`;
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
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
