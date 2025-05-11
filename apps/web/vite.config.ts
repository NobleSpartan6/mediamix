import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Prevent Vite from trying to pre-bundle FFmpeg which contains its own workers.
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
  },
  build: {
    rollupOptions: {
      // Keep FFmpeg packages external so their internal worker URLs resolve at runtime.
      external: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: [...configDefaults.exclude, 'dist/**']
  },
})
