// Performans izleme ve optimizasyon
export default class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            frameTime: [],
            memoryUsage: [],
            renderTime: [],
            updateTime: []
        }
        
        this.startTime = performance.now()
        this.frameCount = 0
        this.lastFrameTime = this.startTime
        this.isMonitoring = false
        
        console.log('📊 PerformanceMonitor başlatıldı')
    }
    
    // İzlemeyi başlat
    startMonitoring(scene) {
        if (this.isMonitoring) return
        
        this.isMonitoring = true
        this.scene = scene
        
        // Her frame'de metrik topla
        this.scene.sys.game.events.on('step', this.collectMetrics, this)
        
        // Periyodik raporlama
        this.reportInterval = setInterval(() => {
            this.generateReport()
        }, 5000) // Her 5 saniyede bir
        
        console.log('📈 Performans izleme başlatıldı')
    }
    
    // İzlemeyi durdur
    stopMonitoring() {
        if (!this.isMonitoring) return
        
        this.isMonitoring = false
        
        if (this.scene) {
            this.scene.sys.game.events.off('step', this.collectMetrics, this)
        }
        
        if (this.reportInterval) {
            clearInterval(this.reportInterval)
        }
        
        console.log('📉 Performans izleme durduruldu')
    }
    
    // Metrik toplama
    collectMetrics() {
        const currentTime = performance.now()
        const deltaTime = currentTime - this.lastFrameTime
        const fps = 1000 / deltaTime
        
        // FPS ve frame time
        this.addMetric('fps', fps)
        this.addMetric('frameTime', deltaTime)
        
        // Memory usage (eğer API mevcut ise)
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024 // MB
            this.addMetric('memoryUsage', memoryUsage)
        }
        
        // Render time (yaklaşık)
        if (this.scene && this.scene.sys.game.renderer) {
            const renderInfo = this.scene.sys.game.renderer.gl ? 
                this.scene.sys.game.renderer.gl.getParameter(this.scene.sys.game.renderer.gl.RENDERER) : 
                'Canvas'
            this.renderInfo = renderInfo
        }
        
        this.lastFrameTime = currentTime
        this.frameCount++
    }
    
    // Metrik ekleme (sliding window)
    addMetric(type, value) {
        if (!this.metrics[type]) {
            this.metrics[type] = []
        }
        
        this.metrics[type].push(value)
        
        // Son 60 değeri tut (yaklaşık 1 saniye @ 60fps)
        if (this.metrics[type].length > 60) {
            this.metrics[type].shift()
        }
    }
    
    // İstatistik hesaplama
    calculateStats(values) {
        if (!values || values.length === 0) return null
        
        const sorted = [...values].sort((a, b) => a - b)
        const sum = values.reduce((a, b) => a + b, 0)
        
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: sum / values.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        }
    }
    
    // Performans raporu oluştur
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            uptime: (performance.now() - this.startTime) / 1000,
            frameCount: this.frameCount,
            renderInfo: this.renderInfo || 'Unknown'
        }
        
        // Her metrik için istatistik hesapla
        Object.keys(this.metrics).forEach(key => {
            const stats = this.calculateStats(this.metrics[key])
            if (stats) {
                report[key] = stats
            }
        })
        
        // Console'a yazdır
        console.log('📊 Performans Raporu:', {
            'Uptime': `${report.uptime.toFixed(1)}s`,
            'Frame Count': report.frameCount,
            'FPS': report.fps ? `${report.fps.avg.toFixed(1)} (min: ${report.fps.min.toFixed(1)})` : 'N/A',
            'Frame Time': report.frameTime ? `${report.frameTime.avg.toFixed(2)}ms` : 'N/A',
            'Memory': report.memoryUsage ? `${report.memoryUsage.avg.toFixed(1)}MB` : 'N/A',
            'Renderer': report.renderInfo
        })
        
        // Performans uyarıları
        this.checkPerformanceIssues(report)
        
        return report
    }
    
    // Performans sorunlarını kontrol et
    checkPerformanceIssues(report) {
        const warnings = []
        
        // Düşük FPS
        if (report.fps && report.fps.avg < 30) {
            warnings.push(`⚠️ Düşük FPS: ${report.fps.avg.toFixed(1)}`)
        }
        
        // Yüksek frame time
        if (report.frameTime && report.frameTime.avg > 33) { // 33ms = 30fps
            warnings.push(`⚠️ Yüksek frame time: ${report.frameTime.avg.toFixed(2)}ms`)
        }
        
        // Yüksek memory kullanımı
        if (report.memoryUsage && report.memoryUsage.avg > 100) { // 100MB
            warnings.push(`⚠️ Yüksek memory kullanımı: ${report.memoryUsage.avg.toFixed(1)}MB`)
        }
        
        // Memory leak kontrolü
        if (report.memoryUsage && this.lastMemoryUsage) {
            const memoryIncrease = report.memoryUsage.avg - this.lastMemoryUsage
            if (memoryIncrease > 10) { // 10MB artış
                warnings.push(`⚠️ Olası memory leak: +${memoryIncrease.toFixed(1)}MB`)
            }
        }
        
        if (warnings.length > 0) {
            console.warn('🚨 Performans Uyarıları:', warnings)
        }
        
        // Son memory kullanımını sakla
        if (report.memoryUsage) {
            this.lastMemoryUsage = report.memoryUsage.avg
        }
    }
    
    // Manuel performans ölçümü başlat
    startMeasure(name) {
        this.measures = this.measures || {}
        this.measures[name] = performance.now()
    }
    
    // Manuel performans ölçümü bitir
    endMeasure(name) {
        if (!this.measures || !this.measures[name]) return 0
        
        const duration = performance.now() - this.measures[name]
        delete this.measures[name]
        
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
        return duration
    }
    
    // Browser performans API'lerini kullan
    measureWithAPI(name, fn) {
        if (performance.mark && performance.measure) {
            const startMark = `${name}-start`
            const endMark = `${name}-end`
            
            performance.mark(startMark)
            const result = fn()
            performance.mark(endMark)
            
            performance.measure(name, startMark, endMark)
            
            // Ölçümü temizle
            performance.clearMarks(startMark)
            performance.clearMarks(endMark)
            performance.clearMeasures(name)
            
            return result
        } else {
            // Fallback
            this.startMeasure(name)
            const result = fn()
            this.endMeasure(name)
            return result
        }
    }
    
    // Phaser sahne metrikleri
    getSceneMetrics(scene) {
        if (!scene) return {}
        
        return {
            displayList: scene.children.list.length,
            updateList: scene.sys.updateList.length,
            tweenManager: scene.tweens ? (scene.tweens._tweens ? scene.tweens._tweens.length : 0) : 0,
            timerEvents: scene.time ? (scene.time._events ? scene.time._events.length : 0) : 0,
            cameras: scene.cameras.cameras.length,
            lights: scene.lights ? scene.lights.lights.length : 0
        }
    }
    
    // Optimizasyon önerileri
    getOptimizationSuggestions(report) {
        const suggestions = []
        
        if (report.fps && report.fps.avg < 45) {
            suggestions.push('FPS artırmak için sprite batch kullanın')
            suggestions.push('Gereksiz tween\'leri temizleyin') 
            suggestions.push('Texture atlas kullanmayı düşünün')
        }
        
        if (report.memoryUsage && report.memoryUsage.avg > 80) {
            suggestions.push('Kullanılmayan texture\'ları destroy edin')
            suggestions.push('Object pooling kullanın')
            suggestions.push('Event listener\'ları temizleyin')
        }
        
        return suggestions
    }
    
    // Temizlik
    destroy() {
        this.stopMonitoring()
        this.metrics = {}
        this.measures = {}
        console.log('🧹 PerformanceMonitor temizlendi')
    }
}

// Global instance
let globalPerformanceMonitor = null

export function getPerformanceMonitor() {
    return globalPerformanceMonitor
}

export function setPerformanceMonitor(monitor) {
    globalPerformanceMonitor = monitor
}