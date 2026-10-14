import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@nongjiale/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 43123,
    host: true,
  },
})
