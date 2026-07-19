package handlers

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"score-predictor-backend/internal/leaderboard"
)

type LeaderboardHandler struct {
	DB *gorm.DB
}

func (h *LeaderboardHandler) GetLeaderboard(c *fiber.Ctx) error {
	entries, err := leaderboard.Get(h.DB)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to compute leaderboard")
	}
	return c.JSON(entries)
}
