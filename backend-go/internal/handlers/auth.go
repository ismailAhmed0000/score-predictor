package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"score-predictor-backend/internal/auth"
	"score-predictor-backend/internal/gen/api"
	"score-predictor-backend/internal/models"
)

type AuthHandler struct {
	DB          *gorm.DB
	JWTSecret   string
	ExpiresDays int
}

func (h *AuthHandler) LoginUser(c *fiber.Ctx) error {
	var req api.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	var user models.User
	if err := h.DB.Where("name = ?", req.Name).First(&user).Error; err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Invalid name or PIN")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PinHash), []byte(req.Pin)); err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Invalid name or PIN")
	}

	token, err := auth.IssueToken(h.JWTSecret, user.ID, user.Name, user.IsAdmin, h.ExpiresDays)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to issue token")
	}

	return c.JSON(api.LoginResponse{
		AccessToken: ptr(token),
		User: &api.AuthUser{
			Id:      ptr(user.ID),
			Name:    ptr(user.Name),
			IsAdmin: ptr(user.IsAdmin),
		},
	})
}

func (h *AuthHandler) GetTournamentTopScorer(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)

	var user models.User
	if err := h.DB.Select("tournament_top_scorer").First(&user, userID).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "User not found")
	}

	return c.JSON(api.TournamentTopScorerResponse{TournamentTopScorer: user.TournamentTopScorer})
}

func (h *AuthHandler) SetTournamentTopScorer(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)

	var req api.SetTournamentTopScorerRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	trimmed := strings.TrimSpace(req.TournamentTopScorer)
	if trimmed == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Top scorer name is required")
	}

	result := h.DB.Model(&models.User{}).Where("id = ?", userID).Update("tournament_top_scorer", trimmed)
	if result.Error != nil || result.RowsAffected == 0 {
		return fiber.NewError(fiber.StatusNotFound, "User not found")
	}

	return c.JSON(api.TournamentTopScorerResponse{TournamentTopScorer: &trimmed})
}
