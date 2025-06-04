import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react()],

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
