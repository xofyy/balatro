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
        this.currentAnte = 1
        this.discardsLeft = 3
        this.baseMoneyReward = 3
        this.blindCompletionBonus = 10
        this.handsLeft = 4
        this.blindTarget = this.calculateBlindTarget()
        this.blindType = this.getBlindType()
        this.blindsCompleted = 0
        this.planetLevels = {}
        this.tarotInventory = []
        
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
        this.assetOptimizer = null
        this.performanceMonitor = null
        this.uiLayout = null
        this.inventoryElements = []
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
    
    createModernBackground() {
        // Gradient arka plan
        this.cameras.main.setBackgroundColor('#1a1a2e')
    }
    
    createOptimizedTextures() {
        // Placeholder texture creation
        console.log('🎨 Creating optimized textures...')
    }
    
    createModernUI() {
        // Modern UI elements
        this.createLeftPanel()
    }
    
    createLeftPanel() {
        // Sol panel UI
        this.uiLayout.createLeftPanel()
    }
    
    initializeDeck() {
        this.deck = createStandardDeck()
        this.deck = shuffleDeck(this.deck)
    }
    
    dealInitialHand() {        
        // Eski sprite'ları temizle
        this.handSprites.forEach(sprite => sprite.container.destroy())
        this.handSprites = []
        this.selectedCards = []
        
        // Yeni el çek
        this.hand = drawCards(this.deck, 8)
        
        // Modern sprite'lar oluştur
        this.createHandSprites()
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
            
            // Önce sprite objesi oluştur
            const cardSprite = {
                container: modernCard,
                card: card,
                x: cardX,
                y: cardY,
                selected: false,
                setScale: (scale) => modernCard.setScale(scale),
                setRotation: (rotation) => modernCard.setRotation(rotation),
                setAlpha: (alpha) => modernCard.setAlpha(alpha),
                setSelected: (selected) => {
                    cardSprite.selected = selected
                    if (selected) {
                        modernCard.setY(cardY - 20) // Seçili kartı yukarı kaldır
                        modernCard.setScale(1.1)
                    } else {
                        modernCard.setY(cardY)
                        modernCard.setScale(1.0)
                    }
                },
                destroy: () => modernCard.destroy()
            }
            
            // Kart seçimi için interaktif hale getir - Debug version
            modernCard.on('pointerdown', () => {
                console.log('🃏 Kart tıklandı:', card.toString())
                this.toggleCardSelection(card, cardSprite)
            })
            
            // Ayrıca cardBg'yi de dene (UILayout'tan)
            if (modernCard.list && modernCard.list.length > 1) {
                const cardBg = modernCard.list[1] // İkinci element genelde background
                if (cardBg && cardBg.input) {
                    cardBg.on('pointerdown', () => {
                        console.log('🎯 CardBg tıklandı:', card.toString())
                        this.toggleCardSelection(card, cardSprite)
                    })
                }
            }
            
            // Gelişmiş hover efektlerini ekle
            modernCard.on('pointerover', () => {
                if (!cardSprite.selected) {
                    this.tweens.add({
                        targets: modernCard,
                        scaleX: 1.05,
                        scaleY: 1.05,
                        duration: 150,
                        ease: 'Power2.easeOut'
                    })
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
            
            // Card dealing animasyonu
            this.time.delayedCall(index * 150, () => {
                if (this.audioManager) {
                    this.audioManager.playSFX('cardDeal')
                }
                this.createCardDealSparkle(deckX, deckY)
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
        // Başlangıç jokerleri
        this.jokers = []
    }
    
    async testAPIConnection() {
        console.log('🔄 API bağlantısı test ediliyor...')
        try {
            this.isAPIConnected = await APITest.testConnection()
            if (this.isAPIConnected) {
                console.log('✅ Backend API bağlantısı başarılı!')
            } else {
                console.log('❌ Backend API bağlantısı başarısız!')
            }
        } catch (error) {
            console.error('❌ API bağlantı testi hatası:', error)
            this.isAPIConnected = false
        }
    }
    
    createGameControls() {
        // Modern button grid - Phase 8 layout fix - Yüksek konumlama
        const buttonGridY = this.uiLayout.isMobile ? 350 : 380
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
            },
            {
                text: 'Oyunu Kaydet',
                style: { backgroundColor: 0x4caf50, hoverColor: 0x388e3c },
                onClick: () => this.saveGameState()
            },
            {
                text: 'Oyunu Yükle',
                style: { backgroundColor: 0xff9800, hoverColor: 0xf57c00 },
                onClick: () => this.loadGameState()
            },
            {
                text: 'Skor Kaydet',
                style: { backgroundColor: 0xe91e63, hoverColor: 0xc2185b },
                onClick: () => this.saveHighscore()
            }
        ]
        
        // Create the modern button grid
        this.gameButtons = this.uiLayout.createButtonGrid(buttonGridX, buttonGridY, buttons)
    }
    
    // Essential game methods
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
            console.log('Poker eli:', this.currentHandResult.name)
            console.log('Puan hesaplanması:', handScore)
            
            // Modern UI'da play area result göster
            if (this.uiLayout && this.uiLayout.uiElements.playAreaText) {
                this.uiLayout.uiElements.playAreaText.setText(`${this.currentHandResult.name} - ${handScore.totalScore} points!`)
            }
            
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
            // Modern UI'da error message göster
            if (this.uiLayout && this.uiLayout.uiElements.playAreaText) {
                this.uiLayout.uiElements.playAreaText.setText('No valid poker hand!')
            }
        }
        
        // El sayısını azalt
        this.handsLeft--
        
        // Eğer el kalmadıysa ve hedef tutturulamadıysa can kaybet
        if (this.handsLeft <= 0 && this.currentScore < this.blindTarget) {
            this.loseLife()
        }
        
        // Seçimi temizle
        this.selectedCards = []
        this.handSprites.forEach(sprite => sprite.setSelected && sprite.setSelected(false))
        
        this.updateUI()
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
        if (this.handsText) {
            this.handsText.setText(`El: ${this.handsLeft}`)
        }
        if (this.discardsText) {
            this.discardsText.setText(`Discard: ${this.discardsLeft}`)
        }
        
        // Modern UI Layout update
        const gameState = {
            currentScore: this.currentScore,
            score: this.currentScore,
            money: this.money,
            lives: this.lives,
            blindTarget: this.blindTarget,
            blindType: this.blindType,
            handsLeft: this.handsLeft,
            discardsLeft: this.discardsLeft,
            currentAnte: this.currentAnte,
            currentBlind: this.currentBlind
        }
        
        this.uiLayout.updateUI(gameState)
    }
    
    testEnhancements() {
        console.log('🔮 Testing enhancements на random cards...')
        
        // 3 rastgele karta enhancement ekle
        for (let i = 0; i < 3; i++) {
            this.addRandomEnhancement()
        }
        
        // UI günceller
        this.updateUI()
        
        console.log('✨ Enhancement testi tamamlandı!')
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
            
            // Event handler ekle
            jokerSprite.on('pointerdown', () => {
                this.toggleJoker(newJoker, jokerSprite)
            })
            
            this.jokerSprites.push(jokerSprite)
            
            console.log(`🃏 Yeni joker eklendi: ${newJoker.name} (${newJoker.rarity})`)
            
            // Para maliyeti (gerçek oyunda dükkan sistemi ile)
            const cost = 0 // Test için ücretsiz
            if (cost > 0) {
                this.money -= cost
            }
            
            this.updateUI()
        }
    }
    
    async testAPI() {
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
            
            // API bağlantı durumunu güncelle
            this.isAPIConnected = connectionTest && gameStateTest && highscoreTest
            
            if (this.isAPIConnected) {
                console.log('✅ API bağlantısı aktif - Kaydet/Yükle butonları kullanılabilir!')
            } else {
                console.log('❌ API bağlantısı sorunlu - Offline mod aktif')
            }
            
            alert(`API Testleri Tamamlandı!\nBağlantı: ${connectionTest ? '✅' : '❌'}\nOyun Durumu: ${gameStateTest ? '✅' : '❌'}\nYüksek Skor: ${highscoreTest ? '✅' : '❌'}\n\n${this.isAPIConnected ? '🟢 Kaydet/Yükle butonları aktif!' : '🔴 Offline mod - Kaydet/Yükle devre dışı'}`)
            
        } catch (error) {
            console.error('❌ API testleri hatası:', error)
            this.isAPIConnected = false
            alert('API testleri sırasında hata oluştu: ' + APIUtils.formatError(error))
        }
    }
    
    calculateBlindTarget() {
        return 100 + (this.currentBlind * 50)
    }
    
    getBlindType() {
        return 'small'
    }
    
    setupEventListeners() {
        // Kart oynanma event'i
        this.events.on('cardPlayed', (card, cardSprite) => {
            console.log('Kart oynandı:', card.toString())
            this.toggleCardSelection(card, cardSprite)
        })
    }
    
    // Helper functions
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
    
    calculateHandScore(handResult, selectedCards) {
        // Temel çip hesaplama
        let totalChips = handResult.baseChips
        
        // Seçili kartların çip değerlerini ekle
        selectedCards.forEach(card => {
            totalChips += card.getTotalChipValue ? card.getTotalChipValue() : 0
        })
        
        // Temel çarpan hesaplama
        let totalMultiplier = handResult.baseMultiplier
        
        // Kartların enhancement çarpanlarını ekle
        selectedCards.forEach(card => {
            totalMultiplier += card.getEnhancementMultiplierBonus ? card.getEnhancementMultiplierBonus() : 0
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
        const planetBonus = PlanetCard.calculatePlanetBonus ? PlanetCard.calculatePlanetBonus(this, handResult.name) : { chips: 0, multiplier: 0 }
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
        this.triggerJokerAnimations && this.triggerJokerAnimations(jokerEffects)
        
        return {
            chips: totalChips,
            multiplier: totalMultiplier,
            totalScore: totalScore
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
        if (!randomCard.enhancements) {
            randomCard.enhancements = []
        }
        
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
    
    // Modern UI update
    updateModernUI() {
        // Modern UI Layout'un kendi update metodunu çağır
        if (this.uiLayout && this.uiLayout.updateUI) {
            const gameState = {
                currentScore: this.currentScore,
                score: this.currentScore,
                money: this.money,
                lives: this.lives,
                blindTarget: this.blindTarget,
                blindType: this.blindType,
                handsLeft: this.handsLeft,
                discardsLeft: this.discardsLeft,
                currentAnte: this.currentAnte,
                currentBlind: this.currentBlind
            }
            this.uiLayout.updateUI(gameState)
        }
    }
    
    // Utility methods
    calculateMoneyReward(handResult, handScore) {
        let moneyReward = this.baseMoneyReward
        
        // Yüksek el türlerine ekstra para
        if (handScore.totalScore > 100) {
            moneyReward += 2
        }
        if (handScore.totalScore > 300) {
            moneyReward += 3
        }
        
        return moneyReward
    }
    
    showScoreAnimation(score) {
        // Basit score animasyonu
        const scoreAnimation = this.add.text(400, 200, `+${score}`, {
            fontSize: '32px',
            fill: '#4caf50',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        
        this.tweens.add({
            targets: scoreAnimation,
            y: scoreAnimation.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2.easeOut',
            onComplete: () => scoreAnimation.destroy()
        })
    }
    
    showMoneyAnimation(money) {
        // Basit money animasyonu
        const moneyAnimation = this.add.text(450, 200, `+$${money}`, {
            fontSize: '24px',
            fill: '#ffeb3b',
            fontFamily: 'monospace'
        }).setOrigin(0.5)
        
        this.tweens.add({
            targets: moneyAnimation,
            y: moneyAnimation.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: () => moneyAnimation.destroy()
        })
    }
    
    checkBlindCompletion() {
        if (this.currentScore >= this.blindTarget) {
            console.log('🎯 Blind tamamlandı!')
            this.completeBlind()
        }
    }
    
    completeBlind() {
        this.blindsCompleted++
        this.currentBlind++
        
        // Yeni hedef
        this.blindTarget = this.calculateBlindTarget()
        this.blindType = this.getBlindType()
        
        // Ante artırımı (her 3 blind'da bir)
        if (this.currentBlind % 3 === 1) {
            this.currentAnte++
        }
        
        // Bonus para
        this.money += this.blindCompletionBonus
        
        // El ve discard sıfırla
        this.handsLeft = 4
        this.discardsLeft = 3
        
        this.updateUI()
        console.log(`🆙 Yeni blind: ${this.currentBlind}, Ante: ${this.currentAnte}`)
    }
    
    loseLife() {
        this.lives--
        console.log(`💔 Can kaybedildi! Kalan can: ${this.lives}`)
        
        if (this.lives <= 0) {
            this.gameOver()
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
    
    gameOver() {
        console.log('💀 OYUN BİTTİ!')
        // Basit game over
        alert(`OYUN BİTTİ!\nFinal Skor: ${this.currentScore}\nTamamlanan Blind: ${this.blindsCompleted}`)
    }
    
    getBlindName() {
        return `Blind ${this.currentBlind} (${this.blindType})`
    }
    
    toggleJoker(joker, jokerSprite) {
        joker.isActive = !joker.isActive
        console.log(`🃏 ${joker.name}: ${joker.isActive ? 'Aktif' : 'Pasif'}`)
        
        // Görsel değişiklik
        if (jokerSprite && jokerSprite.setAlpha) {
            jokerSprite.setAlpha(joker.isActive ? 1.0 : 0.6)
        }
    }
    
    // API fonksiyonları
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
                deckCards: this.hand.map(card => card.toJSON ? card.toJSON() : card), // El kartlarını deste olarak kaydet
                handCards: [],
                jokers: this.jokers.map(joker => joker.toJSON ? joker.toJSON() : joker),
                planetLevels: this.planetLevels || {}
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
        
        console.log('📼 Oyun durumu yükleniyor...')
        
        try {
            const response = await GameStateAPI.load(this.currentUserId)
            
            if (APIUtils.isSuccess(response) && response.data) {
                const gameState = response.data
                
                // Oyun durumunu yükle
                this.currentScore = gameState.currentScore || 0
                this.currentBlind = gameState.currentBlind || 1
                this.money = gameState.money || 50
                this.lives = gameState.lives || 3
                this.discardsLeft = gameState.discardsLeft || 3
                this.handsLeft = gameState.handsLeft || 4
                this.planetLevels = gameState.planetLevels || {}
                
                // Blind hedefini yeniden hesapla
                this.blindTarget = this.calculateBlindTarget()
                this.blindType = this.getBlindType()
                
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
        
        console.log('🏆 Yüksek skor kaydediliyor...')
        console.log('🔍 Debug - Skor değeri:', this.currentScore, 'Type:', typeof this.currentScore)
        
        try {
            const playerName = prompt('Oyuncu adınızı girin:', 'Anonymous')
            if (!playerName) return
            
            // Skor değerini kontrol et ve minimum 1 yap
            const finalScore = Math.max(1, this.currentScore || 0)
            const finalBlind = Math.max(1, this.currentBlind || 1)
            
            // Eğer skor hala 0 ise test için 100 puan ver
            if (finalScore === 1 && this.currentScore === 0) {
                console.log('⚠️ Skor 0 idi, test için 100 puan eklendi')
                this.currentScore = 100
                this.updateUI()
            }
            
            console.log('📊 Gönderilen veriler:', {
                userId: this.currentUserId,
                playerName: playerName,
                score: finalScore,
                finalBlind: finalBlind,
                jokersUsed: this.jokers.map(joker => joker.name || joker.id),
                seed: 'game_seed_' + Date.now()
            })
            
            // HighscoreAPI.save(userId, playerName, score, finalBlind, jokersUsed, seed) formatında çağır
            const response = await HighscoreAPI.save(
                this.currentUserId, 
                playerName, 
                finalScore, 
                finalBlind,
                this.jokers.map(joker => joker.name || joker.id), // Joker isimleri
                'game_seed_' + Date.now() // Basit seed
            )
            
            if (APIUtils.isSuccess(response)) {
                console.log('✅ Yüksek skor kaydedildi:', response)
                alert(`Yüksek skor başarıyla kaydedildi!\nSkor: ${this.currentScore}`)
            } else {
                throw new Error(response.message || 'Skor kaydetme başarısız')
            }
            
        } catch (error) {
            console.error('❌ Yüksek skor kaydetme hatası:', error)
            alert('Yüksek skor kaydedilemedi: ' + APIUtils.formatError(error))
        }
    }
}