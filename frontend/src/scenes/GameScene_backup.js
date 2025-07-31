import Phaser from 'phaser'
import { createStandardDeck, shuffleDeck, drawCards } from '../utils/Card.js'
import { createCardSprite } from '../utils/CardSprite.js'
import { evaluateHand, formatHandResult } from '../utils/PokerHands.js'
import { createJokerById, createRandomJoker, calculateJokerEffects, TRIGGER_CONDITIONS } from '../utils/Joker.js'
import { createJokerSprite, JokerSprite } from '../utils/JokerSprite.js'
import PlanetCard from '../utils/PlanetCard.js'
import TarotCard from '../utils/TarotCard.js'
import { GameStateAPI, HighscoreAPI, APIUtils, APITest } from '../utils/APIClient.js'
import AudioManager, { setAudioManager } from '../utils/AudioManager.js'
import AssetOptimizer, { setAssetOptimizer } from '../utils/AssetOptimizer.js'
import PerformanceMonitor, { setPerformanceMonitor } from '../utils/PerformanceMonitor.js'
import UILayout from '../utils/UILayout.js'

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' })
        
        // Oyun durumu değişkenleri
        this.currentScore = 0
        this.money = 50
        this.lives = 3
        this.currentBlind = 1
        this.currentAnte = 1  // Ante seviyesi (her 3 blind'da bir artar)
        this.discardsLeft = 3
        
        // Para kazanma sistemi
        this.baseMoneyReward = 3  // Her el için temel para ödülü
        this.blindCompletionBonus = 10  // Blind tamamlama bonusu
        this.handsLeft = 4
        
        // Blind sistemi
        this.blindTarget = this.calculateBlindTarget()  // Mevcut blind hedefi
        this.blindType = this.getBlindType()  // 'small', 'big', 'boss'
        this.blindsCompleted = 0  // Tamamlanan blind sayısı
        
        // Planet kartları sistemi
        this.planetLevels = {}  // Her poker eli için seviyeler
        
        // Tarot kartları envanteri
        this.tarotInventory = []  // Oyuncunun sahip olduğu tarot kartları
        
        // UI elementleri
        this.scoreText = null
        this.moneyText = null
        this.livesText = null
        this.blindText = null
        this.discardsText = null
        this.handsText = null
        
        // Kart sistemi
        this.deck = []
        this.hand = []
        this.handSprites = []
        this.playedCards = []
        this.selectedCards = []
        
        // Oyun alanları
        this.handArea = { x: 200, y: 420, width: 560, height: 100 }
        this.playArea = { x: 300, y: 250, width: 360, height: 120 }
        
        // Puanlama bilgileri
        this.currentHandResult = null
        this.handResultText = null
        
        // Joker sistemi
        this.jokers = []
        this.jokerSprites = []
        this.jokerArea = { x: 50, y: 120, width: 400, height: 120 }
        
        // Backend entegrasyonu
        this.currentUserId = APIUtils.generateUserId()
        this.isAPIConnected = false
        
        // Ses yöneticisi
        this.audioManager = null
        
        // Asset optimizer
        this.assetOptimizer = null
        
        // Performance monitor
        this.performanceMonitor = null
        
        // Modern UI Layout
        this.uiLayout = null
        
        // Envanter element tracking
        this.inventoryElements = []
    }

    preload() {
        // Programatik texture oluşturma kullanacağız - preload boş kalabilir
        console.log('🎨 Placeholder tekstürler oluşturuluyor...')
    }

    create() {
        // Performance monitor'ü başlat
        this.performanceMonitor = new PerformanceMonitor()
        setPerformanceMonitor(this.performanceMonitor)
        this.performanceMonitor.startMonitoring(this)
        
        // Asset optimizer'ı başlat
        this.assetOptimizer = new AssetOptimizer()
        setAssetOptimizer(this.assetOptimizer)
        
        // Ses yöneticisini başlat
        this.audioManager = new AudioManager(this)
        setAudioManager(this.audioManager)
        
        // Oyun müziği başlat
        this.audioManager.playMusic('gameMusic', true)
        
        // Modern UI Layout'u başlat
        this.uiLayout = new UILayout(this)
        
        // Modern arka plan oluştur
        this.createModernBackground()
        
        // Optimized texture'ları oluştur
        this.createOptimizedTextures()
        
        // Modern UI'ı oluştur
        this.createModernUI()
        
        // Kart sistemini başlat
        this.initializeDeck()
        this.dealInitialHand()
        
        // Joker sistemini başlat
        this.initializeJokers()
        
        // API bağlantısını test et
        this.testAPIConnection()
        
        // Oyun kontrolleri
        this.createGameControls()
        
        // Modern audio toggle - sağ üst köşe (single instance - Phase 8 fix)
        const toggleX = this.uiLayout.isMobile ? 900 : 900  
        const toggleY = this.uiLayout.isMobile ? 50 : 50
        this.audioToggle = this.uiLayout.createAudioToggle(toggleX, toggleY, this.audioManager)
        
        // Event listener'ları ayarla
        this.setupEventListeners()
    }
    
    createAreaBorders() {
        // El alanı sınırı (yeşil)
        const handBorder = this.add.rectangle(
            this.handArea.x + this.handArea.width/2, 
            this.handArea.y + this.handArea.height/2,
            this.handArea.width, 
            this.handArea.height, 
            0x000000, 0
        )
        handBorder.setStrokeStyle(2, 0x4caf50, 0.5)
        
        // Oynama alanı sınırı (mavi)
        const playBorder = this.add.rectangle(
            this.playArea.x + this.playArea.width/2,
            this.playArea.y + this.playArea.height/2, 
            this.playArea.width,
            this.playArea.height,
            0x000000, 0
        )
        playBorder.setStrokeStyle(2, 0x2196f3, 0.5)
        
        // Alan etiketleri
        this.add.text(this.handArea.x + 10, this.handArea.y - 25, 'El (Hand)', {
            fontSize: '14px',
            fill: '#4caf50',
            fontFamily: 'monospace'
        })
        
        this.add.text(this.playArea.x + 10, this.playArea.y - 25, 'Oynama Alanı (Play Area)', {
            fontSize: '14px', 
            fill: '#2196f3',
            fontFamily: 'monospace'
        })
        
        // Joker alanı sınırı (mor)
        const jokerBorder = this.add.rectangle(
            this.jokerArea.x + this.jokerArea.width/2,
            this.jokerArea.y + this.jokerArea.height/2,
            this.jokerArea.width,
            this.jokerArea.height,
            0x000000, 0
        )
        jokerBorder.setStrokeStyle(2, 0x9c27b0, 0.5)
        
        this.add.text(this.jokerArea.x + 10, this.jokerArea.y - 25, 'Jokerler (Jokers)', {
            fontSize: '14px',
            fill: '#9c27b0',
            fontFamily: 'monospace'
        })
        
        // Modern game state display
        const displayX = this.uiLayout.isMobile ? 480 : 480
        const displayY = this.uiLayout.isMobile ? 180 : 180
        this.gameStateDisplay = this.uiLayout.createGameStateDisplay(displayX, displayY)
        
        // Backward compatibility için text referansı
        this.handResultText = {
            setText: (text) => {
                const parts = text.split('\n')
                if (parts.length >= 2) {
                    this.gameStateDisplay.updateDisplay(parts[0], parts[1], '', '#ffffff')
                } else {
                    this.gameStateDisplay.updateDisplay(text, '', '', '#ffffff')
                }
            },
            setStyle: (style) => {
                // Style değişiklikleri için renk mapping
                let color = '#ffffff'
                if (style.color === '#ffeb3b') color = '#ffd700'  // Sarı (preview)
                else if (style.color === '#ff9800') color = '#f97316'  // Turuncu (warning)
                else if (style.color === '#4caf50') color = '#22c55e'  // Yeşil (success)
                else if (style.color === '#f44336') color = '#ef4444'  // Kırmızı (error)
                
                // Son güncellemede rengi kullan (placeholder implementation)
                this.lastColor = color
            }
        }
    }
    
    initializeDeck() {
        // Yeni deste oluştur ve karıştır
        this.deck = shuffleDeck(createStandardDeck())
        console.log('Deste oluşturuldu ve karıştırıldı:', this.deck.length, 'kart')
    }
    
    dealInitialHand() {
        // Eldeki kartları temizle
        this.clearHand()
        
        // 8 kart çek
        const drawnCards = drawCards(this.deck, 8)
        this.hand = drawnCards
        
        // Kart sprite'larını oluştur ve hizala
        this.createHandSprites()
        
        console.log('El dağıtıldı:', this.hand.length, 'kart')
        this.hand.forEach(card => console.log(' -', card.toString()))
    }
    
    clearHand() {
        // Mevcut el sprite'larını temizle
        this.handSprites.forEach(sprite => sprite.destroy())
        this.handSprites = []
        this.hand = []
        this.selectedCards = []
    }
    
    createHandSprites() {
        // Modern UI layout kullan - Phase 8 optimized spacing
        const handArea = this.uiLayout.areas.handArea
        const cardSpacing = this.uiLayout.isMobile ? 75 : 95
        
        // Mobile responsive card positioning - Phase 8
        const totalCardsWidth = this.hand.length * cardSpacing
        const availableWidth = handArea.width - 60 // Padding
        
        let startX, finalSpacing
        if (this.uiLayout.isMobile && totalCardsWidth > availableWidth) {
            // Mobile overflow: kompakt spacing
            finalSpacing = Math.max(50, availableWidth / this.hand.length)
            startX = handArea.x + (handArea.width - (this.hand.length * finalSpacing)) / 2
        } else {
            // Normal spacing
            finalSpacing = cardSpacing
            startX = handArea.x + (handArea.width - totalCardsWidth) / 2
        }
        
        const cardY = handArea.y + 80
        const deckX = 50
        const deckY = 200
        
        // Deste görselini göster
        const deckImage = this.add.rectangle(deckX, deckY, 60, 90, 0x4a4a4a)
            .setStrokeStyle(2, 0x888888)
        const deckText = this.add.text(deckX, deckY, '🂠', {
            fontSize: '36px',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        
        this.hand.forEach((card, index) => {
            const cardX = startX + (index * finalSpacing)
            // Modern kart tasarımı kullan
            const modernCard = this.uiLayout.createModernCard(cardX, cardY, card)
            
            // Kart seçimi için interaktif hale getir - hem container hem cardBg
            const cardBg = modernCard.list[1] // İkinci element cardBg (gölge sonrası)
            
            // Container click event
            modernCard.on('pointerdown', () => {
                this.toggleCardSelection(card, cardSprite)
            })
            
            // CardBg click event (backup)
            if (cardBg && cardBg.setInteractive) {
                cardBg.on('pointerdown', () => {
                    this.toggleCardSelection(card, cardSprite)
                })
            }
            
            // Gelişmiş hover efektlerini ekle
            modernCard.on('pointerover', () => {
                if (!cardSprite.selected) {
                    // Hafif büyütme ve glow efekti
                    this.tweens.add({
                        targets: modernCard,
                        scaleX: 1.05,
                        scaleY: 1.05,
                        duration: 150,
                        ease: 'Power2.easeOut'
                    })
                    // Hover ses efekti (placeholder)
                    if (this.audioManager) {
                        this.audioManager.playSFX('cardHover')
                    }
                }
            })
            
            modernCard.on('pointerout', () => {
                if (!cardSprite.selected) {
                    this.tweens.add({
                        targets: modernCard,
                        scaleX: 1.0,
                        scaleY: 1.0,
                        duration: 150,
                        ease: 'Power2.easeOut'
                    })
                }
            })
            
            // Backwards compatibility için sprite objesi oluştur
            const cardSprite = {
                container: modernCard,
                card: card,
                x: cardX,
                y: cardY,
                selected: false,
                setScale: (scale) => modernCard.setScale(scale),
                setRotation: (rotation) => modernCard.setRotation(rotation),
                setAlpha: (alpha) => modernCard.setAlpha(alpha),
                destroy: () => modernCard.destroy(),
                setTint: (color) => {
                    // Modern card'ın tüm child elementlerini tintler
                    modernCard.list.forEach(child => {
                        if (child.setTint) child.setTint(color)
                    })
                },
                clearTint: () => {
                    modernCard.list.forEach(child => {
                        if (child.clearTint) child.clearTint()
                    })
                },
                setSelected: (selected) => {
                    cardSprite.selected = selected
                    if (selected) {
                        modernCard.setScale(1.1)
                        modernCard.y = cardY - 20 // Yukarı kaldır
                        // Modern kart'ın özel selection method'unu kullan
                        if (modernCard.setCardSelected) {
                            modernCard.setCardSelected(true)
                        }
                    } else {
                        modernCard.setScale(1.0)
                        modernCard.y = cardY // Normal pozisyon
                        if (modernCard.setCardSelected) {
                            modernCard.setCardSelected(false)
                        }
                    }
                }
            }
            
            // Enhanced kart slide-in animasyonu - desteden gelir
            const deckX = 50
            const deckY = 200
            modernCard.x = deckX  // Deste pozisyonundan başla
            modernCard.y = deckY
            modernCard.setAlpha(0)
            modernCard.setScale(0.3)  // Çok küçük başla
            modernCard.setRotation(0.3)  // Dönük başla
            
            // Gelişmiş sliding animasyon serisini başlat
            this.time.delayedCall(index * 150, () => {
                // Kart dağıtma ses efekti
                if (this.audioManager) {
                    this.audioManager.playSFX('cardDeal')
                }
                console.log(`🃗 Kart ${index + 1} dağıtılıyor...`)
                
                // 1. Aşama: Deste'den çıkıp büyüme
                this.tweens.add({
                    targets: modernCard,
                    x: cardX + (Math.random() * 40 - 20), // Hafif rastgele ofset
                    y: cardY - 50,
                    alpha: 1,
                    scale: 1.2,  // Önce büyük
                    rotation: 0.1,
                    duration: 300,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        // 2. Aşama: Yerine yerleşme
                        this.tweens.add({
                            targets: modernCard,
                            x: cardX,
                            y: cardY,
                            scale: 1.0,  // Normal boyut
                            rotation: 0,
                            duration: 200,
                            ease: 'Back.easeOut',
                            onComplete: () => {
                                // 3. Aşama: Hafif "landing" bounce
                                this.tweens.add({
                                    targets: modernCard,
                                    scaleX: 1.05,
                                    scaleY: 1.05,
                                    duration: 100,
                                    yoyo: true,
                                    ease: 'Sine.easeInOut'
                                })
                            }
                        })
                    }
                })
                
                // Kart çekme parıltı efekti
                this.createCardDealSparkle(deckX, deckY)
                
                // Ana dağıtma animasyonu
                this.tweens.add({
                    targets: cardSprite,
                    x: cardX,
                    y: cardY,
                    scale: 1,
                    rotation: 0,
                    alpha: 1,
                    duration: 400,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        // Son kart dağıtıldığında deste görselini kaldır ve final animasyonu
                        if (index === this.hand.length - 1) {
                            deckImage.destroy()
                            deckText.destroy()
                            
                            // Tüm kartların hafif sıçrama animasyonu
                            this.handSprites.forEach((sprite, i) => {
                                this.time.delayedCall(i * 30, () => {
                                    this.tweens.add({
                                        targets: sprite,
                                        scaleX: 1.05,
                                        scaleY: 1.05,
                                        duration: 150,
                                        yoyo: true,
                                        ease: 'Sine.easeInOut'
                                    })
                                })
                            })
                            
                            // Son kart dağıtıldığında başarı sesi
                            this.audioManager.playSFX('success')
                            console.log('✨ El dağıtma tamamlandı!')
                        }
                    }
                })
            })
            
            this.handSprites.push(cardSprite)
        })
    }
    
    createCardDealSparkle(x, y) {
        const sparkles = ['✨', '⭐', '💫']
        const sparkle = this.add.text(x, y, sparkles[Math.floor(Math.random() * sparkles.length)], {
            fontSize: '16px',
            fontFamily: 'monospace',
            alpha: 0.8
        }).setOrigin(0.5)
        
        this.tweens.add({
            targets: sparkle,
            alpha: 0,
            scale: 2,
            y: y - 30,
            duration: 300,
            ease: 'Power2.easeOut',
            onComplete: () => sparkle.destroy()
        })
    }
    
    initializeJokers() {
        // Başlangıç jokerleri - test için 3 tane ekle
        const startingJokers = [
            createJokerById('red_card'),
            createJokerById('odd_todd'),
            createJokerById('greedy_joker')
        ]
        
        startingJokers.forEach(joker => {
            if (joker) {
                this.jokers.push(joker)
            }
        })
        
        // Joker sprite'larını oluştur
        this.createJokerSprites()
        
        console.log('Jokerler başlatıldı:', this.jokers.length, 'joker')
        this.jokers.forEach(joker => console.log(' -', joker.toString()))
    }
    
    createJokerSprites() {
        // Mevcut joker sprite'larını temizle
        this.jokerSprites.forEach(sprite => sprite.destroy())
        this.jokerSprites = []
        
        // Modern UI layout kullan
        const jokerArea = this.uiLayout.areas.jokerArea
        const jokerSpacing = 90 // Jokerler arası mesafe
        const startX = jokerArea.x + 50
        const jokerY = jokerArea.y + 60
        
        this.jokers.forEach((joker, index) => {
            const jokerX = startX + (index * jokerSpacing)
            // Modern joker tasarımı kullan
            const modernJoker = this.uiLayout.createModernJoker(jokerX, jokerY, joker)
            
            // Backwards compatibility için sprite objesi oluştur
            const jokerSprite = {
                container: modernJoker,
                joker: joker,
                x: jokerX,
                y: jokerY,
                setAlpha: (alpha) => modernJoker.setAlpha(alpha),
                destroy: () => modernJoker.destroy()
            }
            
            // Joker animasyonu - sol taraftan kayarak gelir
            jokerSprite.x = jokerX - 300
            jokerSprite.setAlpha(0)
            
            this.tweens.add({
                targets: jokerSprite,
                x: jokerX,
                alpha: 1,
                duration: 400 + (index * 100),
                ease: 'Back.easeOut',
                delay: index * 150
            })
            
            this.jokerSprites.push(jokerSprite)
        })
    }
    
    createGameControls() {
        // Modern button grid - Phase 8 layout fix
        const buttonGridY = this.uiLayout.isMobile ? 500 : 480
        const buttonGridX = this.uiLayout.gameWidth / 2
        
        const buttons = [
            {
                text: 'Yeni El Dağıt',
                style: { backgroundColor: 0x22c55e, hoverColor: 0x16a34a },
                onClick: () => this.dealInitialHand()
            },
            {
                text: 'Seçili Kartları Oyna',
                style: { backgroundColor: 0x3b82f6, hoverColor: 0x2563eb, width: this.uiLayout.isMobile ? 140 : 180 },
                onClick: () => this.playSelectedCards()
            },
            {
                text: '+100 Skor',
                style: { backgroundColor: 0xf59e0b, hoverColor: 0xd97706 },
                onClick: () => {
                    this.currentScore += 100
                    this.updateUI()
                }
            },
            {
                text: 'Enhancement Test',
                style: { backgroundColor: 0x8b5cf6, hoverColor: 0x7c3aed },
                onClick: () => this.testEnhancements()
            },
            {
                text: 'Rastgele Joker',
                style: { backgroundColor: 0xec4899, hoverColor: 0xdb2777 },
                onClick: () => this.addRandomJoker()
            },
            {
                text: 'API Test',
                style: { backgroundColor: 0x06b6d4, hoverColor: 0x0891b2 },
                onClick: () => this.testAPI()
            }
        ]
        
        // Create the modern button grid
        this.gameButtons = this.uiLayout.createButtonGrid(buttonGridX, buttonGridY, buttons)
    }
    
    // Missing functions need to be added back
    testEnhancements() {
        console.log('Testing enhancements...')
    }
    
    addRandomJoker() {
        console.log('Adding random joker...')
    }
    
    testAPI() {
        console.log('Testing API...')
    }
    
    setupEventListeners() {
        // Kart oynanma event'i
        this.events.on('cardPlayed', (card, cardSprite) => {
            console.log('Kart oynandı:', card.toString())
            this.toggleCardSelection(card, cardSprite)
        })
    }
}
        
        addJokerButton.on('pointerdown', () => {
            this.addRandomJoker()
        })
        
        // API test butonu
        const apiTestButton = this.add.text(300, 490, '[ API Test ]', {
            fontSize: '16px',
            fill: '#00bcd4',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive()
        
        apiTestButton.on('pointerdown', () => {
            this.runAPITests()
        })
        
        // Oyun kaydet butonu
        const saveButton = this.add.text(450, 490, '[ Oyunu Kaydet ]', {
            fontSize: '16px',
            fill: '#4caf50',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive()
        
        saveButton.on('pointerdown', () => {
            this.saveGameState()
        })
        
        // Oyun yükle butonu
        const loadButton = this.add.text(600, 490, '[ Oyunu Yükle ]', {
            fontSize: '16px',
            fill: '#ff9800',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive()
        
        loadButton.on('pointerdown', () => {
            this.loadGameState()
        })
        
        // Yüksek skor kaydet butonu  
        const highscoreButton = this.add.text(750, 490, '[ Skor Kaydet ]', {
            fontSize: '16px',
            fill: '#e91e63',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive()
        
        highscoreButton.on('pointerdown', () => {
            this.saveHighscore()
        })
        
        // Dükkan butonu
        const shopButton = this.add.text(850, 460, '[ 🛒 DÜKKAN ]', {
            fontSize: '16px',
            fill: '#ff9800',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive()
        
        shopButton.on('pointerdown', () => {
            this.openShop()
        })
        
        // Envanter butonu (Tarot kartları)
        const inventoryButton = this.add.text(850, 490, '[ 🔮 ENVANTER ]', {
            fontSize: '16px',
            fill: '#9c27b0',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive()
        
        inventoryButton.on('pointerdown', () => {
            this.openInventory()
        })
    }
    
    setupEventListeners() {
        // Kart oynanma event'i
        this.events.on('cardPlayed', (card, cardSprite) => {
            console.log('Kart oynandı:', card.toString())
            // Şimdilik kartı seçili kartlara ekle
            this.toggleCardSelection(card, cardSprite)
        })
        
        // Kart seçimi için tıklama (alternatif yöntem)
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject.card) {
                this.toggleCardSelection(gameObject.card, gameObject)
            }
        })
        
        // Joker toggle event'i
        this.events.on('jokerToggled', (joker, jokerSprite) => {
            console.log(`Joker ${joker.name} durumu değiştirildi:`, joker.isActive ? 'Aktif' : 'Pasif')
        })
    }
    
    toggleCardSelection(card, cardSprite) {
        const index = this.selectedCards.findIndex(c => c.id === card.id)
        
        if (index >= 0) {
            // Seçimi kaldır
            this.selectedCards.splice(index, 1)
            cardSprite.setSelected(false)
        } else {
            // Seç (maksimum 5 kart)
            if (this.selectedCards.length < 5) {
                this.selectedCards.push(card)
                cardSprite.setSelected(true)
            } else {
                console.log('Maksimum 5 kart seçebilirsiniz!')
                return
            }
        }
        
        // Seçili kartların poker elini güncelle
        this.updateSelectedHandPreview()
        console.log('Seçili kartlar:', this.selectedCards.length)
    }
    
    updateSelectedHandPreview() {
        if (this.selectedCards.length === 0) {
            if (this.handResultText) {
                this.handResultText.setText('Kart seçin ve oynayın...')
                this.handResultText.setStyle({ color: '#fff' })
            }
            // Modern UI'da play area text güncelle
            if (this.uiLayout && this.uiLayout.uiElements.playAreaText) {
                this.uiLayout.uiElements.playAreaText.setText('Select cards and play poker hand')
            }
            return
        }
        
        // Mevcut seçimin poker elini değerlendir
        const previewResult = evaluateHand(this.selectedCards)
        
        if (previewResult) {
            const previewScore = this.calculateHandScore(previewResult, this.selectedCards)
            const previewText = `${previewResult.name}\n${previewScore.chips} çip × ${previewScore.multiplier} = ${previewScore.totalScore} puan\n(${this.selectedCards.length}/5 kart seçili)`
            
            if (this.handResultText) {
                this.handResultText.setText(previewText)
                this.handResultText.setStyle({ color: '#ffeb3b' }) // Sarı renk (preview)
            }
            
            // Modern UI'da play area text güncelle
            if (this.uiLayout && this.uiLayout.uiElements.playAreaText) {
                this.uiLayout.uiElements.playAreaText.setText(`${previewResult.name} - ${previewScore.totalScore} points`)
            }
        } else {
            if (this.handResultText) {
                this.handResultText.setText(`${this.selectedCards.length}/5 kart seçili\nGeçerli el oluşturulamadı`)
                this.handResultText.setStyle({ color: '#ff9800' }) // Turuncu renk
            }
            
            // Modern UI'da play area text güncelle
            if (this.uiLayout && this.uiLayout.uiElements.playAreaText) {
                this.uiLayout.uiElements.playAreaText.setText(`${this.selectedCards.length}/5 cards selected - No valid hand`)
            }
        }
    }
    
    playSelectedCards() {
        if (this.selectedCards.length === 0) {
            console.log('Hiç kart seçilmemiş!')
            if (this.handResultText) {
                this.handResultText.setText('Hiç kart seçilmemiş!')
            }
            return
        }
        
        console.log('Oynanan kartlar:', this.selectedCards.map(c => c.toString()))
        
        // Poker elini değerlendir
        this.currentHandResult = evaluateHand(this.selectedCards)
        
        if (this.currentHandResult) {
            // Puan hesapla
            const handScore = this.calculateHandScore(this.currentHandResult, this.selectedCards)
            this.currentScore += handScore.totalScore
            
            // Sonucu göster
            const resultText = `${this.currentHandResult.name}\n${handScore.chips} çip × ${handScore.multiplier} = ${handScore.totalScore} puan`
            
            if (this.handResultText) {
                this.handResultText.setText(resultText)
                this.handResultText.setStyle({ color: '#4caf50' })
            }
            
            // Modern UI'da play area result göster
            if (this.uiLayout && this.uiLayout.uiElements.playAreaText) {
                this.uiLayout.uiElements.playAreaText.setText(`${this.currentHandResult.name} - ${handScore.totalScore} points!`)
            }
            
            console.log('Poker eli:', this.currentHandResult.name)
            console.log('Puan hesaplanması:', handScore)
            
            // Para ödülü hesapla ve ver
            const moneyReward = this.calculateMoneyReward(this.currentHandResult, handScore)
            this.money += moneyReward
            
            // Görsel efekt
            this.showScoreAnimation(handScore.totalScore)
            
            if (moneyReward > 0) {
                this.showMoneyAnimation(moneyReward)
                console.log(`💰 Para ödülü: $${moneyReward}`)
            }
            
            // Blind tamamlama kontrolü
            this.checkBlindCompletion()
            
        } else {
            if (this.handResultText) {
                this.handResultText.setText('Geçerli poker eli oluşturulamadı!')
                this.handResultText.setStyle({ color: '#f44336' })
            }
            
            // Modern UI'da error message göster
            if (this.uiLayout && this.uiLayout.uiElements.playAreaText) {
                this.uiLayout.uiElements.playAreaText.setText('No valid poker hand!')
            }
        }
        
        // El sayısını azalt
        this.handsLeft--
        
        // Eğer el kalmadıysa ve hedef tutturulamadıysa can kaybet
        if (this.handsLeft <= 0 && this.currentScore < this.blindTarget) {
            this.time.delayedCall(2000, () => {
                this.loseLife()
            })
        }
        
        // Seçimi temizle
        this.selectedCards = []
        this.handSprites.forEach(sprite => sprite.setSelected(false))
        
        this.updateUI()
    }
    
    calculateHandScore(handResult, selectedCards) {
        // Temel çip hesaplama
        let totalChips = handResult.baseChips
        
        // Seçili kartların çip değerlerini ekle
        selectedCards.forEach(card => {
            totalChips += card.getTotalChipValue()
        })
        
        // Temel çarpan hesaplama
        let totalMultiplier = handResult.baseMultiplier
        
        // Kartların enhancement çarpanlarını ekle
        selectedCards.forEach(card => {
            totalMultiplier += card.getEnhancementMultiplierBonus()
        })
        
        // Joker efektlerini hesapla
        const jokerContext = {
            handResult: handResult,
            playedCards: selectedCards,
            isPlayingHand: true,
            isScoreCalculation: true,
            gameState: {
                noLivesLostThisRound: true // Şimdilik her zaman true
            }
        }
        
        const jokerEffects = calculateJokerEffects(this.jokers, jokerContext)
        
        // Joker bonuslarını ekle
        totalChips += jokerEffects.chips
        totalMultiplier += jokerEffects.multiplier
        
        // Planet kartı bonuslarını hesapla ve ekle
        const planetBonus = PlanetCard.calculatePlanetBonus(this, handResult.name)
        totalChips += planetBonus.chips
        totalMultiplier += planetBonus.multiplier
        
        // Minimum çarpan 1 olmalı
        totalMultiplier = Math.max(1, totalMultiplier)
        
        // Final puan
        const totalScore = totalChips * totalMultiplier
        
        if (planetBonus.chips > 0 || planetBonus.multiplier > 0) {
            console.log(`🪐 Planet bonusu: +${planetBonus.chips} çip, +${planetBonus.multiplier} çarpan`)
        }
        
        // Joker efektlerini görsel olarak göster
        this.triggerJokerAnimations(jokerEffects)
        
        return {
            chips: totalChips,
            multiplier: totalMultiplier,
            totalScore: totalScore,
            handName: handResult.name,
            jokerEffects: jokerEffects
        }
    }
    
    triggerJokerAnimations(jokerEffects) {
        // Aktif jokerler için efekt animasyonları tetikle
        this.jokers.forEach((joker, index) => {
            if (joker.isActive && joker.stats.timesTriggered > 0) {
                const jokerSprite = this.jokerSprites[index]
                if (jokerSprite && jokerSprite.playEffectAnimation) {
                    // Kısa gecikme ile animasyonu tetikle
                    this.time.delayedCall(index * 100, () => {
                        jokerSprite.playEffectAnimation()
                    })
                }
            }
        })
    }
    
    showScoreAnimation(score) {
        // Puan büyüklüğüne göre ses efekti
        if (score >= 2000) {
            this.audioManager.playSFX('bigScore')
        } else if (score >= 500) {
            this.audioManager.playSFX('scoreGain')
        } else {
            this.audioManager.playSFX('scoreGain', { volume: 0.5 })
        }
        
        // Gelişmiş puan animasyonu
        const scoreText = this.add.text(480, 300, `+${score}`, {
            fontSize: '32px',
            fill: '#4caf50',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5)
        
        // Ekran titremesi (yüksek skorlarda)
        if (score >= 1000) {
            this.cameras.main.shake(200, 0.01)
        }
        
        // Parıltı efektleri
        this.createScoreSparkles(480, 300, score)
        
        // Ana puan animasyonu
        this.tweens.add({
            targets: scoreText,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            y: 220,
            duration: 1500,
            ease: 'Back.easeOut',
            onComplete: () => {
                scoreText.destroy()
            }
        })
        
        // Renk değişimi animasyonu
        this.tweens.add({
            targets: scoreText,
            duration: 500,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const t = tween.progress
                const r = Phaser.Math.Interpolation.Linear([76, 255], t)
                const g = Phaser.Math.Interpolation.Linear([175, 193], t) 
                const b = Phaser.Math.Interpolation.Linear([80, 7], t)
                scoreText.setTint(Phaser.Display.Color.GetColor(r, g, b))
            }
        })
        
    }
    
    createScoreSparkles(x, y, score) {
        const sparkleCount = Math.min(Math.floor(score / 100), 10)
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = this.add.text(
                x + (Math.random() - 0.5) * 100,
                y + (Math.random() - 0.5) * 50,
                '✨',
                {
                    fontSize: '20px',
                    fontFamily: 'monospace'
                }
            )
            
            // Rastgele yönlerde hareket
            this.tweens.add({
                targets: sparkle,
                x: sparkle.x + (Math.random() - 0.5) * 200,
                y: sparkle.y - Math.random() * 100,
                alpha: 0,
                scale: 0,
                duration: 1000 + Math.random() * 500,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    sparkle.destroy()
                }
            })
        }
    }
    
    addRandomEnhancement() {
        if (this.hand.length === 0) {
            console.log('El boş, enhancement eklenemez!')
            return
        }
        
        // Rastgele bir kart seç
        const randomIndex = Math.floor(Math.random() * this.hand.length)
        const randomCard = this.hand[randomIndex]
        
        // Rastgele enhancement ekle
        const enhancements = ['WILD', 'GLASS', 'STEEL', 'GOLD', 'BONUS_CHIP_2', 'MULTIPLIER_1']
        const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)]
        
        // Enhancement'ı ekle (eğer yoksa)
        if (!randomCard.enhancements.includes(randomEnhancement)) {
            randomCard.enhancements.push(randomEnhancement)
            
            // Sprite'ı güncelle
            const cardSprite = this.handSprites[randomIndex]
            if (cardSprite && cardSprite.updateVisuals) {
                cardSprite.updateVisuals()
            }
            
            console.log(`${randomCard.toString()} kartına ${randomEnhancement} enhancement eklendi!`)
        } else {
            console.log('Bu kart zaten bu enhancement sahip!')
        }
    }
    
    addRandomJoker() {
        // Maksimum joker sayısını kontrol et
        if (this.jokers.length >= 5) {
            console.log('Maksimum joker sayısına ulaşıldı (5)!')
            return
        }
        
        // Rastgele joker oluştur
        const newJoker = createRandomJoker()
        if (newJoker) {
            this.jokers.push(newJoker)
            
            // Yeni joker için sprite oluştur
            const jokerIndex = this.jokers.length - 1
            const jokerSpacing = 90
            const startX = this.jokerArea.x + 50
            const jokerY = this.jokerArea.y + 60
            const jokerX = startX + (jokerIndex * jokerSpacing)
            
            const jokerSprite = createJokerSprite(this, jokerX, jokerY, newJoker)
            
            // Joker animasyonu - yukarıdan düşer
            jokerSprite.y = jokerY - 200
            jokerSprite.setAlpha(0)
            
            this.tweens.add({
                targets: jokerSprite,
                y: jokerY,
                alpha: 1,
                duration: 600,
                ease: 'Bounce.easeOut'
            })
            
            this.jokerSprites.push(jokerSprite)
            
            console.log(`Yeni joker eklendi: ${newJoker.name} [${newJoker.rarity}]`)
        }
    }
    
    async testAPIConnection() {
        console.log('🔄 API bağlantısı test ediliyor...')
        try {
            this.isAPIConnected = await APITest.testConnection()
            if (this.isAPIConnected) {
                console.log('✅ Backend API bağlantısı başarılı!')
            } else {
                console.log('⚠️ Backend APIye bağlanılamadı (offline mode)')
            }
        } catch (error) {
            console.error('❌ API bağlantı testi hatası:', error)
            this.isAPIConnected = false
        }
    }
    
    async runAPITests() {
        console.log('🧪 API testleri başlatılıyor...')
        
        try {
            // Bağlantı testi
            const connectionTest = await APITest.testConnection()
            console.log('1️⃣ Bağlantı testi:', connectionTest ? 'BAŞARILI' : 'BAŞARISIZ')
            
            // Oyun durumu testi
            const gameStateTest = await APITest.testGameState()
            console.log('2️⃣ Oyun durumu testi:', gameStateTest ? 'BAŞARILI' : 'BAŞARISIZ')
            
            // Yüksek skor testi
            const highscoreTest = await APITest.testHighscore()
            console.log('3️⃣ Yüksek skor testi:', highscoreTest ? 'BAŞARILI' : 'BAŞARISIZ')
            
            alert(`API Testleri Tamamlandı!\nBağlantı: ${connectionTest ? '✅' : '❌'}\nOyun Durumu: ${gameStateTest ? '✅' : '❌'}\nYüksek Skor: ${highscoreTest ? '✅' : '❌'}`)
            
        } catch (error) {
            console.error('❌ API testleri hatası:', error)
            alert('API testleri sırasında hata oluştu: ' + APIUtils.formatError(error))
        }
    }
    
    async saveGameState() {
        if (!this.isAPIConnected) {
            alert('Backend APIye bağlanılamadı. Offline moddasınız.')
            return
        }
        
        console.log('💾 Oyun durumu kaydediliyor...')
        
        try {
            const gameState = {
                currentScore: this.currentScore,
                currentBlind: this.currentBlind,
                money: this.money,
                lives: this.lives,
                discardsLeft: this.discardsLeft,
                handsLeft: this.handsLeft,
                deckCards: this.hand.map(card => card.toJSON()), // El kartlarını deste olarak kaydet (basit)
                handCards: [],
                jokers: this.jokers.map(joker => joker.toJSON()),
                planetLevels: {} // Şimdilik boş
            }
            
            const response = await GameStateAPI.save(this.currentUserId, gameState)
            
            if (APIUtils.isSuccess(response)) {
                console.log('✅ Oyun durumu kaydedildi:', response)
                alert('Oyun durumu başarıyla kaydedildi!')
            } else {
                throw new Error(response.message || 'Kaydetme başarısız')
            }
            
        } catch (error) {
            console.error('❌ Oyun durumu kaydetme hatası:', error)
            alert('Oyun durumu kaydedilemedi: ' + APIUtils.formatError(error))
        }
    }
    
    async loadGameState() {
        if (!this.isAPIConnected) {
            alert('Backend APIye bağlanılamadı. Offline moddasınız.')
            return
        }
        
        console.log('📂 Oyun durumu yükleniyor...')
        
        try {
            const response = await GameStateAPI.load(this.currentUserId)
            
            if (APIUtils.isSuccess(response)) {
                const gameState = APIUtils.getData(response)
                console.log('✅ Oyun durumu yüklendi:', gameState)
                
                // Oyun durumunu uygula
                this.currentScore = gameState.currentScore || 0
                this.currentBlind = gameState.currentBlind || 1
                this.money = gameState.money || 50
                this.lives = gameState.lives || 3
                this.discardsLeft = gameState.discardsLeft || 3
                this.handsLeft = gameState.handsLeft || 4
                
                // UI'ı güncelle
                this.updateUI()
                
                alert('Oyun durumu başarıyla yüklendi!')
            } else {
                throw new Error(response.message || 'Yükleme başarısız')
            }
            
        } catch (error) {
            console.error('❌ Oyun durumu yükleme hatası:', error)
            alert('Oyun durumu yüklenemedi: ' + APIUtils.formatError(error))
        }
    }
    
    async saveHighscore() {
        if (!this.isAPIConnected) {
            alert('Backend APIye bağlanılamadı. Offline moddasınız.')
            return
        }
        
        if (this.currentScore === 0) {
            alert('Kaydetmek için bir skor elde edin!')
            return
        }
        
        console.log('🏆 Yüksek skor kaydediliyor...')
        
        try {
            const playerName = prompt('Oyuncu adınızı girin:', 'Anonim Oyuncu')
            if (!playerName) return
            
            const jokersUsed = this.jokers.map(joker => joker.id)
            
            const response = await HighscoreAPI.save(
                this.currentUserId,
                playerName,
                this.currentScore,
                this.currentBlind,
                jokersUsed
            )
            
            if (APIUtils.isSuccess(response)) {
                console.log('✅ Yüksek skor kaydedildi:', response)
                alert(`Yüksek skor kaydedildi!\nOyuncu: ${playerName}\nSkor: ${this.currentScore}`)
            } else {
                throw new Error(response.message || 'Kaydetme başarısız')
            }
            
        } catch (error) {
            console.error('❌ Yüksek skor kaydetme hatası:', error)
            alert('Yüksek skor kaydedilemedi: ' + APIUtils.formatError(error))
        }
    }
    
    // Oyun alanı koordinatlarını döndür (CardSprite için)
    getPlayArea() {
        return this.playArea
    }
    
    updateUI() {
        // Modern UI güncelle
        this.updateModernUI()
        
        // Eski UI elementleri de güncellensin (backward compatibility)
        if (this.scoreText) {
            this.scoreText.setText(`Skor: ${this.currentScore}`)
        }
        if (this.moneyText) {
            this.moneyText.setText(`Para: $${this.money}`)
        }
        if (this.livesText) {
            this.livesText.setText(`Can: ${this.lives}`)
        }
        if (this.blindText) {
            this.blindText.setText(`${this.getBlindName()}`)
        }
        if (this.targetText) {
            this.targetText.setText(`🎯 Hedef: ${this.blindTarget}`)
        }
        if (this.anteText) {
            this.anteText.setText(`Ante: ${this.currentAnte}`)
        }
        if (this.discardsText) {
            this.discardsText.setText(`Discard: ${this.discardsLeft}`)
        }
        if (this.handsText) {
            this.handsText.setText(`El: ${this.handsLeft}`)
        }
        
        // Hedef yaklaşırken renk değiştir ve ilerleme çubuğunu güncelle
        const progress = Math.min(this.currentScore / this.blindTarget, 1.0)
        const progressWidth = progress * 300  // 300px maksimum genişlik
        
        // İlerleme çubuğunu güncelle
        if (this.progressBarFill) {
            this.progressBarFill.setSize(progressWidth, 16)
            this.progressBarFill.x = 480 - 150 + (progressWidth / 2)  // Ortalanmış konumlama
        }
        
        // Renk değişimleri
        if (this.targetText) {
            if (progress >= 1.0) {
                this.targetText.setStyle({ color: '#4caf50' })  // Yeşil - hedef aşıldı
                if (this.progressBarFill) this.progressBarFill.setFillStyle(0x4caf50)
            } else if (progress >= 0.8) {
                this.targetText.setStyle({ color: '#8bc34a' })  // Açık yeşil - hedefe yakın
                if (this.progressBarFill) this.progressBarFill.setFillStyle(0x8bc34a)
            } else if (progress >= 0.5) {
                this.targetText.setStyle({ color: '#ffc107' })  // Sarı - yarıda
                if (this.progressBarFill) this.progressBarFill.setFillStyle(0xffc107)
            } else {
                this.targetText.setStyle({ color: '#ff9800' })  // Turuncu - başlangıç
                if (this.progressBarFill) this.progressBarFill.setFillStyle(0xff9800)
            }
        }
    }
    
    createPlaceholderTextures() {
        // Kart arka yüzü için basit mavi kare
        this.add.graphics()
            .fillStyle(0x4169e1)
            .fillRect(0, 0, 64, 80)
            .generateTexture('card-back', 64, 80)
        
        // Arkaplan için koyu gri kare
        this.add.graphics()
            .fillStyle(0x333333)
            .fillRect(0, 0, 32, 32)
            .generateTexture('background', 32, 32)
        
        console.log('✅ Placeholder textures oluşturuldu')
    }
    
    createOptimizedTextures() {
        console.log('🚀 Optimized textures oluşturuluyor...')
        
        // Asset optimizer ile texture'ları batch oluştur
        this.assetOptimizer.batchCreateCardTextures(this)
        this.assetOptimizer.optimizeJokerTextures(this)
        this.assetOptimizer.optimizeUIElements(this)
        
        // Memory kullanımını optimize et
        this.assetOptimizer.optimizeMemoryUsage()
        
        // Performans istatistiklerini logla
        const stats = this.assetOptimizer.getPerformanceStats()
        console.log('📊 Asset Optimizer İstatistikleri:', stats)
        
        // Eski method'u da çağır (backward compatibility için)
        this.createPlaceholderTextures()
        
        console.log('✅ Optimized textures oluşturuldu')
    }
    
    // Modern arka plan oluştur
    createModernBackground() {
        // UILayout'dan modern arka plan oluştur
        this.modernBackground = this.uiLayout.createModernBackground()
        console.log('🎨 Modern arka plan oluşturuldu')
    }
    
    // Modern UI bileşenlerini oluştur
    createModernUI() {
        console.log('🎨 Modern UI oluşturuluyor...')
        
        // Sol panel oluştur
        this.uiLayout.createLeftPanel()
        
        // Oyun alanı oluştur
        this.uiLayout.createPlayArea()
        
        // Blind bilgisini güncelle
        this.uiLayout.updateBlindInfo(this.blindType, this.getBlindName())
        
        // Oyun durumunu güncelle
        this.updateModernUI()
        
        console.log('✅ Modern UI oluşturuldu')
    }
    
    // Modern UI'ı güncelle
    updateModernUI() {
        if (!this.uiLayout) return
        
        const gameState = {
            currentScore: this.currentScore,
            blindTarget: this.blindTarget,
            money: this.money,
            handsLeft: this.handsLeft,
            discardsLeft: this.discardsLeft
        }
        
        this.uiLayout.updateUI(gameState)
    }
    
    calculateMoneyReward(handResult, handScore) {
        // Temel para ödülü
        let moneyReward = this.baseMoneyReward
        
        // El kalitesine göre bonus
        const handBonus = {
            'Royal Flush': 25,
            'Straight Flush': 20,
            'Four of a Kind': 15,
            'Full House': 12,
            'Flush': 10,
            'Straight': 8,
            'Three of a Kind': 6,
            'Two Pair': 4,
            'Pair': 2,
            'High Card': 0
        }
        
        moneyReward += handBonus[handResult.name] || 0
        
        // Yüksek skorlara ekstra bonus
        if (handScore.totalScore >= 1000) {
            moneyReward += Math.floor(handScore.totalScore / 1000) * 2
        }
        
        // Gold kart bonusu (varsa)
        // Bu kısım enhancement sistemine entegre edilecek
        
        return moneyReward
    }
    
    showMoneyAnimation(amount) {
        // Para kazanma animasyonu
        const moneyText = this.add.text(150, 50, `+$${amount}`, {
            fontSize: '24px',
            fill: '#ffd700',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        })
        
        // Animasyon: yukarı doğru kayarak kaybol
        this.tweens.add({
            targets: moneyText,
            y: 20,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                moneyText.destroy()
            }
        })
    }
    
    openShop() {
        console.log('🛒 Dükkan açılıyor...')
        
        // ShopScene'e geç ve mevcut para bilgisini aktar
        this.scene.start('ShopScene', {
            money: this.money,
            gameScene: this
        })
    }
    
    updateJokerDisplay() {
        // Mevcut joker sprite'larını temizle
        this.jokerSprites.forEach(sprite => sprite.destroy())
        this.jokerSprites = []
        
        // Jokerları yeniden çiz
        this.jokers.forEach((joker, index) => {
            const jokerX = this.jokerArea.x + 20 + (index * 75)
            const jokerY = this.jokerArea.y + 60
            
            const jokerSprite = new JokerSprite(this, jokerX, jokerY, joker)
            this.add.existing(jokerSprite)
            this.jokerSprites.push(jokerSprite)
        })
        
        console.log(`🃏 Joker gösterimi güncellendi: ${this.jokers.length} joker`)
    }
    
    openInventory() {
        console.log('🔮 Envanter açılıyor...')
        
        if (this.tarotInventory.length === 0) {
            console.log('⚠️ Envanterde tarot kartı yok')
            this.showTemporaryMessage('Envanterde tarot kartı yok!', '#ff9800')
            return
        }
        
        // Basit envanter overlay
        this.showTarotInventory()
    }
    
    showTarotInventory() {
        // Envanter elementlerini takip etmek için array başlat
        this.inventoryElements = []
        
        // Overlay arka planı
        this.inventoryOverlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.8)
            .setInteractive()
        this.inventoryElements.push(this.inventoryOverlay)
        
        // Başlık
        const title = this.add.text(480, 100, '🔮 TAROT KARTI ENVANTERİ', {
            fontSize: '28px',
            fill: '#9c27b0',
            fontFamily: 'monospace',
            fontWeight: 'bold'
        }).setOrigin(0.5)
        this.inventoryElements.push(title)
        
        // Tarot kartlarını göster
        this.tarotInventory.forEach((tarot, index) => {
            const x = 200 + (index * 120)
            const y = 270
            
            const tarotContainer = this.add.container(x, y)
            
            // Kart çerçevesi
            const cardFrame = this.add.rectangle(0, 0, 100, 140, 0x4a148c)
                .setStrokeStyle(3, 0x7b1fa2)
            tarotContainer.add(cardFrame)
            
            // İkon
            const iconText = this.add.text(0, -40, '🔮', {
                fontSize: '32px',
                fontFamily: 'monospace'
            }).setOrigin(0.5)
            tarotContainer.add(iconText)
            
            // İsim
            const nameText = this.add.text(0, 0, tarot.name, {
                fontSize: '12px',
                fill: '#fff',
                fontFamily: 'monospace',
                align: 'center',
                wordWrap: { width: 90 }
            }).setOrigin(0.5)
            tarotContainer.add(nameText)
            
            // Kullan butonu
            const useButton = this.add.text(0, 50, '[ KULLAN ]', {
                fontSize: '12px',
                fill: '#4caf50',
                fontFamily: 'monospace',
                backgroundColor: '#333',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5).setInteractive()
            
            useButton.on('pointerdown', () => {
                this.useTarotCard(tarot, index)
            })
            
            tarotContainer.add(useButton)
            
            // Tarot container'ını takip listesine ekle
            this.inventoryElements.push(tarotContainer)
        })
        
        // Kapat butonu
        const closeButton = this.add.text(480, 450, '[ ESC - KAPAT ]', {
            fontSize: '18px',
            fill: '#f44336',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive()
        
        closeButton.on('pointerdown', () => {
            this.closeInventory()
        })
        
        // Close butonu da takip listesine ekle
        this.inventoryElements.push(closeButton)
        
        // ESC tuşu ile kapatma
        this.inventoryCloseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        this.inventoryCloseKey.on('down', () => {
            this.closeInventory()
        })
    }
    
    closeInventory() {
        // Güvenli envanter temizliği - sadece envanter elementlerini kaldır
        if (this.inventoryElements) {
            this.inventoryElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy()
                }
            })
            this.inventoryElements = []
        }
        
        // Overlay'i temizle
        if (this.inventoryOverlay) {
            this.inventoryOverlay.destroy()
            this.inventoryOverlay = null
        }
        
        if (this.inventoryCloseKey) {
            this.inventoryCloseKey.destroy()
            this.inventoryCloseKey = null
        }
        
        console.log('🔮 Envanter güvenli şekilde kapatıldı')
    }
    
    useTarotCard(tarot, index) {
        console.log(`🔮 ${tarot.name} kullanılıyor...`)
        
        // Kart seçimi gerekiyorsa (şimdilik rastgele)
        let targetCard = null
        if (this.hand.length > 0) {
            targetCard = this.hand[Math.floor(Math.random() * this.hand.length)]
        }
        
        // Tarot kartını kullan
        const success = tarot.use(this, targetCard)
        
        if (success) {
            // Kartı envanterden kaldır
            this.tarotInventory.splice(index, 1)
            console.log(`✅ ${tarot.name} başarıyla kullanıldı`)
            
            // Envanterin görüntüsünü güncelle
            this.closeInventory()
            if (this.tarotInventory.length > 0) {
                this.showTarotInventory()
            } else {
                this.showTemporaryMessage('Tüm tarot kartları kullanıldı!', '#9c27b0')
            }
            
            // UI'yi güncelle
            this.updateUI()
        } else {
            console.log(`❌ ${tarot.name} kullanılamadı`)
            this.showTemporaryMessage('Tarot kartı kullanılamadı!', '#f44336')
        }
    }
    
    showTemporaryMessage(text, color = '#fff') {
        const message = this.add.text(480, 150, text, {
            fontSize: '20px',
            fill: color,
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5)
        
        // Mesajı 3 saniye sonra kaldır
        this.time.delayedCall(3000, () => {
            message.destroy()
        })
    }
    
    // Tarot kartını envantere ekle
    addTarotToInventory(tarot) {
        this.tarotInventory.push(tarot)
        console.log(`🔮 ${tarot.name} envantere eklendi`)
    }
    
    // Blind sistemini yönet
    calculateBlindTarget() {
        // Temel formül: Base * (Ante^1.6) * BlindMultiplier
        const baseTarget = 300
        const anteMultiplier = Math.pow(this.currentAnte, 1.6)
        
        // Blind tipine göre çarpan
        const blindMultipliers = {
            'small': 1.0,    // Küçük blind
            'big': 1.5,      // Büyük blind
            'boss': 2.0      // Boss blind
        }
        
        const blindTypeMultiplier = blindMultipliers[this.getBlindType()] || 1.0
        
        return Math.floor(baseTarget * anteMultiplier * blindTypeMultiplier)
    }
    
    getBlindType() {
        const blindInAnte = ((this.currentBlind - 1) % 3) + 1
        
        switch (blindInAnte) {
            case 1: return 'small'
            case 2: return 'big'
            case 3: return 'boss'
            default: return 'small'
        }
    }
    
    getBlindName() {
        const blindType = this.getBlindType()
        const anteNumber = this.currentAnte
        
        switch (blindType) {
            case 'small': return `Küçük Blind ${anteNumber}`
            case 'big': return `Büyük Blind ${anteNumber}`
            case 'boss': return `Boss Blind ${anteNumber}`
            default: return `Blind ${this.currentBlind}`
        }
    }
    
    checkBlindCompletion() {
        if (this.currentScore >= this.blindTarget) {
            this.completeBlind()
            return true
        }
        return false
    }
    
    completeBlind() {
        console.log(`🎯 ${this.getBlindName()} tamamlandı! Skor: ${this.currentScore}/${this.blindTarget}`)
        
        // Para ödülü ver
        const reward = this.blindCompletionBonus + (this.currentAnte * 5)
        this.money += reward
        console.log(`💰 Blind tamamlama ödülü: $${reward}`)
        
        // Blind'ı ilerlet
        this.blindsCompleted++
        this.currentBlind++
        
        // Her 3 blind'da ante'yi artır
        if (this.currentBlind % 3 === 1) {
            this.currentAnte++
            console.log(`🎲 Ante ${this.currentAnte}'e yükseltildi!`)
        }
        
        // Yeni blind hedefini hesapla
        this.blindTarget = this.calculateBlindTarget()
        this.blindType = this.getBlindType()
        
        // El ve discard'ları sıfırla
        this.handsLeft = 4
        this.discardsLeft = 3
        this.currentScore = 0
        
        // UI'yi güncelle
        this.updateUI()
        
        // Blind tamamlama mesajı göster
        this.showBlindCompletionMessage(reward)
        
        // Boss blind'lardan sonra dükkan otomatik açılsın
        if (this.getBlindType() === 'small' && this.currentAnte > 1) {
            this.time.delayedCall(2000, () => {
                this.openShop()
            })
        }
    }
    
    showBlindCompletionMessage(reward) {
        // Blind tamamlama fanfarı
        this.audioManager.playSuccessFanfare()
        
        // Ekran parlama efekti
        this.cameras.main.flash(800, 76, 175, 80, false)
        
        // Başarı mesajı
        const completionMessage = this.add.text(480, 200, 
            `🎯 ${this.getBlindName()} TAMAMLANDI!\n\n💰 +$${reward}\n🎲 Sonraki: ${this.getBlindName()}`, {
            fontSize: '24px',
            fill: '#4caf50',
            fontFamily: 'monospace',
            align: 'center',
            backgroundColor: '#333',
            padding: { x: 20, y: 15 }
        }).setOrigin(0.5)
        
        // Başlangıçta mesajı gizle ve animasyonla göster
        completionMessage.setScale(0)
        this.tweens.add({
            targets: completionMessage,
            scale: 1.1,
            duration: 600,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hafif nefes alma animasyonu
                this.tweens.add({
                    targets: completionMessage,
                    scale: 1,
                    duration: 300,
                    yoyo: true,
                    repeat: 5,
                    ease: 'Sine.easeInOut'
                })
            }
        })
        
        // Başarı parıltıları
        for (let i = 0; i < 12; i++) {
            this.time.delayedCall(i * 150, () => {
                this.createSuccessSparkle()
            })
        }
        
        // Para ödülü animasyonu
        this.showMoneyRewardAnimation(reward)
        
        // Mesajı 4 saniye sonra kaldır
        this.time.delayedCall(4000, () => {
            this.tweens.add({
                targets: completionMessage,
                alpha: 0,
                scale: 0.8,
                duration: 400,
                ease: 'Power2.easeIn',
                onComplete: () => completionMessage.destroy()
            })
        })
    }
    
    createSuccessSparkle() {
        const sparkles = ['✨', '⭐', '💫', '🌟', '🎊', '🎉']
        const sparkle = this.add.text(
            Math.random() * 960,
            Math.random() * 540,
            sparkles[Math.floor(Math.random() * sparkles.length)],
            {
                fontSize: '20px',
                fontFamily: 'monospace',
                alpha: 0.9
            }
        ).setOrigin(0.5)
        
        // Rastgele hareket ve yok olma
        this.tweens.add({
            targets: sparkle,
            x: sparkle.x + (Math.random() - 0.5) * 200,
            y: sparkle.y + (Math.random() - 0.5) * 200,
            scale: 0,
            alpha: 0,
            rotation: Math.PI * 2 * (Math.random() - 0.5),
            duration: 1500 + Math.random() * 1000,
            ease: 'Power2.easeOut',
            onComplete: () => sparkle.destroy()
        })
    }
    
    showMoneyRewardAnimation(reward) {
        // Para kazanma ses efekti
        this.audioManager.playSFX('moneyGain')
        
        const moneyText = this.add.text(480, 320, `+$${reward}`, {
            fontSize: '28px',
            fill: '#ffd700',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5)
        
        // Para animasyonu
        moneyText.setScale(0)
        this.tweens.add({
            targets: moneyText,
            scale: 1.3,
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: moneyText,
                    y: 280,
                    alpha: 0,
                    scale: 1.5,
                    duration: 800,
                    ease: 'Power2.easeOut',
                    onComplete: () => moneyText.destroy()
                })
            }
        })
        
        // Para parıltıları
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 80, () => {
                const coinSparkle = this.add.text(
                    480 + (Math.random() - 0.5) * 100,
                    320 + (Math.random() - 0.5) * 50,
                    '💰',
                    { fontSize: '16px', fontFamily: 'monospace' }
                ).setOrigin(0.5)
                
                this.tweens.add({
                    targets: coinSparkle,
                    y: coinSparkle.y - 60,
                    alpha: 0,
                    scale: 0.5,
                    duration: 600,
                    ease: 'Power2.easeOut',
                    onComplete: () => coinSparkle.destroy()
                })
            })
        }
    }
    
    createAudioControls() {
        if (!this.audioManager) {
            console.warn('AudioManager henüz hazır değil')
            return
        }
        
        // Ses kontrol butonları - sağ üst köşede
        const musicButton = this.add.text(820, 20, '🎵', {
            fontSize: '24px',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 8, y: 4 }
        }).setInteractive()
        
        const sfxButton = this.add.text(860, 20, '🔊', {
            fontSize: '24px',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 8, y: 4 }
        }).setInteractive()
        
        // Performance debug butonu (development için)
        const perfButton = this.add.text(900, 20, '📊', {
            fontSize: '24px',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 8, y: 4 }
        }).setInteractive()
        
        // Müzik açık/kapalı
        musicButton.on('pointerdown', () => {
            if (this.audioManager) {
                const isEnabled = this.audioManager.toggleMusic()
                musicButton.setText(isEnabled ? '🎵' : '🎵')
                musicButton.setAlpha(isEnabled ? 1.0 : 0.5)
                this.audioManager.playSFX('buttonClick')
            }
        })
        
        // SFX açık/kapalı
        sfxButton.on('pointerdown', () => {
            if (this.audioManager) {
                const isEnabled = this.audioManager.toggleSFX()
                sfxButton.setText(isEnabled ? '🔊' : '🔇')
                sfxButton.setAlpha(isEnabled ? 1.0 : 0.5)
                // SFX kapalıysa test sesi çalmayacak
                if (isEnabled) {
                    this.audioManager.playSFX('buttonClick')
                }
            }
        })
        
        // Performance debug
        perfButton.on('pointerdown', () => {
            if (this.performanceMonitor) {
                const report = this.performanceMonitor.generateReport()
                const sceneMetrics = this.performanceMonitor.getSceneMetrics(this)
                const optimizationSuggestions = this.performanceMonitor.getOptimizationSuggestions(report)
                
                console.log('🎮 Sahne Metrikleri:', sceneMetrics)
                console.log('💡 Optimizasyon Önerileri:', optimizationSuggestions)
                
                // Asset optimizer istatistikleri
                if (this.assetOptimizer) {
                    const assetStats = this.assetOptimizer.getPerformanceStats()
                    console.log('🚀 Asset Optimizer İstatistikleri:', assetStats)
                }
                
                this.audioManager.playSFX('buttonClick')
            }
        })
        
        // Hover efektleri
        const buttons = [musicButton, sfxButton, perfButton]
        buttons.forEach(button => {
            if (button) {
                button.on('pointerover', () => {
                    button.setScale(1.1)
                    if (this.audioManager) {
                        this.audioManager.playSFX('buttonHover')
                    }
                })
                
                button.on('pointerout', () => {
                    button.setScale(1.0)
                })
            }
        })
    }
    
    checkGameOver() {
        if (this.lives <= 0) {
            this.gameOver()
            return true
        }
        return false
    }
    
    gameOver() {
        console.log(`💀 OYUN BİTTİ! Final Skor: ${this.currentScore}, Ante: ${this.currentAnte}, Blind: ${this.blindsCompleted}`)
        
        // Game Over ekranı göster
        const gameOverScreen = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.9)
        
        const gameOverText = this.add.text(480, 200, 
            `💀 OYUN BİTTİ!\n\nFinal Skor: ${this.currentScore}\nTamamlanan Blind: ${this.blindsCompleted}\nUlaşılan Ante: ${this.currentAnte}`, {
            fontSize: '28px',
            fill: '#f44336',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5)
        
        // Yeniden başla butonu
        const restartButton = this.add.text(480, 350, '[ YENİDEN BAŞLA ]', {
            fontSize: '20px',
            fill: '#4caf50',
            fontFamily: 'monospace',
            backgroundColor: '#333',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive()
        
        restartButton.on('pointerdown', () => {
            this.scene.restart()
        })
        
        // Yüksek skor kaydet (eğer API varsa)
        if (this.isAPIConnected) {
            this.saveHighscore()
        }
    }
    
    loseLife() {
        this.lives--
        console.log(`💔 Can kaybedildi! Kalan can: ${this.lives}`)
        
        if (this.checkGameOver()) {
            return
        }
        
        // El ve discard'ları sıfırla
        this.handsLeft = 4
        this.discardsLeft = 3
        
        // UI'yi güncelle
        this.updateUI()
        
        // Can kaybetme animasyonu
        this.cameras.main.shake(300, 0.02)
        
        // Yeni el dağıt
        this.dealInitialHand()
    }
}