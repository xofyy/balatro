import TarotCard from '../utils/TarotCard.js'
import PlanetCard from '../utils/PlanetCard.js'
import { createRandomJoker } from '../utils/Joker.js'
import { getAudioManager } from '../utils/AudioManager.js'

export default class PackOpenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PackOpenScene' })
        
        this.packType = ''
        this.gameScene = null
        this.shopScene = null
        this.revealedCards = []
        this.currentRevealIndex = 0
    }
    
    init(data) {
        this.packType = data.packType
        this.gameScene = data.gameScene
        this.shopScene = data.shopScene
    }
    
    create() {
        // Arka plan rengi
        this.cameras.main.setBackgroundColor('#0f0f23')
        
        // Başlık
        this.add.text(480, 50, `📦 ${this.packType.toUpperCase()} AÇILIYOR...`, {
            fontSize: '28px',
            fill: '#ffd700',
            fontFamily: 'monospace',
            fontWeight: 'bold'
        }).setOrigin(0.5)
        
        // Açıklama
        this.add.text(480, 90, 'Kartları görmek için tıklayın', {
            fontSize: '18px',
            fill: '#ccc',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        
        // Paket içeriğini oluştur
        this.generatePackContents()
        
        // Kart gösterim alanı
        this.createCardDisplay()
        
        // Kontrol butonları
        this.createControls()
    }
    
    generatePackContents() {
        this.revealedCards = []
        
        switch (this.packType) {
            case 'arcana_pack':
                // 4 tarot kartı
                for (let i = 0; i < 4; i++) {
                    this.revealedCards.push({
                        type: 'tarot',
                        data: TarotCard.createRandomTarot()
                    })
                }
                break
                
            case 'celestial_pack':
                // 4 planet kartı
                for (let i = 0; i < 4; i++) {
                    this.revealedCards.push({
                        type: 'planet',
                        data: PlanetCard.createRandomPlanet()
                    })
                }
                break
                
            case 'standard_pack':
                // 2 joker, 1 tarot, 1 planet
                for (let i = 0; i < 2; i++) {
                    this.revealedCards.push({
                        type: 'joker',
                        data: createRandomJoker()
                    })
                }
                this.revealedCards.push({
                    type: 'tarot',
                    data: TarotCard.createRandomTarot()
                })
                this.revealedCards.push({
                    type: 'planet',
                    data: PlanetCard.createRandomPlanet()
                })
                break
        }
    }
    
    createCardDisplay() {
        const startX = 200
        const startY = 200
        const cardSpacing = 140
        
        this.cardContainers = []
        
        this.revealedCards.forEach((cardData, index) => {
            const x = startX + (index * cardSpacing)
            const y = startY
            
            // Kart konteyneri
            const cardContainer = this.add.container(x, y)
            
            // Kapalı kart (başlangıçta)
            const backCard = this.add.rectangle(0, 0, 100, 140, 0x333333)
                .setStrokeStyle(3, 0x666666)
            cardContainer.add(backCard)
            
            const backIcon = this.add.text(0, 0, '❓', {
                fontSize: '48px',
                fontFamily: 'monospace'
            }).setOrigin(0.5)
            cardContainer.add(backIcon)
            
            // Tıklama alanı
            backCard.setInteractive()
            backCard.on('pointerdown', () => {
                this.revealCard(index)
            })
            
            // Hover efekti
            backCard.on('pointerover', () => {
                cardContainer.setScale(1.05)
            })
            
            backCard.on('pointerout', () => {
                cardContainer.setScale(1.0)
            })
            
            this.cardContainers.push({
                container: cardContainer,
                backCard: backCard,
                backIcon: backIcon,
                revealed: false,
                cardData: cardData
            })
        })
    }
    
    revealCard(index) {
        const cardContainer = this.cardContainers[index]
        
        if (cardContainer.revealed) return
        
        cardContainer.revealed = true
        
        // Kart açma ses efekti
        const audioManager = getAudioManager()
        if (audioManager) {
            audioManager.playSFX('cardFlip')
            // Hafif gecikme ile magic ses efekti
            setTimeout(() => {
                audioManager.playSFX('magic')
            }, 200)
        }
        
        // Geri kartı gizle
        cardContainer.backCard.setVisible(false)
        cardContainer.backIcon.setVisible(false)
        
        // Gerçek kartı göster
        this.displayRevealedCard(cardContainer.container, cardContainer.cardData)
        
        console.log(`🎊 Kart açıldı: ${cardContainer.cardData.data.name}`)
        
        // Tüm kartlar açıldı mı kontrol et
        if (this.cardContainers.every(c => c.revealed)) {
            this.allCardsRevealed()
        }
    }
    
    displayRevealedCard(container, cardData) {
        const { type, data } = cardData
        
        // Kart çerçevesi
        const cardFrame = this.add.rectangle(0, 0, 100, 140, this.getCardColor(type))
            .setStrokeStyle(3, this.getBorderColor(type))
        container.add(cardFrame)
        
        // Tip ikonu
        const typeIcon = this.getTypeIcon(type)
        const iconText = this.add.text(0, -40, typeIcon, {
            fontSize: '32px',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        container.add(iconText)
        
        // İsim
        const nameText = this.add.text(0, 0, data.name, {
            fontSize: '12px',
            fill: '#fff',
            fontFamily: 'monospace',
            align: 'center',
            wordWrap: { width: 90 }
        }).setOrigin(0.5)
        container.add(nameText)
        
        // Açıklama
        const descText = this.add.text(0, 40, data.description, {
            fontSize: '9px',
            fill: '#ccc',
            fontFamily: 'monospace',
            align: 'center',
            wordWrap: { width: 90 }
        }).setOrigin(0.5)
        container.add(descText)
        
        // Parıltı efekti
        this.createSparkleEffect(container)
    }
    
    getCardColor(type) {
        const colors = {
            'joker': 0x4caf50,
            'tarot': 0x9c27b0,
            'planet': 0x2196f3
        }
        return colors[type] || 0x666666
    }
    
    getBorderColor(type) {
        const colors = {
            'joker': 0x8bc34a,
            'tarot': 0xba68c8,
            'planet': 0x64b5f6
        }
        return colors[type] || 0x999999
    }
    
    getTypeIcon(type) {
        const icons = {
            'joker': '🃏',
            'tarot': '🔮',
            'planet': '🪐'
        }
        return icons[type] || '❓'
    }
    
    createSparkleEffect(container) {
        // Basit parıltı efekti
        const sparkle1 = this.add.text(-30, -30, '✨', {
            fontSize: '16px',
            fontFamily: 'monospace'
        })
        const sparkle2 = this.add.text(30, -30, '✨', {
            fontSize: '16px',
            fontFamily: 'monospace'
        })
        
        container.add(sparkle1)
        container.add(sparkle2)
        
        // Parıltı animasyonu
        this.tweens.add({
            targets: [sparkle1, sparkle2],
            alpha: 0,
            duration: 1500,
            yoyo: true,
            repeat: 2
        })
    }
    
    allCardsRevealed() {
        // Tüm kartlar açıldığında toplama butonu göster
        this.time.delayedCall(1000, () => {
            this.collectButton = this.add.text(480, 400, '[ KARTLARI TOPLA ]', {
                fontSize: '20px',
                fill: '#4caf50',
                fontFamily: 'monospace',
                backgroundColor: '#333',
                padding: { x: 15, y: 8 }
            }).setOrigin(0.5).setInteractive()
            
            this.collectButton.on('pointerdown', () => {
                this.collectCards()
            })
        })
    }
    
    collectCards() {
        // Kartları toplama ses efekti
        const audioManager = getAudioManager()
        if (audioManager) {
            audioManager.playSFX('success')
        }
        
        // Kartları oyuncuya ver
        this.revealedCards.forEach(cardData => {
            this.giveCardToPlayer(cardData)
        })
        
        console.log(`📦 ${this.revealedCards.length} kart toplandı!`)
        
        // Dükkan sahnesine geri dön
        this.scene.start('ShopScene', {
            money: this.gameScene.money,
            gameScene: this.gameScene
        })
    }
    
    giveCardToPlayer(cardData) {
        const { type, data } = cardData
        
        switch (type) {
            case 'joker':
                // Joker'ı oyuncuya ekle
                if (this.gameScene.jokers.length < 5) {
                    this.gameScene.jokers.push(data)
                    console.log(`🃏 ${data.name} jokerlere eklendi`)
                } else {
                    console.log(`⚠️ Joker alanı dolu, ${data.name} kayboldu`)
                }
                break
                
            case 'tarot':
                // Tarot kartını envantere ekle
                this.gameScene.addTarotToInventory(data)
                break
                
            case 'planet':
                // Planet kartını otomatik kullan
                data.use(this.gameScene)
                console.log(`🪐 ${data.name} otomatik kullanıldı`)
                break
        }
    }
    
    createControls() {
        // Atla butonu (tüm kartları hemen aç)
        this.skipButton = this.add.text(100, 450, '[ HEPSINI AÇ ]', {
            fontSize: '16px',
            fill: '#ff9800',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive()
        
        this.skipButton.on('pointerdown', () => {
            this.revealAllCards()
        })
        
        // Geri dön butonu
        this.backButton = this.add.text(860, 450, '[ GERI DÖN ]', {
            fontSize: '16px',
            fill: '#f44336',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive()
        
        this.backButton.on('pointerdown', () => {
            this.scene.start('ShopScene', {
                money: this.gameScene.money,
                gameScene: this.gameScene
            })
        })
    }
    
    revealAllCards() {
        this.cardContainers.forEach((cardContainer, index) => {
            if (!cardContainer.revealed) {
                this.time.delayedCall(index * 200, () => {
                    this.revealCard(index)
                })
            }
        })
    }
}