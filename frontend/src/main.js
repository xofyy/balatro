import Phaser from 'phaser'
import GameScene from './scenes/GameScene.js'
import ShopScene from './scenes/ShopScene.js'
import PackOpenScene from './scenes/PackOpenScene.js'

// Phaser oyun yapılandırması
const config = {
    type: Phaser.AUTO, // WebGL öncelikli, Canvas fallback
    width: 960,        // Temel çözünürlük genişlik
    height: 540,       // Temel çözünürlük yükseklik
    parent: 'phaser-game', // HTML element ID'si
    backgroundColor: '#1a1a2e', // Arka plan rengi
    
    // Ölçeklendirme ayarları - responsive design için
    scale: {
        mode: Phaser.Scale.FIT, // Ekrana sıkıştır ama oranı koru
        autoCenter: Phaser.Scale.CENTER_BOTH, // Ortalama
        width: 960,
        height: 540,
        min: {
            width: 480,  // Minimum genişlik
            height: 270  // Minimum yükseklik
        },
        max: {
            width: 1920, // Maksimum genişlik
            height: 1080 // Maksimum yükseklik
        }
    },
    
    // Fizik motoru (şimdilik gerekmiyor ama ileride kullanabiliriz)
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Yerçekimi yok
            debug: false       // Debug modunu kapat
        }
    },
    
    // Sahne listesi
    scene: [GameScene, ShopScene, PackOpenScene],
    
    // Oyun ayarları
    render: {
        pixelArt: true,    // Piksel art için optimize et
        antialias: false,  // Antialiasing'i kapat (piksel art için)
        roundPixels: true  // Piksel hizalamasını iyileştir
    },
    
    // Ses ayarları
    audio: {
        disableWebAudio: false
    }
}

// Oyunu başlat
const game = new Phaser.Game(config)

// Oyun objesi global erişim için (geliştirme amaçlı)
window.game = game

// Geliştirme bilgileri
console.log('🎮 Balatro Tarzı Kart Oyunu Başlatıldı!')
console.log('📏 Çözünürlük:', config.width, 'x', config.height)
console.log('🎯 Render Modu:', config.type === Phaser.AUTO ? 'AUTO (WebGL/Canvas)' : 'Manuel')
console.log('⚙️ Phaser Versiyonu:', Phaser.VERSION)