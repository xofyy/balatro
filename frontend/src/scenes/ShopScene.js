import { createRandomJoker } from '../utils/Joker.js'
import TarotCard from '../utils/TarotCard.js'
import PlanetCard from '../utils/PlanetCard.js'
import { getAudioManager } from '../utils/AudioManager.js'

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' })
        
        // Dükkan durumu
        this.playerMoney = 0
        this.gameScene = null  // GameScene referansı
        
        // Dükkan öğeleri
        this.shopItems = []
        this.refreshCost = 2  // Dükkanı yenileme maliyeti
        this.refreshCount = 0  // Kaç kez yenilendiğini sayar
        
        // UI elemanları
        this.moneyText = null
        this.titleText = null
        this.backButton = null
        this.refreshButton = null
    }
    
    init(data) {
        // GameScene'den veri al
        this.playerMoney = data.money || 0
        this.gameScene = data.gameScene
    }
    
    create() {
        // Dükkan açılma ses efekti
        const audioManager = getAudioManager()
        if (audioManager) {
            audioManager.playSFX('shopOpen')
        }
        
        // Arka plan rengi
        this.cameras.main.setBackgroundColor('#2c1810')
        
        // Başlık
        this.titleText = this.add.text(480, 40, '🛒 DÜKKAN', {
            fontSize: '36px',
            fill: '#ffd700',
            fontFamily: 'monospace',
            fontWeight: 'bold'
        }).setOrigin(0.5)
        
        // Para göstergesi
        this.moneyText = this.add.text(480, 80, `Para: $${this.playerMoney}`, {
            fontSize: '24px',
            fill: '#4caf50',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        
        // Dükkan öğelerini oluştur
        this.generateShopItems()
        this.displayShopItems()
        
        // Kontrol butonları
        this.createControlButtons()
    }
    
    generateShopItems() {
        this.shopItems = []
        
        // 5 rastgele dükkan öğesi oluştur
        for (let i = 0; i < 5; i++) {
            const itemType = this.getRandomItemType()
            const item = this.createShopItem(itemType, i)
            this.shopItems.push(item)
        }
    }
    
    getRandomItemType() {
        const itemTypes = [
            { type: 'joker', weight: 40 },
            { type: 'pack', weight: 30 },
            { type: 'tarot', weight: 15 },
            { type: 'planet', weight: 15 }
        ]
        
        // Ağırlıklı rastgele seçim
        const totalWeight = itemTypes.reduce((sum, item) => sum + item.weight, 0)
        let random = Math.random() * totalWeight
        
        for (const itemType of itemTypes) {
            random -= itemType.weight
            if (random <= 0) {
                return itemType.type
            }
        }
        
        return 'joker' // Fallback
    }
    
    createShopItem(type, index) {
        const basePrice = 5
        
        switch (type) {
            case 'joker':
                const joker = createRandomJoker()
                
                return {
                    type: 'joker',
                    id: joker.id,
                    name: joker.name,
                    description: joker.description,
                    price: basePrice + Math.floor(Math.random() * 10),
                    rarity: joker.rarity,
                    data: joker
                }
                
            case 'pack':
                const packTypes = ['Arcana Pack', 'Celestial Pack', 'Standard Pack']
                const packType = packTypes[Math.floor(Math.random() * packTypes.length)]
                
                return {
                    type: 'pack',
                    id: packType.toLowerCase().replace(' ', '_'),
                    name: packType,
                    description: this.getPackDescription(packType),
                    price: basePrice + 5,
                    rarity: 'common'
                }
                
            case 'tarot':
                const tarotCard = TarotCard.createRandomTarot()
                
                return {
                    type: 'tarot',
                    id: tarotCard.id,
                    name: tarotCard.name,
                    description: tarotCard.description,
                    price: basePrice + 3,
                    rarity: 'uncommon',
                    data: tarotCard
                }
                
            case 'planet':
                const planetCard = PlanetCard.createRandomPlanet()
                
                return {
                    type: 'planet',
                    id: planetCard.id,
                    name: planetCard.name,
                    description: planetCard.description,
                    price: basePrice + 8,
                    rarity: 'rare',
                    data: planetCard
                }
                
            default:
                return null
        }
    }
    
    getPackDescription(packType) {
        const descriptions = {
            'Arcana Pack': '4 Tarot kartı içerir',
            'Celestial Pack': '4 Gezegen kartı içerir', 
            'Standard Pack': '4 rastgele kart içerir'
        }
        return descriptions[packType] || 'Gizemli paket'
    }
    
    getTarotDescription(tarotCard) {
        const descriptions = {
            'The Fool': 'Seçilen kartın türünü değiştirir',
            'The Magician': 'Seçilen kartın değerini yükseltir',
            'The Hermit': 'Seçilen kartı desteden kaldırır',
            'The Strength': 'Seçilen kartı Steel ile güçlendirir',
            'The Wheel': 'Rastgele joker etkisi tetikler'
        }
        return descriptions[tarotCard] || 'Gizemli tarot kartı'
    }
    
    getPlanetDescription(planet) {
        const descriptions = {
            'Jupiter': 'Flush elinin çarpanını +1 artırır',
            'Mars': 'Four of a Kind elinin çipini +20 artırır',
            'Neptune': 'Straight elinin çarpanını +0.5 artırır',
            'Saturn': 'Pair elinin çarpanını +1 artırır',
            'Venus': 'Flush elinin çipini +15 artırır'
        }
        return descriptions[planet] || 'Gizemli gezegen kartı'
    }
    
    displayShopItems() {
        const startX = 100
        const startY = 150
        const itemWidth = 150
        const itemHeight = 200
        
        this.shopItems.forEach((item, index) => {
            if (!item) return
            
            const x = startX + (index * (itemWidth + 20))
            const y = startY
            
            // Öğe çerçevesi
            const frame = this.add.rectangle(x, y, itemWidth, itemHeight, 0x444444)
                .setStrokeStyle(2, this.getRarityColor(item.rarity))
            
            // Tip ikonu
            const typeIcon = this.getTypeIcon(item.type)
            const iconText = this.add.text(x, y - 70, typeIcon, {
                fontSize: '32px',
                fill: '#fff',
                fontFamily: 'monospace'
            }).setOrigin(0.5)
            
            // İsim
            const nameText = this.add.text(x, y - 30, item.name, {
                fontSize: '14px',
                fill: '#fff',
                fontFamily: 'monospace',
                align: 'center',
                wordWrap: { width: itemWidth - 20 }
            }).setOrigin(0.5)
            
            // Açıklama
            const descText = this.add.text(x, y + 10, item.description, {
                fontSize: '11px',
                fill: '#ccc',
                fontFamily: 'monospace',
                align: 'center',
                wordWrap: { width: itemWidth - 20 }
            }).setOrigin(0.5)
            
            // Fiyat
            const priceText = this.add.text(x, y + 60, `$${item.price}`, {
                fontSize: '18px',
                fill: '#ffd700',
                fontFamily: 'monospace',
                fontWeight: 'bold'
            }).setOrigin(0.5)
            
            // Satın alma butonu
            const buyButton = this.add.text(x, y + 85, '[ SATIN AL ]', {
                fontSize: '12px',
                fill: this.playerMoney >= item.price ? '#4caf50' : '#f44336',
                fontFamily: 'monospace',
                backgroundColor: '#333',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5).setInteractive()
            
            buyButton.on('pointerdown', () => {
                // Buton tıklama ses efekti
                const audioManager = getAudioManager()
                if (audioManager) {
                    audioManager.playSFX('buttonClick')
                }
                this.purchaseItem(item, index)
            })
            
            // Hover efekti
            buyButton.on('pointerover', () => {
                // Hover ses efekti
                const audioManager = getAudioManager()
                if (audioManager) {
                    audioManager.playSFX('buttonHover')
                }
                buyButton.setScale(1.1)
            })
            
            buyButton.on('pointerout', () => {
                buyButton.setScale(1.0)
            })
        })
    }
    
    getRarityColor(rarity) {
        const colors = {
            'common': 0x808080,     // Gri
            'uncommon': 0x4caf50,   // Yeşil
            'rare': 0x2196f3,       // Mavi
            'legendary': 0xff9800   // Turuncu
        }
        return colors[rarity] || colors.common
    }
    
    getTypeIcon(type) {
        const icons = {
            'joker': '🃏',
            'pack': '📦',
            'tarot': '🔮',
            'planet': '🪐'
        }
        return icons[type] || '❓'
    }
    
    purchaseItem(item, index) {
        const audioManager = getAudioManager()
        
        if (this.playerMoney < item.price) {
            // Hata ses efekti
            if (audioManager) {
                audioManager.playErrorSound()
            }
            console.log('Yetersiz para!')
            this.showMessage('Yetersiz para!', '#f44336')
            return
        }
        
        // Satın alma ses efekti
        if (audioManager) {
            if (item.type === 'joker') {
                audioManager.playSFX('jokerBuy')
            } else {
                audioManager.playSFX('moneySpend')
            }
        }
        
        // Parayı düş
        this.playerMoney -= item.price
        this.moneyText.setText(`Para: $${this.playerMoney}`)
        
        // Öğeyi oyuncuya ver
        this.giveItemToPlayer(item)
        
        // Başarı mesajı
        this.showMessage(`${item.name} satın alındı!`, '#4caf50')
        
        // Öğeyi dükkantan kaldır
        this.shopItems[index] = null
        
        // Dükkanı yeniden çiz
        this.clearShopDisplay()
        this.displayShopItems()
        
        console.log(`💰 ${item.name} satın alındı! Kalan para: $${this.playerMoney}`)
    }
    
    giveItemToPlayer(item) {
        if (!this.gameScene) return
        
        switch (item.type) {
            case 'joker':
                // Joker'ı oyuncuya ekle (eğer yer varsa)
                if (this.gameScene.jokers.length < 5) {
                    this.gameScene.jokers.push(item.data)
                    console.log(`🃏 ${item.data.name} jokerlere eklendi`)
                } else {
                    this.showMessage('Joker alanı dolu!', '#f44336')
                    // Parayı geri ver
                    this.playerMoney += item.price
                    this.moneyText.setText(`Para: $${this.playerMoney}`)
                }
                break
                
            case 'pack':
                // Paket açma sahnesine geç
                this.scene.start('PackOpenScene', {
                    packType: item.id,
                    gameScene: this.gameScene,
                    shopScene: this
                })
                return // Fonksiyondan erken çık çünkü sahne değişiyor
                
            case 'tarot':
                // Tarot kartını envantere ekle
                this.gameScene.addTarotToInventory(item.data)
                break
                
            case 'planet':
                // Planet kartını otomatik kullan
                if (item.data && item.data.use) {
                    item.data.use(this.gameScene)
                    console.log(`🪐 ${item.name} kullanıldı!`)
                }
                break
        }
    }
    
    showMessage(text, color = '#fff') {
        const message = this.add.text(480, 400, text, {
            fontSize: '20px',
            fill: color,
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5)
        
        // Mesajı 2 saniye sonra kaldır
        this.time.delayedCall(2000, () => {
            message.destroy()
        })
    }
    
    clearShopDisplay() {
        // Tüm dükkan öğelerini temizle
        this.children.list.forEach(child => {
            if (child.type === 'Text' || child.type === 'Rectangle') {
                if (child !== this.titleText && child !== this.moneyText && 
                    child !== this.backButton && child !== this.refreshButton) {
                    child.destroy()
                }
            }
        })
    }
    
    createControlButtons() {
        // Geri dön butonu
        this.backButton = this.add.text(100, 450, '[ ← OYUNA DÖN ]', {
            fontSize: '18px',
            fill: '#4caf50',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 15, y: 8 }
        }).setInteractive()
        
        this.backButton.on('pointerdown', () => {
            this.returnToGame()
        })
        
        // Dükkanı yenile butonu
        this.refreshButton = this.add.text(860, 450, `[ 🔄 YENİLE $${this.refreshCost} ]`, {
            fontSize: '18px',
            fill: this.playerMoney >= this.refreshCost ? '#2196f3' : '#f44336',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 15, y: 8 }
        }).setInteractive()
        
        this.refreshButton.on('pointerdown', () => {
            this.refreshShop()
        })
    }
    
    refreshShop() {
        if (this.playerMoney < this.refreshCost) {
            this.showMessage('Yenileme için yetersiz para!', '#f44336')
            return
        }
        
        // Parayı düş
        this.playerMoney -= this.refreshCost
        this.moneyText.setText(`Para: $${this.playerMoney}`)
        
        // Yenileme sayısını artır ve maliyeti yükselt
        this.refreshCount++
        this.refreshCost = Math.min(10, 2 + this.refreshCount)
        
        // Dükkanı yenile
        this.clearShopDisplay()
        this.generateShopItems()
        this.displayShopItems()
        this.createControlButtons()
        
        this.showMessage('Dükkan yenilendi!', '#2196f3')
    }
    
    returnToGame() {
        // GameScene'e parayı geri ver
        if (this.gameScene) {
            this.gameScene.money = this.playerMoney
            this.gameScene.updateUI()
            
            // Jokerları güncelle
            this.gameScene.updateJokerDisplay()
        }
        
        // GameScene'e geri dön
        this.scene.start('GameScene')
    }
}