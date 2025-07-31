package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"balatro-backend/config"
	"balatro-backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// SaveHighscore yüksek skor kaydeder - POST /api/highscores
func SaveHighscore(c *gin.Context) {
	var request models.CreateHighscoreRequest

	// JSON request'i parse et
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Geçersiz request formatı",
			Error:   err.Error(),
		})
		return
	}

	// Yeni Highscore oluştur
	highscore := models.Highscore{
		UserID:       request.UserID,
		PlayerName:   request.PlayerName,
		Score:        request.Score,
		DateAchieved: time.Now(),
		FinalBlind:   request.FinalBlind,
		JokersUsed:   request.JokersUsed,
		Seed:         request.Seed,
	}

	// MongoDB koleksiyonu
	collection := config.GetCollection("highscores")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Highscore'u kaydet
	result, err := collection.InsertOne(ctx, highscore)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Yüksek skor kaydedilemedi",
			Error:   err.Error(),
		})
		return
	}

	// Başarılı yanıt
	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Yüksek skor başarıyla kaydedildi",
		Data: map[string]interface{}{
			"insertedId": result.InsertedID,
			"score":      highscore.Score,
		},
	})
}

// GetHighscores yüksek skorları döndürür - GET /api/highscores
func GetHighscores(c *gin.Context) {
	// Query parametreleri
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")
	userID := c.Query("userId") // Opsiyonel: belirli bir kullanıcının skorları

	// String'leri int'e çevir
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 10 // Varsayılan ve maksimum 100
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// MongoDB koleksiyonu
	collection := config.GetCollection("highscores")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Filter oluştur
	filter := bson.M{}
	if userID != "" {
		filter["userId"] = userID
	}

	// Sıralama ve limit options
	opts := options.Find().
		SetSort(bson.D{{"score", -1}, {"dateAchieved", -1}}). // Skor azalan, tarih azalan
		SetLimit(int64(limit)).
		SetSkip(int64(offset))

	// Highscore'ları bul
	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Yüksek skorlar yüklenemedi",
			Error:   err.Error(),
		})
		return
	}
	defer cursor.Close(ctx)

	// Sonuçları decode et
	var highscores []models.Highscore
	if err = cursor.All(ctx, &highscores); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Yüksek skorlar işlenemedi",
			Error:   err.Error(),
		})
		return
	}

	// Toplam sayı (pagination için)
	totalCount, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		totalCount = int64(len(highscores)) // Fallback
	}

	// Başarılı yanıt
	responseData := map[string]interface{}{
		"highscores":  highscores,
		"totalCount":  totalCount,
		"limit":       limit,
		"offset":      offset,
		"hasMore":     int64(offset+limit) < totalCount,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Yüksek skorlar başarıyla yüklendi",
		Data:    responseData,
	})
}

// GetUserHighscore belirli bir kullanıcının en yüksek skorunu döndürür - GET /api/highscores/user/:userId
func GetUserHighscore(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "UserID parametresi gerekli",
		})
		return
	}

	// MongoDB koleksiyonu
	collection := config.GetCollection("highscores")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// En yüksek skoru bul
	filter := bson.M{"userId": userID}
	opts := options.FindOne().SetSort(bson.D{{"score", -1}})

	var highscore models.Highscore
	err := collection.FindOne(ctx, filter, opts).Decode(&highscore)
	if err != nil {
		if err.Error() == "mongo: no documents in result" {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Success: false,
				Message: "Kullanıcının yüksek skoru bulunamadı",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Yüksek skor yüklenemedi",
			Error:   err.Error(),
		})
		return
	}

	// Kullanıcının tüm skorlarındaki sıralamasını bul
	higherScoresCount, _ := collection.CountDocuments(ctx, bson.M{"score": bson.M{"$gt": highscore.Score}})
	rank := higherScoresCount + 1

	// Başarılı yanıt
	responseData := map[string]interface{}{
		"highscore": highscore,
		"rank":      rank,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Kullanıcı yüksek skoru başarıyla yüklendi",
		Data:    responseData,
	})
}