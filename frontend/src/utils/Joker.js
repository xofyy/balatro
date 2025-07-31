// Joker kartları sistemi ve efekt yönetimi
import { SUITS, VALUES, getCardColor } from './Card.js'
import { HAND_TYPES } from './PokerHands.js'

// Joker tetikleme koşulları
export const TRIGGER_CONDITIONS = {
    ON_PLAY: 'ON_PLAY',                    // Her el oynadığında
    ON_DISCARD: 'ON_DISCARD',              // Discard kullandığında
    ON_HAND_PLAYED: 'ON_HAND_PLAYED',      // Belirli el türü oynadığında
    ON_CARD_PLAYED: 'ON_CARD_PLAYED',      // Belirli kart türü oynadığında
    ON_SCORE_CALC: 'ON_SCORE_CALC',        // Puan hesaplanırken
    PASSIVE: 'PASSIVE'                      // Sürekli aktif
}

// Joker sınıfı
export class Joker {
    constructor(id, name, description, rarity = 'common') {
        this.id = id
        this.name = name
        this.description = description
        this.rarity = rarity // common, uncommon, rare, legendary
        this.level = 1
        this.isActive = true
        this.stats = {
            timesTriggered: 0,
            totalChipsAdded: 0,
            totalMultiplierAdded: 0
        }
        
        // Her joker'ın kendine özgü özellikleri
        this.triggerCondition = TRIGGER_CONDITIONS.PASSIVE
        this.effect = null // Fonksiyon olarak atanacak
        this.sellValue = this.getSellValue()
    }
    
    // Joker'ın satış değerini hesapla
    getSellValue() {
        const baseValues = {
            common: 2,
            uncommon: 5,
            rare: 8,
            legendary: 15
        }
        return baseValues[this.rarity] || 2
    }
    
    // Joker'ın renkini al (nadirliye göre)
    getRarityColor() {
        const colors = {
            common: '#9e9e9e',    // Gri
            uncommon: '#4caf50',  // Yeşil  
            rare: '#2196f3',      // Mavi
            legendary: '#ff9800'  // Turuncu
        }
        return colors[this.rarity] || '#9e9e9e'
    }
    
    // Joker efektini tetikle
    trigger(context) {
        if (!this.isActive || !this.effect) {
            return { chips: 0, multiplier: 0, money: 0 }
        }
        
        try {
            const result = this.effect(context)
            
            // İstatistikleri güncelle
            this.stats.timesTriggered++
            this.stats.totalChipsAdded += result.chips || 0
            this.stats.totalMultiplierAdded += result.multiplier || 0
            
            return result
        } catch (error) {
            console.error(`Joker ${this.name} efekt hatası:`, error)
            return { chips: 0, multiplier: 0, money: 0 }
        }
    }
    
    // Joker bilgilerini string olarak döndür
    toString() {
        const activeStatus = this.isActive ? '✓' : '✗'
        return `${this.name} [${this.rarity}] ${activeStatus} (${this.stats.timesTriggered}x)`
    }
    
    // JSON'a dönüştür (kaydetme için)
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            rarity: this.rarity,
            level: this.level,
            isActive: this.isActive,
            stats: this.stats
        }
    }
    
    // JSON'dan joker oluştur (yükleme için)
    static fromJSON(data) {
        const joker = createJokerById(data.id)
        if (joker) {
            joker.level = data.level || 1
            joker.isActive = data.isActive !== undefined ? data.isActive : true
            joker.stats = { ...joker.stats, ...data.stats }
        }
        return joker
    }
}

// Temel jokerler tanımları
export const JOKER_DEFINITIONS = {
    red_card: {
        name: 'Red Card',
        description: 'Her Kupa veya Karo kartı +4 Çip verir',
        rarity: 'common',
        triggerCondition: TRIGGER_CONDITIONS.ON_CARD_PLAYED,
        effect: (context) => {
            let chipBonus = 0
            if (context.playedCards) {
                context.playedCards.forEach(card => {
                    if (card.suit === SUITS.HEARTS || card.suit === SUITS.DIAMONDS) {
                        chipBonus += 4
                    }
                })
            }
            return { chips: chipBonus, multiplier: 0, money: 0 }
        }
    },
    
    odd_todd: {
        name: 'Odd Todd',
        description: 'Her tek sayılı kart +2 Çarpan verir',
        rarity: 'common',
        triggerCondition: TRIGGER_CONDITIONS.ON_CARD_PLAYED,
        effect: (context) => {
            let multiplierBonus = 0
            if (context.playedCards) {
                context.playedCards.forEach(card => {
                    const numValue = parseInt(card.value)
                    if (!isNaN(numValue) && numValue % 2 === 1) { // 3, 5, 7, 9
                        multiplierBonus += 2
                    }
                })
            }
            return { chips: 0, multiplier: multiplierBonus, money: 0 }
        }
    },
    
    greedy_joker: {
        name: 'Greedy Joker',
        description: 'Flush eli oynadığınızda +20 Çip kazanırsınız',
        rarity: 'uncommon',
        triggerCondition: TRIGGER_CONDITIONS.ON_HAND_PLAYED,
        effect: (context) => {
            if (context.handResult && context.handResult.handType === HAND_TYPES.FLUSH) {
                return { chips: 20, multiplier: 0, money: 0 }
            }
            return { chips: 0, multiplier: 0, money: 0 }
        }
    },
    
    fibonacci: {
        name: 'Fibonacci',
        description: 'Fibonacci sayısı kartlar (2,3,5,8) +3 Çarpan verir',
        rarity: 'rare',
        triggerCondition: TRIGGER_CONDITIONS.ON_CARD_PLAYED,
        effect: (context) => {
            const fibNumbers = ['2', '3', '5', '8']
            let multiplierBonus = 0
            
            if (context.playedCards) {
                context.playedCards.forEach(card => {
                    if (fibNumbers.includes(card.value)) {
                        multiplierBonus += 3
                    }
                })
            }
            
            return { chips: 0, multiplier: multiplierBonus, money: 0 }
        }
    },
    
    perfectionist: {
        name: 'Perfectionist', 
        description: 'Bu turda Can kaybetmediyseniz +5 Çarpan',
        rarity: 'legendary',
        triggerCondition: TRIGGER_CONDITIONS.ON_SCORE_CALC,
        effect: (context) => {
            // Context'ten can kaybı bilgisini kontrol et
            const noLivesLost = context.gameState && context.gameState.noLivesLostThisRound
            if (noLivesLost) {
                return { chips: 0, multiplier: 5, money: 0 }
            }
            return { chips: 0, multiplier: 0, money: 0 }
        }
    },
    
    juggler: {
        name: 'Juggler',
        description: 'Oyun başında +1 Discard hakkı verir',
        rarity: 'common',
        triggerCondition: TRIGGER_CONDITIONS.PASSIVE,
        effect: (context) => {
            // Bu joker pasif bir bonus sağlar, puan hesaplamada kullanılmaz
            return { chips: 0, multiplier: 0, money: 0, extraDiscards: 1 }
        }
    }
}

// ID ile joker oluştur
export function createJokerById(id) {
    const definition = JOKER_DEFINITIONS[id]
    if (!definition) {
        console.error(`Joker ID bulunamadı: ${id}`)
        return null
    }
    
    const joker = new Joker(id, definition.name, definition.description, definition.rarity)
    joker.triggerCondition = definition.triggerCondition
    joker.effect = definition.effect
    
    return joker
}

// Rastgele joker oluştur (nadirlğe göre)
export function createRandomJoker(rarityWeights = { common: 60, uncommon: 25, rare: 12, legendary: 3 }) {
    // Nadirlilk seç
    const totalWeight = Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    let selectedRarity = 'common'
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
        random -= weight
        if (random <= 0) {
            selectedRarity = rarity
            break
        }
    }
    
    // Seçilen nadirlikteki jokerleri filtrele
    const availableJokers = Object.keys(JOKER_DEFINITIONS).filter(id => 
        JOKER_DEFINITIONS[id].rarity === selectedRarity
    )
    
    if (availableJokers.length === 0) {
        return createJokerById('red_card') // Fallback
    }
    
    // Rastgele seç
    const randomId = availableJokers[Math.floor(Math.random() * availableJokers.length)]
    return createJokerById(randomId)
}

// Tüm joker ID'lerini listele
export function getAllJokerIds() {
    return Object.keys(JOKER_DEFINITIONS)
}

// Nadirlığa göre joker ID'lerini listele
export function getJokerIdsByRarity(rarity) {
    return Object.keys(JOKER_DEFINITIONS).filter(id => 
        JOKER_DEFINITIONS[id].rarity === rarity
    )
}

// Joker efektlerini hesapla (puan hesaplama için)
export function calculateJokerEffects(jokers, context) {
    let totalChips = 0
    let totalMultiplier = 0
    let totalMoney = 0
    let extraEffects = {}
    
    jokers.forEach(joker => {
        if (!joker.isActive) return
        
        // Joker'ın tetikleme koşulunu kontrol et
        let shouldTrigger = false
        
        switch (joker.triggerCondition) {
            case TRIGGER_CONDITIONS.ON_PLAY:
                shouldTrigger = context.isPlayingHand
                break
            case TRIGGER_CONDITIONS.ON_HAND_PLAYED:
                shouldTrigger = context.handResult !== null
                break
            case TRIGGER_CONDITIONS.ON_CARD_PLAYED:
                shouldTrigger = context.playedCards && context.playedCards.length > 0
                break
            case TRIGGER_CONDITIONS.ON_SCORE_CALC:
                shouldTrigger = context.isScoreCalculation
                break
            case TRIGGER_CONDITIONS.PASSIVE:
                shouldTrigger = true
                break
        }
        
        if (shouldTrigger) {
            const result = joker.trigger(context)
            totalChips += result.chips || 0
            totalMultiplier += result.multiplier || 0
            totalMoney += result.money || 0
            
            // Ekstra efektleri birleştir
            Object.keys(result).forEach(key => {
                if (!['chips', 'multiplier', 'money'].includes(key)) {
                    if (!extraEffects[key]) extraEffects[key] = 0
                    extraEffects[key] += result[key] || 0
                }
            })
        }
    })
    
    return {
        chips: totalChips,
        multiplier: totalMultiplier,
        money: totalMoney,
        ...extraEffects
    }
}