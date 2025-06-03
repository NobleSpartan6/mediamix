import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      'lucide-react': new URL('./src/stubs/lucide-react.tsx', import.meta.url).pathname,
      'yjs': new URL('./src/stubs/yjs.ts', import.meta.url).pathname,
      'y-protocols/awareness': new URL('./src/stubs/awareness.ts', import.meta.url).pathname,
      '@radix-ui/react-menubar': new URL('./src/stubs/radix-menubar.tsx', import.meta.url).pathname,
    },
  },

  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
  },

  build: {
    rollupOptions: {
      external: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: [...configDefaults.exclude, 'dist/**'],
    mockReset: true,
    clearMocks: true,
    deps: {
      inline: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
    },
  },
});
