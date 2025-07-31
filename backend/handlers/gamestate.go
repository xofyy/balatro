package handlers

import (
	"context"
	"net/http"
	"time"

	"balatro-backend/config"
	"balatro-backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// SaveGameState oyun durumunu kaydeder - POST /api/game-state
func SaveGameState(c *gin.Context) {
	var request models.CreatePlayerStateRequest

	// JSON request'i parse et
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Geçersiz request formatı",
			Error:   err.Error(),
		})
		return
	}

	// Yeni PlayerState oluştur
	playerState := models.PlayerState{
		UserID:                request.UserID,
		CurrentScore:          request.CurrentScore,
		CurrentBlind:          request.CurrentBlind,
		Money:                 request.Money,
		Lives:                 request.Lives,
		DiscardsLeft:          request.DiscardsLeft,
		HandsLeft:             request.HandsLeft,
		DeckCards:             request.DeckCards,
		HandCards:             request.HandCards,
		Jokers:                request.Jokers,
		TarotCardsInventory:   []models.TarotCard{}, // Şimdilik boş
		PlanetLevels:          request.PlanetLevels,
		VouchersOwned:         []string{},           // Şimdilik boş
		UnlockedContent:       map[string][]string{}, // Şimdilik boş
		LastPlayedTimestamp:   time.Now(),
	}

	// MongoDB koleksiyonu
	collection := config.GetCollection("player_states")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Upsert işlemi (varsa güncelle, yoksa oluştur)
	filter := bson.M{"userId": request.UserID}
	update := bson.M{"$set": playerState}
	opts := options.Update().SetUpsert(true)

	result, err := collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Oyun durumu kaydedilemedi",
			Error:   err.Error(),
		})
		return
	}

	// Başarılı yanıt
	responseData := map[string]interface{}{
		"upsertedId": result.UpsertedID,
		"modified":   result.ModifiedCount > 0,
		"matched":    result.MatchedCount > 0,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Oyun durumu başarıyla kaydedildi",
		Data:    responseData,
	})
}

// LoadGameState oyun durumunu yükler - GET /api/game-state/:userId
func LoadGameState(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "UserID parametresi gerekli",
		})
		return
	}

	// MongoDB koleksiyonu
	collection := config.GetCollection("player_states")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Oyun durumunu bul
	var playerState models.PlayerState
	filter := bson.M{"userId": userID}

	err := collection.FindOne(ctx, filter).Decode(&playerState)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Success: false,
				Message: "Oyun durumu bulunamadı",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Oyun durumu yüklenemedi",
			Error:   err.Error(),
		})
		return
	}

	// Başarılı yanıt
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Oyun durumu başarıyla yüklendi",
		Data:    playerState,
	})
}

// DeleteGameState oyun durumunu siler - DELETE /api/game-state/:userId
func DeleteGameState(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "UserID parametresi gerekli",
		})
		return
	}

	// MongoDB koleksiyonu
	collection := config.GetCollection("player_states")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Oyun durumunu sil
	filter := bson.M{"userId": userID}
	result, err := collection.DeleteOne(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Oyun durumu silinemedi",
			Error:   err.Error(),
		})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Silinecek oyun durumu bulunamadı",
		})
		return
	}

	// Başarılı yanıt
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Oyun durumu başarıyla silindi",
		Data: map[string]int64{
			"deletedCount": result.DeletedCount,
		},
	})
}