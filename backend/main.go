package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"balatro-backend/config"
	"balatro-backend/handlers"
	"balatro-backend/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// .env dosyasını yükle (geliştirme ortamı için)
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ .env dosyası yüklenemedi, environment variables kullanılacak")
	}

	// Gin mode'u ayarla
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = "debug" // Geliştirme için debug mode
	}
	gin.SetMode(ginMode)

	// MongoDB bağlantısını kur
	config.ConnectDatabase()
	defer config.DisconnectDatabase()

	// Koleksiyonları ve indeksleri başlat
	config.InitializeCollections()

	// Gin router'ı oluştur
	router := gin.New()

	// Middleware'leri ekle
	router.Use(middleware.LoggerMiddleware())
	router.Use(middleware.CORSMiddleware())
	router.Use(gin.Recovery()) // Panic recovery

	// API route'larını tanımla
	setupRoutes(router)

	// Port ayarla
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Varsayılan port
	}

	// Sunucuyu başlat
	log.Printf("🚀 Balatro Backend API başlatılıyor - Port: %s", port)
	log.Printf("📋 API Endpoints:")
	log.Printf("   - POST /api/game-state (Oyun durumu kaydet)")
	log.Printf("   - GET  /api/game-state/:userId (Oyun durumu yükle)")
	log.Printf("   - POST /api/highscores (Yüksek skor kaydet)")
	log.Printf("   - GET  /api/highscores (Yüksek skorları listele)")
	log.Printf("   - GET  /api/health (Sağlık durumu)")
	log.Printf("   - GET  /api/info (API bilgileri)")

	// Graceful shutdown için signal handler
	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, syscall.SIGTERM)
		<-c
		log.Println("🛑 Sunucu kapatılıyor...")
		config.DisconnectDatabase()
		os.Exit(0)
	}()

	// HTTP sunucusunu başlat
	if err := router.Run(":" + port); err != nil {
		log.Fatal("❌ Sunucu başlatılamadı:", err)
	}
}

// setupRoutes API route'larını tanımlar
func setupRoutes(router *gin.Engine) {
	// API v1 grubu
	api := router.Group("/api")

	// Sistem endpoint'leri
	api.GET("/health", handlers.HealthCheck)
	api.GET("/info", handlers.GetAPIInfo)

	// Oyun durumu endpoint'leri
	api.POST("/game-state", handlers.SaveGameState)
	api.GET("/game-state/:userId", handlers.LoadGameState)
	api.DELETE("/game-state/:userId", handlers.DeleteGameState)

	// Yüksek skor endpoint'leri
	api.POST("/highscores", handlers.SaveHighscore)
	api.GET("/highscores", handlers.GetHighscores)
	api.GET("/highscores/user/:userId", handlers.GetUserHighscore)

	// Root endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Balatro Game Backend API",
			"version": "1.0.0",
			"status":  "running",
		})
	})

	// 404 handler
	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{
			"error":   "Endpoint bulunamadı",
			"path":    c.Request.URL.Path,
			"method":  c.Request.Method,
			"message": "Geçerli endpoint'ler için /api/info adresini ziyaret edin",
		})
	})
}