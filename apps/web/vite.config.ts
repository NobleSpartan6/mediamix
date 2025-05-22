import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'lucide-react': new URL('./src/stubs/lucide-react.tsx', import.meta.url).pathname,
      'yjs': new URL('./src/stubs/yjs.ts', import.meta.url).pathname,
      'y-protocols/awareness': new URL('./src/stubs/awareness.ts', import.meta.url).pathname,
    },
  },
  optimizeDeps: {
    // Prevent Vite from trying to pre-bundle FFmpeg which contains its own workers
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
  },
  build: {
    rollupOptions: {
      // Keep FFmpeg packages external so their internal worker URLs resolve at runtime
      external: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: [...configDefaults.exclude, 'dist/**'],
    // Add these options for better test behavior
    mockReset: true,
    clearMocks: true,
    // Handle Vite-specific imports like ?worker
    deps: {
      inline: [
        '@ffmpeg/ffmpeg',
        '@ffmpeg/core'
      ]
    }
  },
});