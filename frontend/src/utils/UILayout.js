// Modern Balatro-style UI Layout sistemi
export default class UILayout {
    constructor(scene) {
        this.scene = scene
        this.gameWidth = 960
        this.gameHeight = 540
        
        // Responsive design desteği
        this.isMobile = this.detectMobile()
        this.scaleFactor = this.calculateScaleFactor()
        
        // Layout alanları - responsive spacing
        this.areas = this.isMobile ? this.getMobileLayout() : this.getDesktopLayout()
        
        this.uiElements = {}
        this.cardScale = this.isMobile ? 0.6 : 0.8
        this.jokerScale = this.isMobile ? 0.5 : 0.7
    }
    
    detectMobile() {
        return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }
    
    calculateScaleFactor() {
        const minScale = this.isMobile ? 0.6 : 0.8
        const maxScale = 1.0
        const widthRatio = window.innerWidth / this.gameWidth
        const heightRatio = window.innerHeight / this.gameHeight
        return Math.max(minScale, Math.min(maxScale, Math.min(widthRatio, heightRatio)))
    }
    
    getMobileLayout() {
        return {
            // Üst panel - oyun bilgileri (mobilde üstte)
            leftPanel: {
                x: 10,
                y: 5,
                width: 940,
                height: 60
            },
            
            // Blind bilgisi - küçük
            blindArea: {
                x: 10,
                y: 70,
                width: 940,
                height: 40
            },
            
            // Oynanacak kartlar alanı - merkez
            playArea: {
                x: 50,
                y: 120,
                width: 860,
                height: 120
            },
            
            // El kartları - alt, küçük kartlar
            handArea: {
                x: 10,
                y: 250,
                width: 940,
                height: 120
            },
            
            // Jokerler - alt sağ, daha kompakt
            jokerArea: {
                x: 10,
                y: 380,
                width: 460,
                height: 150
            },
            
            // Konsumable kartlar - alt sol
            consumableArea: {
                x: 480,
                y: 380,
                width: 470,
                height: 150
            }
        }
    }
    
    getDesktopLayout() {
        return {
            // Sol panel - oyun bilgileri
            leftPanel: {
                x: 10,
                y: 10,
                width: 200,
                height: 520
            },
            
            // Merkez üst - blind bilgisi
            blindArea: {
                x: 220,
                y: 10,
                width: 520,
                height: 70
            },
            
            // Merkez - oynanacak kartlar alanı  
            playArea: {
                x: 220,
                y: 90,
                width: 520,
                height: 160
            },
            
            // Alt merkez - el kartları (daha geniş)
            handArea: {
                x: 220,
                y: 370,
                width: 650,
                height: 160
            },
            
            // Sağ üst - jokerler
            jokerArea: {
                x: 750,
                y: 10,
                width: 200,
                height: 250
            },
            
            // Sağ alt - konsumable kartlar
            consumableArea: {
                x: 750,
                y: 270,
                width: 200,
                height: 100
            }
        }
        
        this.uiElements = {}
        this.cardScale = 0.8
        this.jokerScale = 0.7
    }
    
    // Modern sol panel oluştur - Balatro stili
    createLeftPanel() {
        const area = this.areas.leftPanel
        
        // Ana panel arka planı - koyu mavi Balatro stili
        const panel = this.scene.add.graphics()
        panel.fillStyle(0x2d3748, 0.95)
        panel.fillRoundedRect(area.x, area.y, area.width, area.height, 12)
        panel.lineStyle(2, 0x4a5568, 1.0)
        panel.strokeRoundedRect(area.x, area.y, area.width, area.height, 12)
        
        const panelX = area.x + 15
        let currentY = area.y + 20
        
        // Blind başlığı - Balatro stili
        const blindPanel = this.scene.add.graphics()
        blindPanel.fillStyle(0x3182ce, 0.9)  // Mavi header
        blindPanel.fillRoundedRect(panelX, currentY, area.width - 30, 60, 8)
        blindPanel.lineStyle(2, 0x4299e1, 0.8)
        blindPanel.strokeRoundedRect(panelX, currentY, area.width - 30, 60, 8)
        
        this.uiElements.blindTitle = this.scene.add.text(panelX + 10, currentY + 8, 'The Eye', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        })
        
        this.uiElements.blindDescription = this.scene.add.text(panelX + 10, currentY + 30, 'No repeat hand types this round', {
            fontSize: '10px',
            fontFamily: 'Arial',
            fill: '#e2e8f0',
            wordWrap: { width: area.width - 50 }
        })
        
        currentY += 80
        
        // Skor bölümü - Balatro stili büyük
        const scorePanel = this.scene.add.graphics()
        scorePanel.fillStyle(0x1a202c, 0.9)
        scorePanel.fillRoundedRect(panelX, currentY, area.width - 30, 80, 8)
        scorePanel.lineStyle(2, 0x4a5568, 0.8)
        scorePanel.strokeRoundedRect(panelX, currentY, area.width - 30, 80, 8)
        
        this.uiElements.scoreLabel = this.scene.add.text(panelX + 10, currentY + 8, 'Round Score', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#a0aec0'
        })
        
        // Büyük skor gösterimi
        this.uiElements.scoreValue = this.scene.add.text(panelX + 10, currentY + 25, '0', {
            fontSize: '28px',
            fontFamily: 'Arial Black',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        })
        
        currentY += 80
        
        // Hedef ve çarpan
        this.createScoreDisplay(panelX, currentY, area.width - 30)
        currentY += 80
        
        // Para
        this.uiElements.moneyValue = this.scene.add.text(panelX, currentY, '$50', {
            fontSize: '20px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fill: '#ffd700'
        })
        
        currentY += 40
        
        // Hands ve Discards
        this.createCounters(panelX, currentY)
        
        return panel
    }
    
    createScoreDisplay(x, y, width) {
        // Hedef skor gösterimi
        const targetPanel = this.scene.add.graphics()
        targetPanel.fillStyle(0x4a5568, 0.3)
        targetPanel.fillRoundedRect(x, y, width, 35, 6)
        
        this.uiElements.targetLabel = this.scene.add.text(x + 8, y + 5, 'Score at least', {
            fontSize: '10px',
            fontFamily: 'monospace',
            fill: '#a0aec0'
        })
        
        this.uiElements.targetValue = this.scene.add.text(x + 8, y + 18, '300', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fill: '#ffffff'
        })
        
        // Çarpan gösterimi
        const multPanel = this.scene.add.graphics()
        multPanel.fillStyle(0xe53e3e, 0.8)
        multPanel.fillRoundedRect(x, y + 45, width, 25, 6)
        
        this.uiElements.multiplierValue = this.scene.add.text(x + 8, y + 50, '340 X 21,600', {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fill: '#ffffff'
        })
    }
    
    createCounters(x, y) {
        const buttonWidth = 70
        const buttonHeight = 40
        const spacing = 15
        
        // Hands - Balatro stili
        const handsPanel = this.scene.add.graphics()
        handsPanel.fillStyle(0x2563eb, 0.9)
        handsPanel.fillRoundedRect(x, y, buttonWidth, buttonHeight, 8)
        handsPanel.lineStyle(2, 0x3b82f6, 1.0)
        handsPanel.strokeRoundedRect(x, y, buttonWidth, buttonHeight, 8)
        
        this.uiElements.handsLabel = this.scene.add.text(x + buttonWidth/2, y + 6, 'Hands', {
            fontSize: '10px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0)
        
        this.uiElements.handsValue = this.scene.add.text(x + buttonWidth/2, y + 20, '4', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5, 0)
        
        // Discards - Balatro stili
        const discardsPanel = this.scene.add.graphics()
        discardsPanel.fillStyle(0x7c3aed, 0.9)
        discardsPanel.fillRoundedRect(x + buttonWidth + spacing, y, buttonWidth, buttonHeight, 8)
        discardsPanel.lineStyle(2, 0x8b5cf6, 1.0)
        discardsPanel.strokeRoundedRect(x + buttonWidth + spacing, y, buttonWidth, buttonHeight, 8)
        
        this.uiElements.discardsLabel = this.scene.add.text(x + buttonWidth + spacing + buttonWidth/2, y + 6, 'Discards', {
            fontSize: '10px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0)
        
        this.uiElements.discardsValue = this.scene.add.text(x + buttonWidth + spacing + buttonWidth/2, y + 20, '3', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5, 0)
    }
    
    // Merkez oyun alanı - Balatro stili
    createPlayArea() {
        const area = this.areas.playArea
        
        // Oynanacak kartlar alanı - daha belirgin çerçeve
        const playFrame = this.scene.add.graphics()
        playFrame.lineStyle(3, 0x64748b, 0.8)
        playFrame.strokeRoundedRect(area.x, area.y, area.width, area.height, 15)
        playFrame.fillStyle(0x1e293b, 0.3)
        playFrame.fillRoundedRect(area.x, area.y, area.width, area.height, 15)
        
        // İç gölge efekti
        const innerShadow = this.scene.add.graphics()
        innerShadow.lineStyle(2, 0x000000, 0.2)
        innerShadow.strokeRoundedRect(area.x + 3, area.y + 3, area.width - 6, area.height - 6, 12)
        
        // "Select cards and play poker hand" mesajı - daha büyük
        this.uiElements.playAreaText = this.scene.add.text(area.x + area.width/2, area.y + area.height/2, 'Select cards and play poker hand', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: '#cbd5e1',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5)
        
        return playFrame
    }
    
    // Gerçekçi poker kartı tasarımı
    createModernCard(x, y, card) {
        // Responsive kart boyutları
        const baseWidth = this.isMobile ? 55 : 70
        const baseHeight = this.isMobile ? 75 : 95
        const cardWidth = baseWidth * this.scaleFactor
        const cardHeight = baseHeight * this.scaleFactor
        
        // Kart container
        const cardContainer = this.scene.add.container(x, y)
        
        // Glassmorphism gölge efekti
        const cardShadow = this.scene.add.graphics()
        cardShadow.fillStyle(0x000000, 0.15)
        cardShadow.fillRoundedRect(-cardWidth/2 + 3, -cardHeight/2 + 3, cardWidth, cardHeight, 12)
        cardContainer.add(cardShadow)
        
        // Glassmorphism ana arka plan
        const cardBg = this.scene.add.graphics()
        cardBg.fillStyle(0xffffff, 0.85)  // Yarı saydam beyaz
        cardBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12)
        cardBg.lineStyle(2, 0xe2e8f0, 0.6)  // Hafif gri kenarlık
        cardBg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12)
        cardContainer.add(cardBg)
        
        // Glassmorphism overlay - ışıltı efekti
        const glassOverlay = this.scene.add.graphics()
        glassOverlay.fillGradientStyle(0xffffff, 0xffffff, 0xf8fafc, 0xf8fafc, 0.2, 0.05, 0.2, 0.05)
        glassOverlay.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight/3, 12)
        cardContainer.add(glassOverlay)
        
        // Suit rengi belirleme - daha canlı renkler
        const suitColor = (card.suit === '♥' || card.suit === '♦') ? '#dc2626' : '#1f2937'
        
        // Optimized responsive font boyutları - Phase 8 fix
        const valueFontSize = Math.max(8, 12 * this.scaleFactor) + 'px'  // Küçültüldü
        const suitFontSize = Math.max(10, 13 * this.scaleFactor) + 'px'   // Küçültüldü
        const centerSuitFontSize = Math.max(20, 28 * this.scaleFactor) + 'px'  // Küçültüldü
        
        // Sol üst - değer (daha kompakt positioning)
        const topValue = this.scene.add.text(-cardWidth/2 + 6, -cardHeight/2 + 4, card.value, {
            fontSize: valueFontSize,
            fontFamily: 'Arial Black',
            fontWeight: 'bold',
            fill: suitColor,
            stroke: '#ffffff',
            strokeThickness: 0.5  // İnce stroke
        })
        cardContainer.add(topValue)
        
        // Sol üst - suit (daha yakın positioning)
        const topSuit = this.scene.add.text(-cardWidth/2 + 6, -cardHeight/2 + 16, card.suit, {
            fontSize: suitFontSize,
            fontFamily: 'Arial',
            fill: suitColor
        })
        cardContainer.add(topSuit)
        
        // Merkez - büyük suit (daha detaylı)
        const centerSuit = this.scene.add.text(0, 0, card.suit, {
            fontSize: centerSuitFontSize,
            fontFamily: 'Arial Black',
            fill: suitColor,
            stroke: suitColor === '#dc2626' ? '#ffffff' : '#ffffff',
            strokeThickness: Math.max(1, this.scaleFactor)
        }).setOrigin(0.5)
        cardContainer.add(centerSuit)
        
        // Sağ alt - ters değer ve suit
        const bottomValue = this.scene.add.text(cardWidth/2 - 6, cardHeight/2 - 16, card.value, {
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fill: suitColor
        }).setOrigin(1, 0).setRotation(Math.PI)
        cardContainer.add(bottomValue)
        
        const bottomSuit = this.scene.add.text(cardWidth/2 - 6, cardHeight/2 - 4, card.suit, {
            fontSize: '14px',
            fontFamily: 'monospace',
            fill: suitColor
        }).setOrigin(1, 0).setRotation(Math.PI)
        cardContainer.add(bottomSuit)
        
        // Enhancement göstergesi
        if (card.enhancements && card.enhancements.length > 0) {
            const enhancement = this.scene.add.graphics()
            enhancement.fillStyle(0xffd700, 0.8)
            enhancement.fillCircle(cardWidth/2 - 10, -cardHeight/2 + 10, 6)
            cardContainer.add(enhancement)
        }
        
        // Interactive area ayarla - tam kart boyutu
        cardBg.setInteractive(new Phaser.Geom.Rectangle(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains)
        
        // Container'ı da interactive yaparak double güvenlik
        cardContainer.setSize(cardWidth, cardHeight)
        cardContainer.setInteractive()
        
        // Selection için gelişmiş helper method ekle
        cardContainer.setCardSelected = (selected) => {
            if (selected) {
                // Seçili kart için glassmorphism mavi glow
                cardBg.clear()
                cardBg.fillStyle(0x3b82f6, 0.9)  // Mavi arka plan
                cardBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12)
                cardBg.lineStyle(3, 0x1d4ed8, 1.0)  // Koyu mavi kenarlık
                cardBg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12)
                
                // Enhanced glow efekti - Phase 8 improvements
                const glowEffect = this.scene.add.graphics()
                glowEffect.lineStyle(6, 0x60a5fa, 0.4)
                glowEffect.strokeRoundedRect(-cardWidth/2 - 3, -cardHeight/2 - 3, cardWidth + 6, cardHeight + 6, 15)
                
                // Additional inner glow
                const innerGlow = this.scene.add.graphics()
                innerGlow.lineStyle(2, 0x93c5fd, 0.6)
                innerGlow.strokeRoundedRect(-cardWidth/2 - 1, -cardHeight/2 - 1, cardWidth + 2, cardHeight + 2, 13)
                
                cardContainer.addAt(glowEffect, 2)
                cardContainer.addAt(innerGlow, 3)
                cardContainer.glowEffect = glowEffect
                cardContainer.innerGlow = innerGlow
                
                // Seçim animasyonu
                this.scene.tweens.add({
                    targets: cardContainer,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 200,
                    ease: 'Back.easeOut'
                })
            } else {
                // Normal duruma döndür
                cardBg.clear()
                cardBg.fillStyle(0xffffff, 0.85)
                cardBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12)
                cardBg.lineStyle(2, 0xe2e8f0, 0.6)
                cardBg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12)
                
                // Glow efektlerini kaldır - Phase 8 cleanup
                if (cardContainer.glowEffect) {
                    cardContainer.glowEffect.destroy()
                    cardContainer.glowEffect = null
                }
                if (cardContainer.innerGlow) {
                    cardContainer.innerGlow.destroy()
                    cardContainer.innerGlow = null
                }
                
                // Normal boyuta döndür
                this.scene.tweens.add({
                    targets: cardContainer,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: 200,
                    ease: 'Power2.easeOut'
                })
            }
        }
        
        return cardContainer
    }
    
    // Modern game state feedback display
    createGameStateDisplay(x, y) {
        const displayWidth = this.isMobile ? 300 : 400
        const displayHeight = this.isMobile ? 80 : 100
        
        // Container
        const stateContainer = this.scene.add.container(x, y)
        
        // Glassmorphism arka plan
        const background = this.scene.add.graphics()
        background.fillStyle(0x1e293b, 0.8)  // Koyu mavi, yarı saydam
        background.fillRoundedRect(-displayWidth/2, -displayHeight/2, displayWidth, displayHeight, 15)
        background.lineStyle(2, 0x3b82f6, 0.6)  // Mavi kenarlık
        background.strokeRoundedRect(-displayWidth/2, -displayHeight/2, displayWidth, displayHeight, 15)
        stateContainer.add(background)
        
        // Glow efekti
        const glow = this.scene.add.graphics()
        glow.lineStyle(4, 0x60a5fa, 0.3)
        glow.strokeRoundedRect(-displayWidth/2 - 2, -displayHeight/2 - 2, displayWidth + 4, displayHeight + 4, 17)
        stateContainer.add(glow)
        
        // Ana başlık metni
        const titleText = this.scene.add.text(0, -20, 'Kart Seçin', {
            fontSize: this.isMobile ? '16px' : '20px',
            fontFamily: 'Arial Black',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5)
        stateContainer.add(titleText)
        
        // Alt başlık / detay metni
        const detailText = this.scene.add.text(0, 10, 'Poker eli oluşturmak için kartları tıklayın', {
            fontSize: this.isMobile ? '11px' : '14px',
            fontFamily: 'Arial',
            fill: '#e2e8f0',
            align: 'center'
        }).setOrigin(0.5)
        stateContainer.add(detailText)
        
        // Skor göstergesi
        const scoreText = this.scene.add.text(0, 35, '', {
            fontSize: this.isMobile ? '13px' : '16px',
            fontFamily: 'Arial Black',
            fontWeight: 'bold',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5)
        stateContainer.add(scoreText)
        
        // Helper methods
        stateContainer.updateDisplay = (title, detail, score = '', color = '#ffffff') => {
            titleText.setText(title)
            titleText.setFill(color)
            detailText.setText(detail)
            scoreText.setText(score)
            
            // Animasyonlu güncelleme
            this.scene.tweens.add({
                targets: stateContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                yoyo: true,
                ease: 'Power2.easeOut'
            })
        }
        
        stateContainer.pulseGlow = () => {
            this.scene.tweens.add({
                targets: glow,
                alpha: 0.6,
                duration: 300,
                yoyo: true,
                repeat: 1,
                ease: 'Sine.easeInOut'
            })
        }
        
        return stateContainer
    }
    
    // Modern audio control toggle
    createAudioToggle(x, y, audioManager) {
        const toggleSize = this.isMobile ? 35 : 45
        
        // Container
        const toggleContainer = this.scene.add.container(x, y)
        
        // Glassmorphism arka plan
        const background = this.scene.add.graphics()
        background.fillStyle(0x1e293b, 0.7)
        background.fillCircle(0, 0, toggleSize/2)
        background.lineStyle(2, 0x3b82f6, 0.5)
        background.strokeCircle(0, 0, toggleSize/2)
        toggleContainer.add(background)
        
        // Audio icon (🔊 or 🔇)
        const iconText = this.scene.add.text(0, 0, '🔊', {
            fontSize: this.isMobile ? '20px' : '24px',
            fontFamily: 'Arial'
        }).setOrigin(0.5)
        toggleContainer.add(iconText)
        
        // Interactive yapı
        toggleContainer.setSize(toggleSize, toggleSize)
        toggleContainer.setInteractive()
        
        // Hover efekti
        toggleContainer.on('pointerover', () => {
            this.scene.tweens.add({
                targets: toggleContainer,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 150,
                ease: 'Power2.easeOut'
            })
            if (audioManager && audioManager.sfxEnabled) {
                audioManager.playSFX('buttonHover')
            }
        })
        
        toggleContainer.on('pointerout', () => {
            this.scene.tweens.add({
                targets: toggleContainer,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 150,
                ease: 'Power2.easeOut'
            })
        })
        
        // Click toggle
        toggleContainer.on('pointerdown', () => {
            if (audioManager) {
                // Toggle all audio
                const wasEnabled = audioManager.sfxEnabled || audioManager.musicEnabled
                audioManager.sfxEnabled = !wasEnabled
                audioManager.musicEnabled = !wasEnabled
                
                // Update icon
                iconText.setText(wasEnabled ? '🔇' : '🔊')
                
                // Update background color
                background.clear()
                const bgColor = wasEnabled ? 0x7f1d1d : 0x1e293b  // Red when muted
                background.fillStyle(bgColor, 0.7)
                background.fillCircle(0, 0, toggleSize/2)
                background.lineStyle(2, wasEnabled ? 0xef4444 : 0x3b82f6, 0.5)
                background.strokeCircle(0, 0, toggleSize/2)
                
                // Play click sound if enabling
                if (!wasEnabled) {
                    audioManager.playSFX('buttonClick')
                }
                
                // Pulse animation
                this.scene.tweens.add({
                    targets: toggleContainer,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2.easeOut'
                })
            }
        })
        
        return toggleContainer
    }
    
    // Tooltip sistemi
    createTooltip(text, x, y) {
        const tooltip = this.scene.add.container(x, y)
        const tooltipWidth = Math.min(300, text.length * 8)
        const tooltipHeight = 60
        
        // Glassmorphism arka plan
        const background = this.scene.add.graphics()
        background.fillStyle(0x000000, 0.9)
        background.fillRoundedRect(-tooltipWidth/2, -tooltipHeight/2, tooltipWidth, tooltipHeight, 8)
        background.lineStyle(1, 0x3b82f6, 0.5)
        background.strokeRoundedRect(-tooltipWidth/2, -tooltipHeight/2, tooltipWidth, tooltipHeight, 8)
        tooltip.add(background)
        
        // Tooltip metni
        const tooltipText = this.scene.add.text(0, 0, text, {
            fontSize: this.isMobile ? '11px' : '13px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: tooltipWidth - 20 }
        }).setOrigin(0.5)
        tooltip.add(tooltipText)
        
        // Fade in animasyonu
        tooltip.setAlpha(0)
        this.scene.tweens.add({
            targets: tooltip,
            alpha: 1,
            duration: 200,
            ease: 'Power2.easeOut'
        })
        
        // 3 saniye sonra fade out
        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: tooltip,
                alpha: 0,
                duration: 200,
                ease: 'Power2.easeIn',
                onComplete: () => tooltip.destroy()
            })
        })
        
        return tooltip
    }
    
    // Poker eli açıklamaları
    getPokerHandExplanation(handType) {
        const explanations = {
            'High Card': 'En yüksek kart - başka kombinasyon yok',
            'Pair': 'Çift - aynı değerde 2 kart',
            'Two Pair': 'İki çift - iki farklı değerde çiftler',
            'Three of a Kind': 'Üçlü - aynı değerde 3 kart',
            'Straight': 'Sıra - ardışık 5 kart',
            'Flush': 'Renk - aynı türde 5 kart',
            'Full House': 'Dolu ev - 3+2 kombinasyonu',
            'Four of a Kind': 'Dörtlü - aynı değerde 4 kart',
            'Straight Flush': 'Sıralı renk - ardışık ve aynı tür',
            'Royal Flush': 'As sırası - 10-J-Q-K-A aynı tür'
        }
        return explanations[handType] || 'Bilinmeyen el türü'
    }
    
    // Modern button sistemi - Phase 8
    createModernButton(x, y, text, style = {}) {
        const defaultStyle = {
            width: this.isMobile ? 120 : 150,
            height: this.isMobile ? 35 : 45,
            fontSize: this.isMobile ? '12px' : '14px',
            backgroundColor: 0x3b82f6,
            textColor: '#ffffff',
            hoverColor: 0x2563eb,
            borderRadius: 8
        }
        
        const buttonStyle = { ...defaultStyle, ...style }
        
        // Container
        const buttonContainer = this.scene.add.container(x, y)
        
        // Arka plan
        const background = this.scene.add.graphics()
        background.fillStyle(buttonStyle.backgroundColor, 0.9)
        background.fillRoundedRect(-buttonStyle.width/2, -buttonStyle.height/2, buttonStyle.width, buttonStyle.height, buttonStyle.borderRadius)
        background.lineStyle(2, buttonStyle.backgroundColor, 0.3)
        background.strokeRoundedRect(-buttonStyle.width/2, -buttonStyle.height/2, buttonStyle.width, buttonStyle.height, buttonStyle.borderRadius)
        buttonContainer.add(background)
        
        // Button text
        const buttonText = this.scene.add.text(0, 0, text, {
            fontSize: buttonStyle.fontSize,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: buttonStyle.textColor,
            align: 'center'
        }).setOrigin(0.5)
        buttonContainer.add(buttonText)
        
        // Interactive
        buttonContainer.setSize(buttonStyle.width, buttonStyle.height)
        buttonContainer.setInteractive()
        
        // Hover effects
        buttonContainer.on('pointerover', () => {
            background.clear()
            background.fillStyle(buttonStyle.hoverColor, 1.0)
            background.fillRoundedRect(-buttonStyle.width/2, -buttonStyle.height/2, buttonStyle.width, buttonStyle.height, buttonStyle.borderRadius)
            
            this.scene.tweens.add({
                targets: buttonContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Power2.easeOut'
            })
        })
        
        buttonContainer.on('pointerout', () => {
            background.clear()
            background.fillStyle(buttonStyle.backgroundColor, 0.9)
            background.fillRoundedRect(-buttonStyle.width/2, -buttonStyle.height/2, buttonStyle.width, buttonStyle.height, buttonStyle.borderRadius)
            background.lineStyle(2, buttonStyle.backgroundColor, 0.3)
            background.strokeRoundedRect(-buttonStyle.width/2, -buttonStyle.height/2, buttonStyle.width, buttonStyle.height, buttonStyle.borderRadius)
            
            this.scene.tweens.add({
                targets: buttonContainer,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 150,
                ease: 'Power2.easeOut'
            })
        })
        
        return buttonContainer
    }
    
    // Modern button grid layout
    createButtonGrid(centerX, centerY, buttons) {
        const buttonsPerRow = this.isMobile ? 2 : 3
        const buttonSpacing = this.isMobile ? 10 : 15
        const rowSpacing = this.isMobile ? 45 : 55
        
        const buttonContainers = []
        
        buttons.forEach((buttonConfig, index) => {
            const row = Math.floor(index / buttonsPerRow)
            const col = index % buttonsPerRow
            const rowWidth = Math.min(buttons.length - row * buttonsPerRow, buttonsPerRow)
            
            // Center the row
            const startX = centerX - ((rowWidth - 1) * (buttonConfig.width || 150) + (rowWidth - 1) * buttonSpacing) / 2
            const buttonX = startX + col * ((buttonConfig.width || 150) + buttonSpacing)
            const buttonY = centerY + row * rowSpacing
            
            const button = this.createModernButton(buttonX, buttonY, buttonConfig.text, buttonConfig.style)
            
            if (buttonConfig.onClick) {
                button.on('pointerdown', buttonConfig.onClick)
            }
            
            buttonContainers.push(button)
        })
        
        return buttonContainers
    }
    
    // Detaylı joker kartı tasarımı
    createModernJoker(x, y, joker) {
        const jokerWidth = 80
        const jokerHeight = 100
        
        const jokerContainer = this.scene.add.container(x, y)
        
        // Rarity rengine göre gradyan arka plan
        const rarityColors = {
            common: { bg: 0x4a5568, border: 0x718096, text: '#ffffff' },
            uncommon: { bg: 0x059669, border: 0x10b981, text: '#ffffff' },
            rare: { bg: 0x2563eb, border: 0x3b82f6, text: '#ffffff' },
            legendary: { bg: 0xd97706, border: 0xf59e0b, text: '#ffffff' }
        }
        
        const colors = rarityColors[joker.rarity] || rarityColors.common
        
        // Joker gölgesi
        const jokerShadow = this.scene.add.graphics()
        jokerShadow.fillStyle(0x000000, 0.4)
        jokerShadow.fillRoundedRect(-jokerWidth/2 + 2, -jokerHeight/2 + 2, jokerWidth, jokerHeight, 10)
        jokerContainer.add(jokerShadow)
        
        // Joker arka planı - gradyan efekti
        const jokerBg = this.scene.add.graphics()
        jokerBg.fillGradientStyle(colors.bg, colors.bg, colors.border, colors.border, 1, 1, 0.8, 0.8)
        jokerBg.fillRoundedRect(-jokerWidth/2, -jokerHeight/2, jokerWidth, jokerHeight, 10)
        jokerBg.lineStyle(3, colors.border, 1.0)
        jokerBg.strokeRoundedRect(-jokerWidth/2, -jokerHeight/2, jokerWidth, jokerHeight, 10)
        jokerContainer.add(jokerBg)
        
        // Joker ismi - daha büyük ve belirgin
        const name = this.scene.add.text(0, -jokerHeight/2 + 15, joker.name, {
            fontSize: '12px',
            fontFamily: 'Arial Black',
            fontWeight: 'bold',
            fill: colors.text,
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5)
        jokerContainer.add(name)
        
        // Joker ikonu - daha büyük ve merkezi
        const icon = this.scene.add.text(0, -10, '🃏', {
            fontSize: '32px',
            fontFamily: 'Arial'
        }).setOrigin(0.5)
        jokerContainer.add(icon)
        
        // Rarity göstergesi
        const rarityText = this.scene.add.text(0, 10, joker.rarity.toUpperCase(), {
            fontSize: '8px',
            fontFamily: 'Arial Black',
            fill: colors.text,
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5)
        jokerContainer.add(rarityText)
        
        // Açıklama - daha kompakt
        const desc = this.scene.add.text(0, jokerHeight/2 - 20, joker.description.substring(0, 20) + '...', {
            fontSize: '8px',
            fontFamily: 'Arial',
            fill: colors.text,
            align: 'center',
            wordWrap: { width: jokerWidth - 15 }
        }).setOrigin(0.5)
        jokerContainer.add(desc)
        
        return jokerContainer
    }
    
    // Arka plan gradyenti - Balatro stili
    createModernBackground() {
        // Ana arka plan gradyenti
        const bgGraphics = this.scene.add.graphics()
        
        // Balatro benzeri koyu mavi gradyan
        bgGraphics.fillGradientStyle(0x0f172a, 0x1e293b, 0x334155, 0x475569, 1, 1, 1, 1)
        bgGraphics.fillRect(0, 0, this.gameWidth, this.gameHeight)
        
        // Dekoratif geometrik şekiller - Balatro stili
        const shape1 = this.scene.add.graphics()
        shape1.fillStyle(0x1e40af, 0.08)
        shape1.fillCircle(150, 150, 100)
        
        const shape2 = this.scene.add.graphics() 
        shape2.fillStyle(0x7c2d12, 0.08)
        shape2.fillCircle(800, 350, 140)
        
        const shape3 = this.scene.add.graphics()
        shape3.fillStyle(0x166534, 0.06)
        shape3.fillCircle(600, 100, 80)
        
        return bgGraphics
    }
    
    // UI değerlerini güncelle
    updateUI(gameState) {
        if (this.uiElements.scoreValue) {
            this.uiElements.scoreValue.setText(gameState.currentScore.toString())
        }
        
        if (this.uiElements.targetValue) {
            this.uiElements.targetValue.setText(gameState.blindTarget.toString())
        }
        
        if (this.uiElements.moneyValue) {
            this.uiElements.moneyValue.setText('$' + gameState.money)
        }
        
        if (this.uiElements.handsValue) {
            this.uiElements.handsValue.setText(gameState.handsLeft.toString())
        }
        
        if (this.uiElements.discardsValue) {
            this.uiElements.discardsValue.setText(gameState.discardsLeft.toString())
        }
        
        if (this.uiElements.multiplierValue) {
            // Gerçek hesaplama yapılacak
            const chips = gameState.currentScore || 0
            const mult = 1
            this.uiElements.multiplierValue.setText(`${chips} X ${mult}`)
        }
    }
    
    // Blind bilgisini güncelle
    updateBlindInfo(blindType, blindName) {
        if (this.uiElements.blindTitle) {
            this.uiElements.blindTitle.setText(blindName.toUpperCase())
        }
        
        const descriptions = {
            'small': 'No repeat hand types this round',
            'big': 'Score must be higher than last round',
            'boss': 'Special boss rules apply'
        }
        
        if (this.uiElements.blindDescription) {
            this.uiElements.blindDescription.setText(descriptions[blindType] || 'Play poker hands to score')
        }
    }
    
    // Temizlik
    destroy() {
        Object.values(this.uiElements).forEach(element => {
            if (element && element.destroy) {
                element.destroy()
            }
        })
        this.uiElements = {}
    }
}