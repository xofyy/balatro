package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	// DB MongoDB veritabanı instance'ı
	DB *mongo.Database
	// Client MongoDB client instance'ı
	Client *mongo.Client
)

// ConnectDatabase MongoDB'ye bağlantı kurar
func ConnectDatabase() {
	// MongoDB bağlantı URI'sini environment variable'dan al
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		// Geliştirme ortamı için varsayılan değer (placeholder)
		mongoURI = "mongodb://localhost:27017"
		log.Println("⚠️  MONGODB_URI environment variable bulunamadı, varsayılan URI kullanılıyor:", mongoURI)
	}

	// Veritabanı adını environment variable'dan al
	dbName := os.Getenv("DATABASE_NAME")
	if dbName == "" {
		dbName = "balatro_game" // Varsayılan veritabanı adı
	}

	// MongoDB client options
	clientOptions := options.Client().ApplyURI(mongoURI)
	
	// Connection timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// MongoDB'ye bağlan
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal("❌ MongoDB bağlantı hatası:", err)
	}

	// Bağlantıyı test et
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("❌ MongoDB ping hatası:", err)
	}

	// Global değişkenleri ayarla
	Client = client
	DB = client.Database(dbName)

	log.Printf("✅ MongoDB bağlantısı başarılı! Veritabanı: %s", dbName)
}

// DisconnectDatabase MongoDB bağlantısını kapatır
func DisconnectDatabase() {
	if Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		
		err := Client.Disconnect(ctx)
		if err != nil {
			log.Printf("❌ MongoDB bağlantı kapatma hatası: %v", err)
		} else {
			log.Println("✅ MongoDB bağlantısı kapatıldı")
		}
	}
}

// GetCollection belirli bir koleksiyon döndürür
func GetCollection(collectionName string) *mongo.Collection {
	if DB == nil {
		log.Fatal("❌ Veritabanı bağlantısı kurulmamış!")
	}
	return DB.Collection(collectionName)
}

// InitializeCollections gerekli koleksiyonları ve indekslerini oluşturur
func InitializeCollections() {
	ctx := context.Background()

	// PlayerStates koleksiyonu için indeksler
	playerStatesCollection := GetCollection("player_states")
	
	// UserID için unique indeks
	userIDIndex := mongo.IndexModel{
		Keys:    map[string]int{"userId": 1},
		Options: options.Index().SetUnique(true),
	}
	
	_, err := playerStatesCollection.Indexes().CreateOne(ctx, userIDIndex)
	if err != nil {
		log.Printf("⚠️ PlayerStates indeks oluşturma hatası: %v", err)
	} else {
		log.Println("✅ PlayerStates koleksiyonu indeksleri oluşturuldu")
	}

	// Highscores koleksiyonu için indeksler
	highscoresCollection := GetCollection("highscores")
	
	// Score için azalan sıralama indeksi (leaderboard için)
	scoreIndex := mongo.IndexModel{
		Keys: map[string]int{"score": -1},
	}
	
	// DateAchieved için azalan sıralama indeksi
	dateIndex := mongo.IndexModel{
		Keys: map[string]int{"dateAchieved": -1},
	}
	
	_, err = highscoresCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{scoreIndex, dateIndex})
	if err != nil {
		log.Printf("⚠️ Highscores indeks oluşturma hatası: %v", err)
	} else {
		log.Println("✅ Highscores koleksiyonu indeksleri oluşturuldu")
	}
}

// HealthCheck veritabanı sağlık durumunu kontrol eder
func HealthCheck() error {
	if Client == nil {
		return fmt.Errorf("MongoDB client'ı mevcut değil")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := Client.Ping(ctx, nil)
	if err != nil {
		return fmt.Errorf("MongoDB ping başarısız: %v", err)
	}

	return nil
}