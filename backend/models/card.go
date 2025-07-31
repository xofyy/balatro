package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Card temel kart yapısı
type Card struct {
	Suit         string   `json:"suit" bson:"suit"`                 // "SPADES", "HEARTS", "DIAMONDS", "CLUBS"
	Value        string   `json:"value" bson:"value"`               // "2", "3", ..., "10", "JACK", "QUEEN", "KING", "ACE"
	Enhancements []string `json:"enhancements" bson:"enhancements"` // Enhancement listesi
}

// Joker joker kartı yapısı
type Joker struct {
	ID       string                 `json:"id" bson:"id"`             // "joker_greedy", "joker_multiplier"
	Level    int                    `json:"level" bson:"level"`       // Joker seviyesi/gücü
	IsActive bool                   `json:"is_active" bson:"is_active"` // Aktif mi pasif mi
	Stats    map[string]interface{} `json:"stats" bson:"stats"`       // Joker istatistikleri
}

// TarotCard tarot kartı yapısı
type TarotCard struct {
	ID       string `json:"id" bson:"id"`             // "tarot_fool", "tarot_magician"
	Quantity int    `json:"quantity" bson:"quantity"` // Envanterdeki sayısı
}

// PlayerState oyuncunun mevcut oyun durumu
type PlayerState struct {
	ID                    primitive.ObjectID    `json:"_id,omitempty" bson:"_id,omitempty"`
	UserID                string                `json:"userId" bson:"userId"`                             // Kullanıcı ID'si (şimdilik string)
	CurrentScore          int64                 `json:"currentScore" bson:"currentScore"`                 // Mevcut skor
	CurrentBlind          int                   `json:"currentBlind" bson:"currentBlind"`                 // Hangi körde
	Money                 int                   `json:"money" bson:"money"`                               // Para birimi
	Lives                 int                   `json:"lives" bson:"lives"`                               // Kalan can
	DiscardsLeft          int                   `json:"discardsLeft" bson:"discardsLeft"`                 // Kalan discard hakkı
	HandsLeft             int                   `json:"handsLeft" bson:"handsLeft"`                       // Kalan el oynama hakkı
	DeckCards             []Card                `json:"deckCards" bson:"deckCards"`                       // Destede kalan kartlar
	HandCards             []Card                `json:"handCards" bson:"handCards"`                       // Eldeki kartlar
	Jokers                []Joker               `json:"jokers" bson:"jokers"`                             // Sahip olunan jokerler
	TarotCardsInventory   []TarotCard           `json:"tarotCardsInventory" bson:"tarotCardsInventory"`   // Tarot kartları envanteri
	PlanetLevels          map[string]int        `json:"planetLevels" bson:"planetLevels"`                 // Poker eli seviyeleri
	VouchersOwned         []string              `json:"vouchersOwned" bson:"vouchersOwned"`               // Sahip olunan voucher'lar
	UnlockedContent       map[string][]string   `json:"unlockedContent" bson:"unlockedContent"`           // Kilidi açılmış içerikler
	LastPlayedTimestamp   time.Time             `json:"lastPlayedTimestamp" bson:"lastPlayedTimestamp"`   // Son oynanma zamanı
}

// Highscore yüksek skor yapısı
type Highscore struct {
	ID           primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	UserID       string             `json:"userId" bson:"userId"`             // Kullanıcı ID'si
	PlayerName   string             `json:"playerName" bson:"playerName"`     // Oyuncu adı
	Score        int64              `json:"score" bson:"score"`               // Kazanılan skor
	DateAchieved time.Time          `json:"dateAchieved" bson:"dateAchieved"` // Skorun elde edildiği tarih
	FinalBlind   int                `json:"finalBlind" bson:"finalBlind"`     // Hangi körde bitti
	JokersUsed   []string           `json:"jokersUsed" bson:"jokersUsed"`     // Kullanılan joker ID'leri
	Seed         string             `json:"seed" bson:"seed"`                 // Oyun seed'i (varsa)
}

// CreatePlayerStateRequest oyun durumu oluşturma/güncelleme request'i
type CreatePlayerStateRequest struct {
	UserID       string                `json:"userId" binding:"required"`
	CurrentScore int64                 `json:"currentScore"`
	CurrentBlind int                   `json:"currentBlind"`
	Money        int                   `json:"money"`
	Lives        int                   `json:"lives"`
	DiscardsLeft int                   `json:"discardsLeft"`
	HandsLeft    int                   `json:"handsLeft"`
	DeckCards    []Card                `json:"deckCards"`
	HandCards    []Card                `json:"handCards"`
	Jokers       []Joker               `json:"jokers"`
	PlanetLevels map[string]int        `json:"planetLevels"`
}

// CreateHighscoreRequest yüksek skor oluşturma request'i
type CreateHighscoreRequest struct {
	UserID     string   `json:"userId" binding:"required"`
	PlayerName string   `json:"playerName" binding:"required"`
	Score      int64    `json:"score" binding:"required"`
	FinalBlind int      `json:"finalBlind"`
	JokersUsed []string `json:"jokersUsed"`
	Seed       string   `json:"seed"`
}

// APIResponse genel API yanıt yapısı
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}