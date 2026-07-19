package handlers

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"score-predictor-backend/internal/gen/api"
	"score-predictor-backend/internal/models"
)

type MatchesHandler struct {
	DB *gorm.DB
}

func toMatchDTO(m models.Match) api.Match {
	return api.Match{
		Id:             ptr(m.ID),
		KickoffAt:      ptr(m.KickoffAt),
		HomeScore:      m.HomeScore,
		AwayScore:      m.AwayScore,
		TopScorerName:  m.TopScorerName,
		TopScorerGoals: m.TopScorerGoals,
		Status:         ptr(m.Status),
		HomeTeam:       ptr(m.HomeTeam.Name),
		AwayTeam:       ptr(m.AwayTeam.Name),
	}
}

func (h *MatchesHandler) ListMatches(c *fiber.Ctx) error {
	var matches []models.Match
	if err := h.DB.Preload("HomeTeam").Preload("AwayTeam").Find(&matches).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load matches")
	}

	result := make([]api.Match, 0, len(matches))
	for _, m := range matches {
		result = append(result, toMatchDTO(m))
	}

	return c.JSON(result)
}
