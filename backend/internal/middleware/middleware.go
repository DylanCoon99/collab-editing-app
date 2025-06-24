package middleware


import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/DylanCoon99/collab-editing-app/backend/internal/utils"
)



func JwtAuthMiddleware() gin.HandlerFunc {

	return func(c *gin.Context) {
		err := utils.TokenValid(c)
		if err != nil {
			c.String(http.StatusUnauthorized, "Unauthorized")
			c.Abort()
			return
		}
		c.Next()
	}
}