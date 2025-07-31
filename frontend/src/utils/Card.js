// Kart veri yapısı ve yardımcı fonksiyonları

export const SUITS = {
    SPADES: 'SPADES',     // Maça
    HEARTS: 'HEARTS',     // Kupa  
    DIAMONDS: 'DIAMONDS', // Karo
    CLUBS: 'CLUBS'        // Sinek
}

export const VALUES = {
    TWO: '2',
    THREE: '3', 
    FOUR: '4',
    FIVE: '5',
    SIX: '6',
    SEVEN: '7',
    EIGHT: '8',
    NINE: '9',
    TEN: '10',
    JACK: 'JACK',
    QUEEN: 'QUEEN', 
    KING: 'KING',
    ACE: 'ACE'
}

export const ENHANCEMENTS = {
    WILD: 'WILD',                 // Joker - herhangi bir türe dönüşebilir
    GLASS: 'GLASS',               // Cam - ekstra çarpan, %50 yok olma riski
    STEEL: 'STEEL',               // Çelik - elde tutulduğunda çarpan
    GOLD: 'GOLD',                 // Altın - oynandığında ekstra para
    STONE: 'STONE',               // Taş - ekstra çip, kullanılamaz
    BONUS_CHIP_1: 'BONUS_CHIP_1', // +1 Çip bonusu
    BONUS_CHIP_2: 'BONUS_CHIP_2', // +2 Çip bonusu
    BONUS_CHIP_4: 'BONUS_CHIP_4', // +4 Çip bonusu
    MULTIPLIER_1: 'MULTIPLIER_1', // +1 Çarpan bonusu
    MULTIPLIER_2: 'MULTIPLIER_2'  // +2 Çarpan bonusu
}

// Temel kart sınıfı
export class Card {
    constructor(suit, value, enhancements = []) {
        this.suit = suit
        this.value = value
        this.enhancements = [...enhancements] // Kopya oluştur
        this.id = `${suit}_${value}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Kartın temel çip değerini hesapla
    getBaseChipValue() {
        const chipValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            '10': 10, 'JACK': 10, 'QUEEN': 10, 'KING': 10, 'ACE': 11
        }
        return chipValues[this.value] || 0
    }

    // Enhancement'lardan gelen çip bonusunu hesapla
    getEnhancementChipBonus() {
        let bonus = 0
        this.enhancements.forEach(enhancement => {
            switch(enhancement) {
                case ENHANCEMENTS.BONUS_CHIP_1:
                    bonus += 1
                    break
                case ENHANCEMENTS.BONUS_CHIP_2:
                    bonus += 2
                    break
                case ENHANCEMENTS.BONUS_CHIP_4:
                    bonus += 4
                    break
                case ENHANCEMENTS.STONE:
                    bonus += 50 // Taş kartlar yüksek çip verir
                    break
            }
        })
        return bonus
    }

    // Enhancement'lardan gelen çarpan bonusunu hesapla
    getEnhancementMultiplierBonus() {
        let bonus = 0
        this.enhancements.forEach(enhancement => {
            switch(enhancement) {
                case ENHANCEMENTS.MULTIPLIER_1:
                    bonus += 1
                    break
                case ENHANCEMENTS.MULTIPLIER_2:
                    bonus += 2
                    break
                case ENHANCEMENTS.GLASS:
                    bonus += 2 // Cam kartlar +2 çarpan verir
                    break
                case ENHANCEMENTS.STEEL:
                    bonus += 1 // Çelik kartlar +1 çarpan verir (elde tutulduğunda)
                    break
            }
        })
        return bonus
    }

    // Kartın toplam çip değeri
    getTotalChipValue() {
        return this.getBaseChipValue() + this.getEnhancementChipBonus()
    }

    // Kartın wild (joker) olup olmadığını kontrol et
    isWild() {
        return this.enhancements.includes(ENHANCEMENTS.WILD)
    }

    // Kartın oynandıktan sonra yok olup olmayacağını kontrol et (Glass effect)
    shouldDestroyAfterPlay() {
        if (this.enhancements.includes(ENHANCEMENTS.GLASS)) {
            return Math.random() < 0.5 // %50 şans
        }
        return false
    }

    // Kartın oynanabilir olup olmadığını kontrol et (Stone kartlar oynanamaz)
    isPlayable() {
        return !this.enhancements.includes(ENHANCEMENTS.STONE)
    }

    // Kart bilgilerini string olarak döndür (debug için)
    toString() {
        let suitSymbol = ''
        switch(this.suit) {
            case SUITS.SPADES: suitSymbol = '♠'; break
            case SUITS.HEARTS: suitSymbol = '♥'; break
            case SUITS.DIAMONDS: suitSymbol = '♦'; break
            case SUITS.CLUBS: suitSymbol = '♣'; break
        }
        
        const enhancementText = this.enhancements.length > 0 
            ? ` [${this.enhancements.join(', ')}]` 
            : ''
            
        return `${this.value}${suitSymbol}${enhancementText}`
    }

    // Kartı JSON'a dönüştür (kaydetme için)
    toJSON() {
        return {
            suit: this.suit,
            value: this.value,
            enhancements: this.enhancements,
            id: this.id
        }
    }

    // JSON'dan kart oluştur (yükleme için)
    static fromJSON(data) {
        const card = new Card(data.suit, data.value, data.enhancements)
        card.id = data.id
        return card
    }
}

// 52'lik standart poker destesi oluştur
export function createStandardDeck() {
    const deck = []
    
    Object.values(SUITS).forEach(suit => {
        Object.values(VALUES).forEach(value => {
            deck.push(new Card(suit, value))
        })
    })
    
    return deck
}

// Desteyi karıştır (Fisher-Yates algoritması)
export function shuffleDeck(deck) {
    const shuffled = [...deck] // Kopya oluştur
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    return shuffled
}

// Desteden belirli sayıda kart çek
export function drawCards(deck, count) {
    return deck.splice(0, count)
}

// Kart türünün rengini al (kırmızı/siyah)
export function getCardColor(suit) {
    return (suit === SUITS.HEARTS || suit === SUITS.DIAMONDS) ? 'red' : 'black'
}

// Kartın sayısal değerini al (poker eli karşılaştırması için)
export function getCardNumericValue(value) {
    const numericValues = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        '10': 10, 'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14
    }
    return numericValues[value] || 0
}