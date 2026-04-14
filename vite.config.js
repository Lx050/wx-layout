import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [vue()],
  root: './src',
  // GitHub Pages: use relative base for static deployment
  base: './',
  define: {
    __VUE_OPTIONS_API__: false,
  },
  server: {
    port: 5188,
    strictPort: true,
    proxy: {
      // WeChat image proxy (dev only) — in prod, users configure their own CF Worker
      '/wechat-image-proxy': {
        target: 'https://mmbiz.qpic.cn',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const match = req.url.match(/^\/wechat-image-proxy\/([^/]+\.qpic\.cn)(\/.*)?$/)
            if (match) {
              proxyReq.setHeader('host', match[1])
              proxyReq.path = match[2] || '/'
            }
          })
        },
        rewrite: (path) => path.replace(/^\/wechat-image-proxy\/[^/]+\.qpic\.cn/, ''),
        headers: { 'Referer': 'https://mp.weixin.qq.com' }
      }
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''
          if (/\.(png|jpe?g|gif|svg|webp)/.test(name)) return 'images/[name]-[hash][extname]'
          if (/\.(woff2?|eot|ttf|otf)/.test(name)) return 'fonts/[name]-[hash][extname]'
          if (name.endsWith('.css')) return 'css/[name]-[hash][extname]'
          return 'assets/[name]-[hash][extname]'
        },
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('/pinia/') || id.includes('/@vue/')) return 'vendor-vue'
          if (id.includes('/@tiptap/') || id.includes('/prosemirror-')) return 'vendor-tiptap'
          if (id.includes('/mammoth/')) return 'vendor-docx'
          if (id.includes('/jszip/') || id.includes('/7z-wasm/')) return 'vendor-archive'
          if (id.includes('/element-plus/')) return 'vendor-element'
        }
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia'],
    exclude: ['7z-wasm']
  },
  cacheDir: '/tmp/wx-layout-vite-cache',
  assetsInclude: ['**/*.wasm']
})
