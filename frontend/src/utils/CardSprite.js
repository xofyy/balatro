// Kart sprite yönetimi ve görsel fonksiyonları
import { SUITS, VALUES, getCardColor } from './Card.js'

// Kart sprite sınıfı - Phaser GameObject'ini extend eder
export class CardSprite extends Phaser.GameObjects.Container {
    constructor(scene, x, y, card) {
        super(scene, x, y)
        
        this.scene = scene
        this.card = card
        this.isSelected = false
        this.isDragging = false
        this.originalX = x
        this.originalY = y
        
        this.createCardVisual()
        this.setupInteraction()
        
        // Sahneye ekle
        scene.add.existing(this)
    }
    
    createCardVisual() {
        // Kart boyutları (piksel art stili)
        const cardWidth = 60
        const cardHeight = 84
        
        // Arka plan (kart çerçevesi)
        this.background = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff)
        this.background.setStrokeStyle(2, 0x333333)
        this.add(this.background)
        
        // Kart değeri metni
        const valueText = this.getDisplayValue()
        this.valueDisplay = this.scene.add.text(-20, -25, valueText, {
            fontSize: '14px',
            fill: this.getCardTextColor(),
            fontFamily: 'monospace',
            fontStyle: 'bold'
        })
        this.add(this.valueDisplay)
        
        // Kart türü sembolü
        const suitSymbol = this.getSuitSymbol()
        this.suitDisplay = this.scene.add.text(15, -25, suitSymbol, {
            fontSize: '16px', 
            fill: this.getCardTextColor(),
            fontFamily: 'monospace'
        })
        this.add(this.suitDisplay)
        
        // Merkez sembol (büyük)
        this.centerSymbol = this.scene.add.text(0, 0, suitSymbol, {
            fontSize: '24px',
            fill: this.getCardTextColor(),
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        this.add(this.centerSymbol)
        
        // Enhancement göstergesi
        this.createEnhancementVisual()
        
        // Seçili durumu için glow efekti
        this.selectionGlow = this.scene.add.rectangle(0, 0, cardWidth + 6, cardHeight + 6, 0xffff00, 0)
        this.selectionGlow.setStrokeStyle(3, 0xffff00, 0)
        this.add(this.selectionGlow)
        this.sendToBack(this.selectionGlow)
    }
    
    createEnhancementVisual() {
        if (this.card.enhancements.length === 0) return
        
        // Enhancement için küçük renkli nokta
        const enhancementColor = this.getEnhancementColor()
        this.enhancementDot = this.scene.add.circle(20, 25, 4, enhancementColor)
        this.add(this.enhancementDot)
        
        // Enhancement tooltip için text
        if (this.card.enhancements.length > 0) {
            const enhancementText = this.card.enhancements[0] // İlk enhancement'ı göster
            this.enhancementLabel = this.scene.add.text(0, 35, enhancementText.substr(0, 4), {
                fontSize: '8px',
                fill: '#666',
                fontFamily: 'monospace'
            }).setOrigin(0.5)
            this.add(this.enhancementLabel)
        }
    }
    
    getDisplayValue() {
        switch(this.card.value) {
            case VALUES.JACK: return 'J'
            case VALUES.QUEEN: return 'Q' 
            case VALUES.KING: return 'K'
            case VALUES.ACE: return 'A'
            default: return this.card.value
        }
    }
    
    getSuitSymbol() {
        switch(this.card.suit) {
            case SUITS.SPADES: return '♠'
            case SUITS.HEARTS: return '♥'
            case SUITS.DIAMONDS: return '♦'
            case SUITS.CLUBS: return '♣'
            default: return '?'
        }
    }
    
    getCardTextColor() {
        const color = getCardColor(this.card.suit)
        return color === 'red' ? '#d32f2f' : '#333333'
    }
    
    getEnhancementColor() {
        if (this.card.enhancements.length === 0) return 0x666666
        
        const enhancement = this.card.enhancements[0]
        switch(enhancement) {
            case 'WILD': return 0x9c27b0      // Mor
            case 'GLASS': return 0x00bcd4     // Cyan
            case 'STEEL': return 0x607d8b     // Gri
            case 'GOLD': return 0xffc107      // Altın
            case 'STONE': return 0x795548     // Kahverengi
            default: return 0x4caf50          // Yeşil (bonus)
        }
    }
    
    setupInteraction() {
        this.setInteractive(new Phaser.Geom.Rectangle(-30, -42, 60, 84), Phaser.Geom.Rectangle.Contains)
        
        // Hover efektleri
        this.on('pointerover', () => {
            if (!this.isDragging) {
                this.setScale(1.05)
                this.setDepth(10)
            }
        })
        
        this.on('pointerout', () => {
            if (!this.isDragging && !this.isSelected) {
                this.setScale(1)
                this.setDepth(0)
            }
        })
        
        // Tıklama ve sürükleme
        this.on('pointerdown', (pointer) => {
            this.handlePointerDown(pointer)
        })
        
        this.scene.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                this.handleDrag(pointer)
            }
        })
        
        this.scene.input.on('pointerup', (pointer) => {
            if (this.isDragging) {
                this.handleDragEnd(pointer)
            }
        })
    }
    
    handlePointerDown(pointer) {
        if (!this.card.isPlayable()) return // Stone kartlar oynanamaz
        
        this.isDragging = true
        this.setDepth(100)
        this.setScale(1.1)
        
        // Tıklama pozisyonunu kaydet
        this.dragStartX = pointer.x
        this.dragStartY = pointer.y
        this.cardStartX = this.x
        this.cardStartY = this.y
    }
    
    handleDrag(pointer) {
        if (!this.isDragging) return
        
        // Kartı fare pozisyonuna taşı
        const deltaX = pointer.x - this.dragStartX
        const deltaY = pointer.y - this.dragStartY
        
        this.x = this.cardStartX + deltaX
        this.y = this.cardStartY + deltaY
    }
    
    handleDragEnd(pointer) {
        if (!this.isDragging) return
        
        this.isDragging = false
        
        // Oynama alanına bırakıldı mı kontrol et
        const playArea = this.scene.getPlayArea()
        if (this.isInPlayArea(pointer.x, pointer.y, playArea)) {
            // Kart oynandı - event gönder
            this.scene.events.emit('cardPlayed', this.card, this)
        } else {
            // Kartı eski pozisyonuna geri döndür
            this.returnToOriginalPosition()
        }
    }
    
    isInPlayArea(x, y, playArea) {
        return x >= playArea.x && x <= playArea.x + playArea.width &&
               y >= playArea.y && y <= playArea.y + playArea.height
    }
    
    returnToOriginalPosition() {
        // Smooth animasyon ile eski pozisyona dön
        this.scene.tweens.add({
            targets: this,
            x: this.originalX,
            y: this.originalY,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.setDepth(0)
            }
        })
    }
    
    // Kartı seç/seçimi kaldır
    setSelected(selected) {
        this.isSelected = selected
        this.selectionGlow.setAlpha(selected ? 0.6 : 0)
        this.selectionGlow.setStrokeStyle(3, 0xffff00, selected ? 1 : 0)
        
        if (selected) {
            this.setScale(1.05)
            this.setDepth(10)
        } else if (!this.isDragging) {
            this.setScale(1)
            this.setDepth(0)
        }
    }
    
    // Kartı oynanabilir pozisyona taşı
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
    
    // Kartı yok et (animasyonlu)
    destroyCard() {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.1,
            rotation: Math.PI,
            duration: 400,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.destroy()
            }
        })
    }
    
    // Kart bilgilerini güncelle (enhancement değiştiğinde)
    updateVisuals() {
        // Enhancement görselini yeniden oluştur
        if (this.enhancementDot) {
            this.enhancementDot.destroy()
            this.enhancementDot = null
        }
        if (this.enhancementLabel) {
            this.enhancementLabel.destroy()
            this.enhancementLabel = null
        }
        
        this.createEnhancementVisual()
        
        // Renkleri güncelle
        this.valueDisplay.setColor(this.getCardTextColor())
        this.suitDisplay.setColor(this.getCardTextColor())
        this.centerSymbol.setColor(this.getCardTextColor())
    }
}

// Kart sprite fabrikası
export function createCardSprite(scene, x, y, card) {
    return new CardSprite(scene, x, y, card)
}