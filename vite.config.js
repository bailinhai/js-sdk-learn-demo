import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // 忽略'use client'指令相关的警告
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        // 忽略以#开头的模块导入警告
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.source && warning.source.startsWith('#')) {
          return;
        }
        warn(warning);
      },
      // 将所有以#开头的模块标记为外部模块
      external: (id) => id.startsWith('#')
    },
    commonjsOptions: {
      esmExternals: true,
      transformMixedEsModules: true
    }
  }
})
