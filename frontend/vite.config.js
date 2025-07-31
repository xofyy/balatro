import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: './',
  
  // Build optimizasyonları
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Asset inline limiti - 4KB altındaki dosyalar base64 olarak inline edilir
    assetsInlineLimit: 4096,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Source map (production'da kapalı performans için)
    sourcemap: false,
    
    // Chunk size uyarı limiti
    chunkSizeWarningLimit: 1000,
    
    // Rollup seçenekleri
    rollupOptions: {
      output: {
        // Manuel chunk splitting - performans optimizasyonu için
        manualChunks: {
          // Phaser'ı ayrı chunk'a al
          'phaser': ['phaser'],
          
          // Utility'leri grupla
          'utils': [
            './src/utils/Card.js',
            './src/utils/Joker.js',
            './src/utils/PokerHands.js',
            './src/utils/AudioManager.js',
            './src/utils/AssetOptimizer.js',
            './src/utils/PerformanceMonitor.js'
          ],
          
          // Scene'leri grupla
          'scenes': [
            './src/scenes/GameScene.js',
            './src/scenes/ShopScene.js',
            './src/scenes/PackOpenScene.js'
          ],
          
          // API client'ları ayrı chunk
          'api': [
            './src/utils/APIClient.js'
          ]
        },
        
        // Asset dosya isimlendirme
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          
          if (/mp3|wav|ogg|flac/i.test(ext)) {
            return `assets/audio/[name]-[hash][extname]`
          }
          
          return `assets/[name]-[hash][extname]`
        },
        
        // JS chunk isimlendirme
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    
    // Terser minification seçenekleri
    minify: 'terser',
    terserOptions: {
      compress: {
        // Console.log'ları production'da kaldır
        drop_console: true,
        drop_debugger: true,
        
        // Unused code elimination
        dead_code: true,
        
        // Function inlining
        inline: 2,
        
        // Evaluate expressions
        evaluate: true
      },
      mangle: {
        // Property mangling - dikkatli kullan
        properties: false
      }
    }
  },
  
  // Development server optimizasyonları
  server: {
    port: 3000,
    open: true,
    host: true,
    cors: true,
    
    // Pre-bundling
    optimizeDeps: {
      include: ['phaser']
    }
  },
  
  // Preview server (build test için)
  preview: {
    port: 4173,
    host: true
  },
  
  // Resolve options
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  }
})