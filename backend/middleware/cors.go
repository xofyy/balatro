package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware CORS ayarlarını yapılandırır
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Environment'dan allowed origins'i al
		allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
		if allowedOrigins == "" {
			// Geliştirme ortamı için varsayılan değerler
			allowedOrigins = "http://localhost:3000,http://localhost:3001,http://localhost:3002"
		}

		// Origin kontrolü
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			origins := strings.Split(allowedOrigins, ",")
			for _, allowed := range origins {
				if strings.TrimSpace(allowed) == origin {
					c.Header("Access-Control-Allow-Origin", origin)
					break
				}
			}
		}

		// CORS başlıkları
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Header("Access-Control-Expose-Headers", "Content-Length")
		c.Header("Access-Control-Allow-Credentials", "true")

		// Preflight request'ler için
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}