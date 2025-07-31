// Varlık optimizasyonu ve cache yönetimi
export default class AssetOptimizer {
    constructor() {
        this.textureCache = new Map()
        this.soundCache = new Map()
        this.dataCache = new Map()
        this.compressionEnabled = true
        this.maxCacheSize = 50 // MB
        this.currentCacheSize = 0
        
        console.log('🚀 AssetOptimizer başlatıldı')
    }
    
    // Texture optimizasyonu ve cache
    optimizeTexture(scene, key, width, height, drawFunction) {
        const cacheKey = `${key}_${width}_${height}`
        
        // Cache'de var mı kontrol et
        if (this.textureCache.has(cacheKey)) {
            console.log(`💾 Texture cache hit: ${cacheKey}`)
            return this.textureCache.get(cacheKey)
        }
        
        // Yeni texture oluştur
        const graphics = scene.add.graphics()
        drawFunction(graphics)
        
        // RenderTexture oluştur (daha performanslı)
        const renderTexture = scene.add.renderTexture(0, 0, width, height)
        renderTexture.draw(graphics, width/2, height/2)
        
        // Graphics objesini temizle (memory leak önleme)
        graphics.destroy()
        
        // Cache'e ekle
        this.textureCache.set(cacheKey, renderTexture)
        this.updateCacheSize(width * height * 4) // RGBA
        
        console.log(`✅ Texture oluşturuldu ve cache lendi: ${cacheKey}`)
        return renderTexture
    }
    
    // Kart texture'larını batch olarak oluştur
    batchCreateCardTextures(scene) {
        console.log('🔄 Kart textures batch oluşturuluyor...')
        
        const cardWidth = 60
        const cardHeight = 90
        const suits = ['♠', '♥', '♦', '♣']
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
        
        // Tüm kombinasyonları önceden oluştur
        suits.forEach(suit => {
            values.forEach(value => {
                const key = `card_${suit}_${value}`
                this.optimizeTexture(scene, key, cardWidth, cardHeight, (graphics) => {
                    // Kart arka planı
                    graphics.fillStyle(0xffffff)
                    graphics.fillRoundedRect(0, 0, cardWidth, cardHeight, 5)
                    graphics.lineStyle(2, 0x000000)
                    graphics.strokeRoundedRect(0, 0, cardWidth, cardHeight, 5)
                })
            })
        })
        
        // Kart arkası
        this.optimizeTexture(scene, 'card_back', cardWidth, cardHeight, (graphics) => {
            graphics.fillStyle(0x4a4a4a)
            graphics.fillRoundedRect(0, 0, cardWidth, cardHeight, 5)
            graphics.lineStyle(2, 0x888888)
            graphics.strokeRoundedRect(0, 0, cardWidth, cardHeight, 5)
        })
        
        console.log('✅ Kart textures hazırlandı')
    }
    
    // Joker texture'larını optimize et
    optimizeJokerTextures(scene) {
        console.log('🃏 Joker textures optimize ediliyor...')
        
        const jokerWidth = 80
        const jokerHeight = 100
        const rarityColors = {
            common: 0x808080,
            uncommon: 0x4caf50,
            rare: 0x2196f3,
            legendary: 0xff9800
        }
        
        Object.entries(rarityColors).forEach(([rarity, color]) => {
            this.optimizeTexture(scene, `joker_${rarity}`, jokerWidth, jokerHeight, (graphics) => {
                graphics.fillStyle(color, 0.8)
                graphics.fillRoundedRect(0, 0, jokerWidth, jokerHeight, 8)
                graphics.lineStyle(3, color)
                graphics.strokeRoundedRect(0, 0, jokerWidth, jokerHeight, 8)
            })
        })
        
        console.log('✅ Joker textures optimize edildi')
    }
    
    // UI elemanlarını optimize et
    optimizeUIElements(scene) {
        console.log('🎨 UI elemanları optimize ediliyor...')
        
        // Buton texture'ları
        const buttonConfigs = [
            { key: 'button_primary', color: 0x4caf50, width: 120, height: 40 },
            { key: 'button_secondary', color: 0x2196f3, width: 120, height: 40 },
            { key: 'button_danger', color: 0xf44336, width: 120, height: 40 },
            { key: 'button_small', color: 0x666666, width: 80, height: 30 }
        ]
        
        buttonConfigs.forEach(config => {
            this.optimizeTexture(scene, config.key, config.width, config.height, (graphics) => {
                graphics.fillStyle(config.color, 0.9)
                graphics.fillRoundedRect(0, 0, config.width, config.height, 8)
                graphics.lineStyle(2, config.color)
                graphics.strokeRoundedRect(0, 0, config.width, config.height, 8)
            })
        })
        
        // Progress bar texture'ları
        this.optimizeTexture(scene, 'progress_bg', 200, 20, (graphics) => {
            graphics.fillStyle(0x333333)
            graphics.fillRoundedRect(0, 0, 200, 20, 10)
            graphics.lineStyle(2, 0x666666)
            graphics.strokeRoundedRect(0, 0, 200, 20, 10)
        })
        
        this.optimizeTexture(scene, 'progress_fill', 200, 20, (graphics) => {
            graphics.fillStyle(0x4caf50)
            graphics.fillRoundedRect(0, 0, 200, 20, 10)
        })
        
        console.log('✅ UI elemanları optimize edildi')
    }
    
    // Memory kullanımını optimize et
    optimizeMemoryUsage() {
        // Garbage collection'ı tetikle
        if (window.gc && typeof window.gc === 'function') {
            window.gc()
        }
        
        // Cache boyutunu kontrol et
        if (this.currentCacheSize > this.maxCacheSize * 1024 * 1024) {
            this.cleanupCache()
        }
        
        console.log(`💾 Mevcut cache boyutu: ${(this.currentCacheSize / 1024 / 1024).toFixed(2)} MB`)
    }
    
    // Cache temizliği
    cleanupCache() {
        console.log('🧹 Cache temizliği başlatılıyor...')
        
        // En az kullanılan texture'ları temizle (LRU)
        const entries = Array.from(this.textureCache.entries())
        const sortedEntries = entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
        
        // %25'ini temizle
        const cleanupCount = Math.floor(entries.length * 0.25)
        for (let i = 0; i < cleanupCount; i++) {
            const [key, texture] = sortedEntries[i]
            if (texture && texture.destroy) {
                texture.destroy()
            }
            this.textureCache.delete(key)
        }
        
        this.currentCacheSize *= 0.75 // Yaklaşık hesaplama
        console.log(`✅ ${cleanupCount} texture cache den temizlendi`)
    }
    
    // Texture atlas oluştur (performans için)
    createTextureAtlas(scene, textures) {
        console.log('📦 Texture atlas oluşturuluyor...')
        
        const atlasWidth = 512
        const atlasHeight = 512
        const atlas = scene.add.renderTexture(0, 0, atlasWidth, atlasHeight)
        
        let currentX = 0
        let currentY = 0
        let rowHeight = 0
        const atlasMap = new Map()
        
        textures.forEach(({ key, texture, width, height }) => {
            // Sığmıyorsa yeni satıra geç
            if (currentX + width > atlasWidth) {
                currentX = 0
                currentY += rowHeight
                rowHeight = 0
            }
            
            // Atlas'a çiz
            atlas.draw(texture, currentX, currentY)
            
            // Koordinatları kaydet
            atlasMap.set(key, {
                x: currentX,
                y: currentY,
                width: width,
                height: height
            })
            
            currentX += width
            rowHeight = Math.max(rowHeight, height)
        })
        
        this.textureAtlas = atlas
        this.atlasMap = atlasMap
        
        console.log(`✅ Texture atlas oluşturuldu: ${textures.length} texture`)
        return { atlas, atlasMap }
    }
    
    // Performans istatistikleri
    getPerformanceStats() {
        return {
            textureCacheSize: this.textureCache.size,
            soundCacheSize: this.soundCache.size,
            dataCacheSize: this.dataCache.size,
            totalCacheSize: `${(this.currentCacheSize / 1024 / 1024).toFixed(2)} MB`,
            compressionEnabled: this.compressionEnabled
        }
    }
    
    // Cache boyutu güncelle
    updateCacheSize(bytes) {
        this.currentCacheSize += bytes
    }
    
    // Vite için build optimizasyonları
    generateBuildOptimizations() {
        return {
            // Rollup optimizasyonları
            rollupOptions: {
                output: {
                    manualChunks: {
                        'phaser': ['phaser'],
                        'utils': [
                            './src/utils/Card.js',
                            './src/utils/Joker.js',
                            './src/utils/PokerHands.js'
                        ],
                        'scenes': [
                            './src/scenes/GameScene.js',
                            './src/scenes/ShopScene.js',
                            './src/scenes/PackOpenScene.js'
                        ]
                    }
                }
            },
            // Asset optimizasyonları
            assetsInlineLimit: 4096, // 4KB altındaki dosyalar inline
            // CSS optimizasyonları
            cssCodeSplit: true,
            // Source map optimizasyonları
            sourcemap: false // Production'da kapalı
        }
    }
    
    // Temizlik
    destroy() {
        // Tüm cache leri temizle
        this.textureCache.forEach(texture => {
            if (texture && texture.destroy) {
                texture.destroy()
            }
        })
        
        this.textureCache.clear()
        this.soundCache.clear()
        this.dataCache.clear()
        
        if (this.textureAtlas) {
            this.textureAtlas.destroy()
        }
        
        console.log('🧹 AssetOptimizer temizlendi')
    }
}

// Global instance
let globalAssetOptimizer = null

export function getAssetOptimizer() {
    return globalAssetOptimizer
}

export function setAssetOptimizer(optimizer) {
    globalAssetOptimizer = optimizer
}