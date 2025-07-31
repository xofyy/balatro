// Tarot kartları - tek kullanımlık geliştirme kartları

export class TarotCard {
    constructor(id, name, description, effect) {
        this.id = id
        this.name = name
        this.description = description
        this.effect = effect  // Fonksiyon olarak tanımlanacak
        this.rarity = 'uncommon'
        this.price = 8
    }
    
    // Tarot kartını kullan
    use(gameScene, targetCard = null) {
        if (this.effect && typeof this.effect === 'function') {
            console.log(`🔮 ${this.name} kullanıldı`)
            return this.effect(gameScene, targetCard)
        }
        return false
    }
    
    // Tüm tarot kartı tipleri
    static TAROT_TYPES = {
        'fool': {
            name: 'The Fool',
            description: 'Seçilen kartın türünü rastgele değiştirir',
            effect: (gameScene, targetCard) => {
                if (!targetCard) {
                    console.log('⚠️ The Fool için kart seçimi gerekli')
                    return false
                }
                
                const suits = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS']
                const newSuit = suits[Math.floor(Math.random() * suits.length)]
                const oldSuit = targetCard.suit
                
                targetCard.suit = newSuit
                console.log(`🃏 ${oldSuit} → ${newSuit}`)
                return true
            }
        },
        
        'magician': {
            name: 'The Magician',
            description: 'Seçilen kartın değerini bir üst değere yükseltir',
            effect: (gameScene, targetCard) => {
                if (!targetCard) {
                    console.log('⚠️ The Magician için kart seçimi gerekli')
                    return false
                }
                
                const valueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'JACK', 'QUEEN', 'KING', 'ACE']
                const currentIndex = valueOrder.indexOf(targetCard.value)
                
                if (currentIndex >= 0 && currentIndex < valueOrder.length - 1) {
                    const oldValue = targetCard.value
                    targetCard.value = valueOrder[currentIndex + 1]
                    console.log(`✨ ${oldValue} → ${targetCard.value}`)
                    return true
                } else if (currentIndex === valueOrder.length - 1) {
                    // ACE -> 2 (döngüsel)
                    targetCard.value = '2'
                    console.log(`✨ ACE → 2`)
                    return true
                }
                
                return false
            }
        },
        
        'hermit': {
            name: 'The Hermit',
            description: 'Seçilen kartı desteden kalıcı olarak kaldırır',
            effect: (gameScene, targetCard) => {
                if (!targetCard) {
                    console.log('⚠️ The Hermit için kart seçimi gerekli')
                    return false
                }
                
                // Kartı desteden kaldır
                const cardIndex = gameScene.deck.findIndex(c => 
                    c.suit === targetCard.suit && c.value === targetCard.value
                )
                
                if (cardIndex >= 0) {
                    gameScene.deck.splice(cardIndex, 1)
                    console.log(`🗑️ ${targetCard.toString()} desteden kaldırıldı`)
                    return true
                }
                
                return false
            }
        },
        
        'strength': {
            name: 'The Strength',
            description: 'Seçilen kartı Steel enhancement ile güçlendirir',
            effect: (gameScene, targetCard) => {
                if (!targetCard) {
                    console.log('⚠️ The Strength için kart seçimi gerekli')
                    return false
                }
                
                // Steel enhancement ekle (eğer yoksa)
                if (!targetCard.enhancements.includes('STEEL')) {
                    targetCard.enhancements.push('STEEL')
                    console.log(`🔗 ${targetCard.toString()} Steel ile güçlendirildi`)
                    return true
                }
                
                console.log('⚠️ Bu kart zaten Steel enhancement\'a sahip')
                return false
            }
        },
        
        'wheel': {
            name: 'The Wheel of Fortune',
            description: 'Rastgele bir joker efektini tetikler',
            effect: (gameScene, targetCard) => {
                if (gameScene.jokers.length === 0) {
                    console.log('⚠️ Hiç joker yok')
                    return false
                }
                
                // Rastgele bir joker seç
                const randomJoker = gameScene.jokers[Math.floor(Math.random() * gameScene.jokers.length)]
                
                console.log(`🎰 The Wheel of Fortune: ${randomJoker.name} efekti tetiklendi`)
                
                // Joker'ın istatistiklerini güncelle
                if (!randomJoker.stats) {
                    randomJoker.stats = {}
                }
                randomJoker.stats.wheelActivations = (randomJoker.stats.wheelActivations || 0) + 1
                
                return true
            }
        },
        
        'emperor': {
            name: 'The Emperor',
            description: 'Tüm kartlara +1 çip bonusu ekler',
            effect: (gameScene, targetCard) => {
                let enhancedCount = 0
                
                gameScene.deck.forEach(card => {
                    if (!card.enhancements.includes('BONUS_CHIP_1')) {
                        card.enhancements.push('BONUS_CHIP_1')
                        enhancedCount++
                    }
                })
                
                console.log(`👑 The Emperor: ${enhancedCount} kart +1 çip bonusu aldı`)
                return enhancedCount > 0
            }
        }
    }
    
    // Tarot kartı oluştur
    static createTarot(tarotId) {
        const tarotData = this.TAROT_TYPES[tarotId]
        if (!tarotData) {
            console.error(`Bilinmeyen tarot kartı: ${tarotId}`)
            return null
        }
        
        return new TarotCard(tarotId, tarotData.name, tarotData.description, tarotData.effect)
    }
    
    // Rastgele tarot kartı oluştur
    static createRandomTarot() {
        const tarotIds = Object.keys(this.TAROT_TYPES)
        const randomId = tarotIds[Math.floor(Math.random() * tarotIds.length)]
        return this.createTarot(randomId)
    }
}

// Tarot kartı sprite'ı
export class TarotSprite extends Phaser.GameObjects.Container {
    constructor(scene, x, y, tarotCard) {
        super(scene, x, y)
        
        this.tarotCard = tarotCard
        this.isUsed = false
        
        this.createSprite()
        this.setupInteraction()
    }
    
    createSprite() {
        // Kart çerçevesi (mor/mistik tema)
        this.cardFrame = this.scene.add.rectangle(0, 0, 60, 80, 0x4a148c)
            .setStrokeStyle(2, 0x7b1fa2)
        this.add(this.cardFrame)
        
        // Tarot ikonu
        this.iconText = this.scene.add.text(0, -20, '🔮', {
            fontSize: '24px',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        this.add(this.iconText)
        
        // İsim (kısaltılmış)
        const shortName = this.tarotCard.name.replace('The ', '')
        this.nameText = this.scene.add.text(0, 10, shortName, {
            fontSize: '10px',
            fill: '#fff',
            fontFamily: 'monospace',
            align: 'center',
            wordWrap: { width: 55 }
        }).setOrigin(0.5)
        this.add(this.nameText)
        
        // Kullanım durumu göstergesi
        this.usedIndicator = this.scene.add.text(0, 35, '', {
            fontSize: '12px',
            fill: '#f44336',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        this.add(this.usedIndicator)
    }
    
    setupInteraction() {
        this.setSize(60, 80)
        this.setInteractive()
        
        // Hover efekti
        this.on('pointerover', () => {
            if (!this.isUsed) {
                this.setScale(1.1)
                this.showTooltip()
            }
        })
        
        this.on('pointerout', () => {
            this.setScale(1.0)
            this.hideTooltip()
        })
        
        // Tıklama ile kullan
        this.on('pointerdown', () => {
            if (!this.isUsed) {
                this.useTarot()
            }
        })
    }
    
    useTarot() {
        // TODO: Kart seçimi arayüzü eklenecek
        const success = this.tarotCard.use(this.scene, null)
        
        if (success) {
            this.markAsUsed()
        }
    }
    
    markAsUsed() {
        this.isUsed = true
        this.setAlpha(0.5)
        this.usedIndicator.setText('USED')
        console.log(`🔮 ${this.tarotCard.name} kullanıldı`)
    }
    
    showTooltip() {
        // Tooltip göster
        this.tooltip = this.scene.add.text(this.x + 40, this.y - 40, this.tarotCard.description, {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 8, y: 4 },
            fontFamily: 'monospace',
            wordWrap: { width: 200 }
        })
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy()
            this.tooltip = null
        }
    }
    
    destroy() {
        this.hideTooltip()
        super.destroy()
    }
}

export default TarotCard