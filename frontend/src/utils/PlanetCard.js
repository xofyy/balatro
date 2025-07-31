// Planet kartları - poker ellerini kalıcı olarak güçlendiren kartlar

export class PlanetCard {
    constructor(id, name, description, handType, bonusType, bonusAmount) {
        this.id = id
        this.name = name
        this.description = description
        this.handType = handType      // Hangi poker elini etkiler
        this.bonusType = bonusType    // 'chips' veya 'multiplier'
        this.bonusAmount = bonusAmount // Bonus miktarı
        this.rarity = 'rare'
        this.price = 12
    }
    
    // Planet kartını kullan
    use(gameScene) {
        if (!gameScene.planetLevels) {
            gameScene.planetLevels = {}
        }
        
        // Mevcut seviyeyi al
        const currentLevel = gameScene.planetLevels[this.handType] || 0
        gameScene.planetLevels[this.handType] = currentLevel + 1
        
        console.log(`🪐 ${this.name}: ${this.handType} seviye ${currentLevel + 1}'e yükseltildi`)
        console.log(`   Bonus: +${this.bonusAmount} ${this.bonusType}`)
        
        return true
    }
    
    // Poker eli için planet bonuslarını hesapla
    static calculatePlanetBonus(gameScene, handType) {
        if (!gameScene.planetLevels || !gameScene.planetLevels[handType]) {
            return { chips: 0, multiplier: 0 }
        }
        
        const level = gameScene.planetLevels[handType]
        const planetData = Object.values(this.PLANET_TYPES).find(p => p.handType === handType)
        
        if (!planetData) {
            return { chips: 0, multiplier: 0 }
        }
        
        const bonus = { chips: 0, multiplier: 0 }
        bonus[planetData.bonusType] = planetData.bonusAmount * level
        
        return bonus
    }
    
    // Tüm planet kartı tipleri
    static PLANET_TYPES = {
        'mercury': {
            name: 'Mercury',
            description: 'Pair elinin çipini +15 artırır',
            handType: 'Pair',
            bonusType: 'chips',
            bonusAmount: 15
        },
        
        'venus': {
            name: 'Venus',
            description: 'Two Pair elinin çarpanını +1 artırır',
            handType: 'Two Pair',
            bonusType: 'multiplier',
            bonusAmount: 1
        },
        
        'earth': {
            name: 'Earth',
            description: 'Three of a Kind elinin çipini +20 artırır',
            handType: 'Three of a Kind',
            bonusType: 'chips',
            bonusAmount: 20
        },
        
        'mars': {
            name: 'Mars',
            description: 'Four of a Kind elinin çipini +25 artırır',
            handType: 'Four of a Kind',
            bonusType: 'chips',
            bonusAmount: 25
        },
        
        'jupiter': {
            name: 'Jupiter',
            description: 'Flush elinin çarpanını +2 artırır',
            handType: 'Flush',
            bonusType: 'multiplier',
            bonusAmount: 2
        },
        
        'saturn': {
            name: 'Saturn',
            description: 'Straight elinin çipini +30 artırır',
            handType: 'Straight',
            bonusType: 'chips',
            bonusAmount: 30
        },
        
        'uranus': {
            name: 'Uranus',
            description: 'Full House elinin çarpanını +2 artırır',
            handType: 'Full House',
            bonusType: 'multiplier',
            bonusAmount: 2
        },
        
        'neptune': {
            name: 'Neptune',
            description: 'Straight Flush elinin çipini +40 artırır',
            handType: 'Straight Flush',
            bonusType: 'chips',
            bonusAmount: 40
        },
        
        'pluto': {
            name: 'Pluto',
            description: 'Royal Flush elinin çarpanını +3 artırır',
            handType: 'Royal Flush',
            bonusType: 'multiplier',
            bonusAmount: 3
        },
        
        'sun': {
            name: 'The Sun',
            description: 'High Card elinin çipini +10 artırır',
            handType: 'High Card',
            bonusType: 'chips',
            bonusAmount: 10
        }
    }
    
    // Planet kartı oluştur
    static createPlanet(planetId) {
        const planetData = this.PLANET_TYPES[planetId]
        if (!planetData) {
            console.error(`Bilinmeyen planet kartı: ${planetId}`)
            return null
        }
        
        return new PlanetCard(
            planetId,
            planetData.name,
            planetData.description,
            planetData.handType,
            planetData.bonusType,
            planetData.bonusAmount
        )
    }
    
    // Rastgele planet kartı oluştur
    static createRandomPlanet() {
        const planetIds = Object.keys(this.PLANET_TYPES)
        const randomId = planetIds[Math.floor(Math.random() * planetIds.length)]
        return this.createPlanet(randomId)
    }
    
    // Mevcut planet seviyelerini göster
    static getPlanetLevelsDisplay(gameScene) {
        if (!gameScene.planetLevels) {
            return 'Hiçbir gezegen kartı kullanılmadı'
        }
        
        const levels = []
        for (const [handType, level] of Object.entries(gameScene.planetLevels)) {
            if (level > 0) {
                levels.push(`${handType}: Lv.${level}`)
            }
        }
        
        return levels.length > 0 ? levels.join('\n') : 'Hiçbir gezegen kartı kullanılmadı'
    }
}

// Planet kartı sprite'ı
export class PlanetSprite extends Phaser.GameObjects.Container {
    constructor(scene, x, y, planetCard) {
        super(scene, x, y)
        
        this.planetCard = planetCard
        this.isUsed = false
        
        this.createSprite()
        this.setupInteraction()
    }
    
    createSprite() {
        // Kart çerçevesi (mavi/uzay teması)
        this.cardFrame = this.scene.add.rectangle(0, 0, 60, 80, 0x1565c0)
            .setStrokeStyle(2, 0x42a5f5)
        this.add(this.cardFrame)
        
        // Planet ikonu
        this.iconText = this.scene.add.text(0, -20, '🪐', {
            fontSize: '24px',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        this.add(this.iconText)
        
        // İsim
        this.nameText = this.scene.add.text(0, 5, this.planetCard.name, {
            fontSize: '9px',
            fill: '#fff',
            fontFamily: 'monospace',
            align: 'center',
            wordWrap: { width: 55 }
        }).setOrigin(0.5)
        this.add(this.nameText)
        
        // El tipi
        this.handText = this.scene.add.text(0, 20, this.planetCard.handType, {
            fontSize: '8px',
            fill: '#81c784',
            fontFamily: 'monospace',
            align: 'center',
            wordWrap: { width: 55 }
        }).setOrigin(0.5)
        this.add(this.handText)
        
        // Bonus
        const bonusIcon = this.planetCard.bonusType === 'chips' ? '💎' : '✖️'
        this.bonusText = this.scene.add.text(0, 35, `${bonusIcon}+${this.planetCard.bonusAmount}`, {
            fontSize: '10px',
            fill: '#ffd700',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        this.add(this.bonusText)
        
        // Kullanım durumu göstergesi
        this.usedIndicator = this.scene.add.text(0, 35, '', {
            fontSize: '12px',
            fill: '#4caf50',
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
                this.usePlanet()
            }
        })
    }
    
    usePlanet() {
        const success = this.planetCard.use(this.scene)
        
        if (success) {
            this.markAsUsed()
        }
    }
    
    markAsUsed() {
        this.isUsed = true
        this.bonusText.setVisible(false)
        this.usedIndicator.setText('USED')
        console.log(`🪐 ${this.planetCard.name} kullanıldı`)
        
        // 2 saniye sonra sprite'ı kaldır
        this.scene.time.delayedCall(2000, () => {
            this.destroy()
        })
    }
    
    showTooltip() {
        // Tooltip göster
        this.tooltip = this.scene.add.text(this.x + 40, this.y - 40, this.planetCard.description, {
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

export default PlanetCard