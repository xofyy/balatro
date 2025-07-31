package handlers

import (
	"net/http"
	"time"

	"balatro-backend/config"
	"balatro-backend/models"

	"github.com/gin-gonic/gin"
)

// HealthCheck API sağlık durumu kontrolü - GET /api/health
func HealthCheck(c *gin.Context) {
	// Veritabanı bağlantısını kontrol et
	dbStatus := "healthy"
	dbError := ""

	if err := config.HealthCheck(); err != nil {
		dbStatus = "unhealthy"
		dbError = err.Error()
	}

	// Sistem bilgileri
	healthData := map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now(),
		"services": map[string]interface{}{
			"database": map[string]interface{}{
				"status": dbStatus,
				"error":  dbError,
			},
			"api": map[string]interface{}{
				"status": "healthy",
			},
		},
		"version": "1.0.0",
	}

	// HTTP status kodu belirle
	statusCode := http.StatusOK
	if dbStatus == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
		healthData["status"] = "degraded"
	}

	c.JSON(statusCode, models.APIResponse{
		Success: dbStatus == "healthy",
		Message: "Sistem durumu kontrolü tamamlandı",
		Data:    healthData,
	})
}

// GetAPIInfo API bilgilerini döndürür - GET /api/info
func GetAPIInfo(c *gin.Context) {
	apiInfo := map[string]interface{}{
		"name":        "Balatro Game Backend API",
		"version":     "1.0.0",
		"description": "Balatro tarzı kart oyunu için backend API",
		"endpoints": map[string]interface{}{
			"gameState": []string{
				"POST /api/game-state - Oyun durumu kaydet",
				"GET /api/game-state/:userId - Oyun durumu yükle",
				"DELETE /api/game-state/:userId - Oyun durumu sil",
			},
			"highscores": []string{
				"POST /api/highscores - Yüksek skor kaydet",
				"GET /api/highscores - Yüksek skorları listele",
				"GET /api/highscores/user/:userId - Kullanıcı yüksek skoru",
			},
			"system": []string{
				"GET /api/health - Sistem sağlık durumu",
				"GET /api/info - API bilgileri",
			},
		},
		"timestamp": time.Now(),
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "API bilgileri başarıyla yüklendi",
		Data:    apiInfo,
	})
}