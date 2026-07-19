package auth

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

func JWTAuth(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			return fiber.NewError(fiber.StatusUnauthorized, "Missing or invalid Authorization header")
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")
		claims, err := ParseToken(secret, tokenString)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "Invalid or expired token")
		}

		c.Locals("userID", claims.Sub)
		c.Locals("userName", claims.Name)
		c.Locals("isAdmin", claims.IsAdmin)
		return c.Next()
	}
}

func RequireAdmin(c *fiber.Ctx) error {
	isAdmin, _ := c.Locals("isAdmin").(bool)
	if !isAdmin {
		return fiber.NewError(fiber.StatusForbidden, "Admin access required")
	}
	return c.Next()
}
