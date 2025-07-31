// Joker sprite yönetimi ve görsel fonksiyonları
import { Joker } from './Joker.js'
import { getAudioManager } from './AudioManager.js'

// Joker sprite sınıfı - Phaser GameObject'ini extend eder
export class JokerSprite extends Phaser.GameObjects.Container {
    constructor(scene, x, y, joker) {
        super(scene, x, y)
        
        this.scene = scene
        this.joker = joker
        this.isSelected = false
        this.originalX = x
        this.originalY = y
        
        this.createJokerVisual()
        this.setupInteraction()
        
        // Sahneye ekle
        scene.add.existing(this)
    }
    
    createJokerVisual() {
        // Joker boyutları
        const jokerWidth = 80
        const jokerHeight = 100
        
        // Arka plan (joker çerçevesi) - nadirlğe göre renk
        const rarityColor = this.getRarityColor()
        this.background = this.scene.add.rectangle(0, 0, jokerWidth, jokerHeight, rarityColor, 0.8)
        this.background.setStrokeStyle(3, rarityColor)
        this.add(this.background)
        
        // Joker ismi (üstte)
        this.nameText = this.scene.add.text(0, -35, this.joker.name, {
            fontSize: '12px',
            fill: '#fff',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5)
        this.add(this.nameText)
        
        // Joker ikonu (merkez)
        this.iconText = this.scene.add.text(0, -10, this.getJokerIcon(), {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        this.add(this.iconText)
        
        // Nadirlık göstergesi
        this.rarityText = this.scene.add.text(0, 10, this.joker.rarity.toUpperCase(), {
            fontSize: '8px',
            fill: rarityColor,
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5)
        this.add(this.rarityText)
        
        // Tetiklenme sayacı
        this.triggerCountText = this.scene.add.text(0, 25, `${this.joker.stats.timesTriggered}x`, {
            fontSize: '10px',
            fill: '#ffeb3b',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        this.add(this.triggerCountText)
        
        // Aktiflik durumu göstergesi
        this.statusIndicator = this.scene.add.circle(30, -35, 4, this.joker.isActive ? 0x4caf50 : 0xf44336)
        this.add(this.statusIndicator)
        
        // Seçili durumu için glow efekti
        this.selectionGlow = this.scene.add.rectangle(0, 0, jokerWidth + 6, jokerHeight + 6, 0xffff00, 0)
        this.selectionGlow.setStrokeStyle(3, 0xffff00, 0)
        this.add(this.selectionGlow)
        this.sendToBack(this.selectionGlow)
        
        // Açıklama tooltip'i (başlangıçta gizli)
        this.createTooltip()
    }
    
    createTooltip() {
        // Tooltip arka planı
        this.tooltip = this.scene.add.container(0, -60)
        
        const tooltipBg = this.scene.add.rectangle(0, 0, 200, 40, 0x000000, 0.9)
        tooltipBg.setStrokeStyle(2, 0xffffff, 0.8)
        this.tooltip.add(tooltipBg)
        
        const tooltipText = this.scene.add.text(0, 0, this.joker.description, {
            fontSize: '10px',
            fill: '#fff',
            fontFamily: 'monospace',
            align: 'center',
            wordWrap: { width: 180 }
        }).setOrigin(0.5)
        this.tooltip.add(tooltipText)
        
        this.tooltip.setVisible(false)
        this.add(this.tooltip)
    }
    
    getJokerIcon() {
        // Joker ID'sine göre ikon belirle
        const icons = {
            red_card: '♥♦',
            odd_todd: '135',
            greedy_joker: '$$',
            fibonacci: 'Φ',
            perfectionist: '★',
            juggler: '⚽'
        }
        return icons[this.joker.id] || '🃏'
    }
    
    getRarityColor() {
        const colors = {
            common: 0x9e9e9e,    // Gri
            uncommon: 0x4caf50,  // Yeşil
            rare: 0x2196f3,      // Mavi
            legendary: 0xff9800  // Turuncu
        }
        return colors[this.joker.rarity] || 0x9e9e9e
    }
    
    setupInteraction() {
        this.setInteractive(new Phaser.Geom.Rectangle(-40, -50, 80, 100), Phaser.Geom.Rectangle.Contains)
        
        // Hover efektleri
        this.on('pointerover', () => {
            this.setScale(1.1)
            this.setDepth(20)
            this.tooltip.setVisible(true)
        })
        
        this.on('pointerout', () => {
            if (!this.isSelected) {
                this.setScale(1)
                this.setDepth(0)
            }
            this.tooltip.setVisible(false)
        })
        
        // Tıklama
        this.on('pointerdown', () => {
            this.handleClick()
        })
    }
    
    handleClick() {
        // Joker aktif/pasif durumunu değiştir
        this.joker.isActive = !this.joker.isActive
        this.updateVisuals()
        
        // Event gönder
        this.scene.events.emit('jokerToggled', this.joker, this)
        
        console.log(`${this.joker.name} ${this.joker.isActive ? 'aktif' : 'pasif'} hale getirildi`)
    }
    
    // Joker'ı seç/seçimi kaldır  
    setSelected(selected) {
        this.isSelected = selected
        this.selectionGlow.setAlpha(selected ? 0.6 : 0)
        this.selectionGlow.setStrokeStyle(3, 0xffff00, selected ? 1 : 0)
        
        if (selected) {
            this.setScale(1.1)
            this.setDepth(20)
        } else {
            this.setScale(1)
            this.setDepth(0)
        }
    }
    
    // Joker görsellerini güncelle
    updateVisuals() {
        // Aktiflik durumu göstergesi
        this.statusIndicator.setFillStyle(this.joker.isActive ? 0x4caf50 : 0xf44336)
        
        // Tetiklenme sayacı
        this.triggerCountText.setText(`${this.joker.stats.timesTriggered}x`)
        
        // Alpha değeri (pasif jokerler için)
        this.setAlpha(this.joker.isActive ? 1.0 : 0.6)
    }
    
    // Joker efekt animasyonu
    playEffectAnimation() {
        // Joker tetikleme ses efekti
        const audioManager = getAudioManager()
        if (audioManager) {
            audioManager.playSFX('jokerTrigger')
        }
        
        // Joker çerçevesinin parlama efekti
        this.scene.tweens.add({
            targets: this.background,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 150,
            yoyo: true,
            ease: 'Power2.easeOut'
        })
        
        // Joker ikonunun büyüme animasyonu
        this.scene.tweens.add({
            targets: this.iconText,
            scale: 1.8,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut'
        })
        
        // Çoklu parıltı efektleri
        for (let i = 0; i < 3; i++) {
            const sparkles = ['✨', '⭐', '💫', '🌟']
            const sparkle = this.scene.add.text(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                sparkles[Math.floor(Math.random() * sparkles.length)],
                {
                    fontSize: '14px',
                    fontFamily: 'monospace'
                }
            ).setOrigin(0.5)
            this.add(sparkle)
            
            this.scene.tweens.add({
                targets: sparkle,
                x: sparkle.x + (Math.random() - 0.5) * 100,
                y: sparkle.y - 40 - Math.random() * 20,
                alpha: 0,
                scale: 0.5,
                duration: 600 + Math.random() * 400,
                ease: 'Power2.easeOut',
                delay: i * 100,
                onComplete: () => {
                    sparkle.destroy()
                }
            })
        }
        
        // Hafif glow efekti
        const originalTint = this.background.tint
        this.scene.tweens.add({
            targets: this.background,
            duration: 300,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const t = tween.progress
                const glowIntensity = Math.sin(t * Math.PI) * 0.3
                this.background.setTint(Phaser.Display.Color.GetColor(
                    255 * (1 + glowIntensity),
                    255 * (1 + glowIntensity * 0.8),
                    255 * (1 + glowIntensity * 0.5)
                ))
            },
            onComplete: () => {
                this.background.setTint(originalTint)
            }
        })
        
        // İstatistikleri güncelle
        this.updateVisuals()
        
        // Ses efekti simülasyonu
        console.log(`🎊 ${this.joker.name} jokeri tetiklendi!`)
    }
    
    // Joker'ı yok et (animasyonlu)
    destroyJoker() {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.1,
            rotation: Math.PI,
            duration: 500,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.destroy()
            }
        })
    }
    
    // Joker'ı pozisyona taşı
    moveToPosition(x, y, duration = 500) {
        this.originalX = x
        this.originalY = y
        
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                x: x,
                y: y,
                duration: duration,
                ease: 'Power2.easeOut',
                onComplete: resolve
            })
        })
    }
}

// Joker sprite fabrikası
export function createJokerSprite(scene, x, y, joker) {
    return new JokerSprite(scene, x, y, joker)
}