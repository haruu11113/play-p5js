import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { wsUdpPlugin } from './src/plugins/wsUdpPlugin'

export default defineConfig({
  assetsInclude: ['**/*.vert', '**/*.frag'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    vue(),
    wsUdpPlugin()
  ]
})
