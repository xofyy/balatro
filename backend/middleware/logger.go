package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggerMiddleware özel logging middleware'i
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Başlangıç zamanı
		start := time.Now()

		// Request'i işle
		c.Next()

		// İşlem süresi
		latency := time.Since(start)

		// Request bilgilerini logla
		log.Printf(
			"[%s] %s %s %d %v %s",
			c.Request.Method,
			c.Request.RequestURI,
			c.ClientIP(),
			c.Writer.Status(),
			latency,
			c.Request.UserAgent(),
		)
	}
}