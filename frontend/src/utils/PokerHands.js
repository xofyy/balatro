// Poker eli algılama ve değerlendirme fonksiyonları
import { getCardNumericValue, SUITS } from './Card.js'

// Poker eli türleri (güçten zayıfa doğru sıralanmış)
export const HAND_TYPES = {
    ROYAL_FLUSH: { name: 'Royal Flush', rank: 10, baseChips: 100, baseMultiplier: 8 },
    STRAIGHT_FLUSH: { name: 'Straight Flush', rank: 9, baseChips: 100, baseMultiplier: 8 },
    FOUR_OF_A_KIND: { name: 'Four of a Kind', rank: 8, baseChips: 60, baseMultiplier: 7 },
    FULL_HOUSE: { name: 'Full House', rank: 7, baseChips: 40, baseMultiplier: 4 },
    FLUSH: { name: 'Flush', rank: 6, baseChips: 35, baseMultiplier: 4 },
    STRAIGHT: { name: 'Straight', rank: 5, baseChips: 30, baseMultiplier: 4 },
    THREE_OF_A_KIND: { name: 'Three of a Kind', rank: 4, baseChips: 30, baseMultiplier: 3 },
    TWO_PAIR: { name: 'Two Pair', rank: 3, baseChips: 20, baseMultiplier: 2 },
    PAIR: { name: 'Pair', rank: 2, baseChips: 10, baseMultiplier: 2 },
    HIGH_CARD: { name: 'High Card', rank: 1, baseChips: 5, baseMultiplier: 1 }
}

// Poker eli değerlendirme sonucu
export class HandResult {
    constructor(handType, cards, description = '') {
        this.handType = handType
        this.cards = cards // Elin oluşturduğu kartlar
        this.description = description
        this.rank = handType.rank
        this.name = handType.name
        this.baseChips = handType.baseChips
        this.baseMultiplier = handType.baseMultiplier
    }
    
    toString() {
        return `${this.name} (${this.cards.map(c => c.toString()).join(', ')})`
    }
}

// Ana poker eli değerlendirme fonksiyonu
export function evaluateHand(cards) {
    if (!cards || cards.length === 0) {
        return null
    }
    
    // Kartları değer ve türe göre sırala ve analiz et
    const sortedCards = [...cards].sort((a, b) => 
        getCardNumericValue(b.value) - getCardNumericValue(a.value)
    )
    
    // Tüm eli türlerini kontrol et (güçlüden zayıfa)
    const checks = [
        () => checkRoyalFlush(sortedCards),
        () => checkStraightFlush(sortedCards),
        () => checkFourOfAKind(sortedCards),
        () => checkFullHouse(sortedCards),
        () => checkFlush(sortedCards),
        () => checkStraight(sortedCards),
        () => checkThreeOfAKind(sortedCards),
        () => checkTwoPair(sortedCards),
        () => checkPair(sortedCards),
        () => checkHighCard(sortedCards)
    ]
    
    for (const check of checks) {
        const result = check()
        if (result) {
            return result
        }
    }
    
    return null
}

// Yardımcı fonksiyonlar
function getValueCounts(cards) {
    const counts = {}
    cards.forEach(card => {
        const value = card.value
        counts[value] = (counts[value] || 0) + 1
    })
    return counts
}

function getSuitCounts(cards) {
    const counts = {}
    cards.forEach(card => {
        const suit = card.suit
        counts[suit] = (counts[suit] || 0) + 1
    })
    return counts
}

function isFlush(cards) {
    if (cards.length < 5) return false
    const suitCounts = getSuitCounts(cards)
    return Object.values(suitCounts).some(count => count >= 5)
}

function isStraight(cards) {
    if (cards.length < 5) return false
    
    const values = cards.map(card => getCardNumericValue(card.value))
    const uniqueValues = [...new Set(values)].sort((a, b) => b - a)
    
    if (uniqueValues.length < 5) return false
    
    // Normal straight kontrolü
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
        let consecutive = true
        for (let j = 0; j < 4; j++) {
            if (uniqueValues[i + j] - uniqueValues[i + j + 1] !== 1) {
                consecutive = false
                break
            }
        }
        if (consecutive) return true
    }
    
    // Düşük As straight kontrolü (A-2-3-4-5)
    if (uniqueValues.includes(14) && uniqueValues.includes(5) && 
        uniqueValues.includes(4) && uniqueValues.includes(3) && uniqueValues.includes(2)) {
        return true
    }
    
    return false
}

// El kontrol fonksiyonları
function checkRoyalFlush(cards) {
    if (cards.length < 5) return null
    
    const suitGroups = {}
    cards.forEach(card => {
        if (!suitGroups[card.suit]) suitGroups[card.suit] = []
        suitGroups[card.suit].push(card)
    })
    
    for (const suit in suitGroups) {
        const suitCards = suitGroups[suit]
        if (suitCards.length >= 5) {
            const values = suitCards.map(c => getCardNumericValue(c.value))
            const hasRoyalValues = [14, 13, 12, 11, 10].every(val => values.includes(val))
            
            if (hasRoyalValues) {
                const royalCards = suitCards.filter(c => 
                    [14, 13, 12, 11, 10].includes(getCardNumericValue(c.value))
                ).slice(0, 5)
                return new HandResult(HAND_TYPES.ROYAL_FLUSH, royalCards, `Royal Flush in ${suit}`)
            }
        }
    }
    
    return null
}

function checkStraightFlush(cards) {
    if (cards.length < 5) return null
    
    const suitGroups = {}
    cards.forEach(card => {
        if (!suitGroups[card.suit]) suitGroups[card.suit] = []
        suitGroups[card.suit].push(card)
    })
    
    for (const suit in suitGroups) {
        const suitCards = suitGroups[suit]
        if (suitCards.length >= 5 && isStraight(suitCards)) {
            return new HandResult(HAND_TYPES.STRAIGHT_FLUSH, suitCards.slice(0, 5), `Straight Flush in ${suit}`)
        }
    }
    
    return null
}

function checkFourOfAKind(cards) {
    const valueCounts = getValueCounts(cards)
    
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count >= 4) {
            const fourCards = cards.filter(c => c.value === value).slice(0, 4)
            return new HandResult(HAND_TYPES.FOUR_OF_A_KIND, fourCards, `Four ${value}s`)
        }
    }
    
    return null
}

function checkFullHouse(cards) {
    const valueCounts = getValueCounts(cards)
    let threeValue = null
    let pairValue = null
    
    // Three of a kind bul
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count >= 3) {
            threeValue = value
            break
        }
    }
    
    if (!threeValue) return null
    
    // Pair bul (three of a kind'dan farklı)
    for (const [value, count] of Object.entries(valueCounts)) {
        if (value !== threeValue && count >= 2) {
            pairValue = value
            break
        }
    }
    
    if (!pairValue) return null
    
    const threeCards = cards.filter(c => c.value === threeValue).slice(0, 3)
    const pairCards = cards.filter(c => c.value === pairValue).slice(0, 2)
    
    return new HandResult(HAND_TYPES.FULL_HOUSE, [...threeCards, ...pairCards], 
        `Full House: ${threeValue}s over ${pairValue}s`)
}

function checkFlush(cards) {
    if (cards.length < 5) return null
    
    const suitCounts = getSuitCounts(cards)
    
    for (const [suit, count] of Object.entries(suitCounts)) {
        if (count >= 5) {
            const flushCards = cards.filter(c => c.suit === suit).slice(0, 5)
            return new HandResult(HAND_TYPES.FLUSH, flushCards, `Flush in ${suit}`)
        }
    }
    
    return null
}

function checkStraight(cards) {
    if (cards.length < 5) return null
    
    if (isStraight(cards)) {
        // En yüksek straight'i bul
        const values = cards.map(card => getCardNumericValue(card.value))
        const uniqueValues = [...new Set(values)].sort((a, b) => b - a)
        
        // En yüksek 5 ardışık kartı al
        let straightCards = []
        for (let i = 0; i <= uniqueValues.length - 5; i++) {
            let consecutive = true
            let tempCards = []
            
            for (let j = 0; j < 5; j++) {
                const targetValue = uniqueValues[i + j]
                const card = cards.find(c => getCardNumericValue(c.value) === targetValue)
                if (card) {
                    tempCards.push(card)
                } else {
                    consecutive = false
                    break
                }
                
                if (j > 0 && uniqueValues[i + j - 1] - targetValue !== 1) {
                    consecutive = false
                    break
                }
            }
            
            if (consecutive && tempCards.length === 5) {
                straightCards = tempCards
                break
            }
        }
        
        if (straightCards.length === 5) {
            const highCard = straightCards[0].value
            return new HandResult(HAND_TYPES.STRAIGHT, straightCards, `Straight to ${highCard}`)
        }
    }
    
    return null
}

function checkThreeOfAKind(cards) {
    const valueCounts = getValueCounts(cards)
    
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count >= 3) {
            const threeCards = cards.filter(c => c.value === value).slice(0, 3)
            return new HandResult(HAND_TYPES.THREE_OF_A_KIND, threeCards, `Three ${value}s`)
        }
    }
    
    return null
}

function checkTwoPair(cards) {
    const valueCounts = getValueCounts(cards)
    const pairs = []
    
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count >= 2) {
            pairs.push(value)
        }
    }
    
    if (pairs.length >= 2) {
        // En yüksek iki pairi al
        pairs.sort((a, b) => getCardNumericValue(b) - getCardNumericValue(a))
        
        const firstPairCards = cards.filter(c => c.value === pairs[0]).slice(0, 2)
        const secondPairCards = cards.filter(c => c.value === pairs[1]).slice(0, 2)
        
        return new HandResult(HAND_TYPES.TWO_PAIR, [...firstPairCards, ...secondPairCards], 
            `Two Pair: ${pairs[0]}s and ${pairs[1]}s`)
    }
    
    return null
}

function checkPair(cards) {
    const valueCounts = getValueCounts(cards)
    
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count >= 2) {
            const pairCards = cards.filter(c => c.value === value).slice(0, 2)
            return new HandResult(HAND_TYPES.PAIR, pairCards, `Pair of ${value}s`)
        }
    }
    
    return null
}

function checkHighCard(cards) {
    if (cards.length === 0) return null
    
    // En yüksek kartı al
    const highestCard = cards.reduce((highest, current) => 
        getCardNumericValue(current.value) > getCardNumericValue(highest.value) ? current : highest
    )
    
    return new HandResult(HAND_TYPES.HIGH_CARD, [highestCard], `${highestCard.value} High`)
}

// Poker elini string olarak formatla
export function formatHandResult(handResult) {
    if (!handResult) return 'Geçersiz El'
    
    return `${handResult.name} - ${handResult.description} (${handResult.baseChips} çip, x${handResult.baseMultiplier})`
}

// İki eli karşılaştır (hangisi daha güçlü)
export function compareHands(hand1, hand2) {
    if (!hand1 && !hand2) return 0
    if (!hand1) return -1
    if (!hand2) return 1
    
    return hand2.rank - hand1.rank // Yüksek rank daha güçlü
}