package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"score-predictor-backend/internal/auth"
)

type AuthHandler struct {
	Pool        *pgxpool.Pool
	JWTSecret   string
	ExpiresDays int
}

type loginRequest struct {
	Name string `json:"name"`
	Pin  string `json:"pin"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	var (
		id       int64
		name     string
		pinHash  string
		isAdmin  bool
	)
	err := h.Pool.QueryRow(context.Background(),
		`SELECT id, name, pin_hash, is_admin FROM users WHERE name = $1`,
		req.Name,
	).Scan(&id, &name, &pinHash, &isAdmin)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Invalid name or PIN")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(pinHash), []byte(req.Pin)); err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Invalid name or PIN")
	}

	token, err := auth.IssueToken(h.JWTSecret, id, name, isAdmin, h.ExpiresDays)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to issue token")
	}

	return c.JSON(fiber.Map{
		"accessToken": token,
		"user": fiber.Map{
			"id":      id,
			"name":    name,
			"isAdmin": isAdmin,
		},
	})
}

func (h *AuthHandler) GetTournamentTopScorer(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)

	var topScorer *string
	err := h.Pool.QueryRow(context.Background(),
		`SELECT tournament_top_scorer FROM users WHERE id = $1`,
		userID,
	).Scan(&topScorer)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "User not found")
	}

	return c.JSON(fiber.Map{"tournamentTopScorer": topScorer})
}

type setTopScorerRequest struct {
	TournamentTopScorer string `json:"tournamentTopScorer"`
}

func (h *AuthHandler) SetTournamentTopScorer(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)

	var req setTopScorerRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	trimmed := trimSpace(req.TournamentTopScorer)
	if trimmed == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Top scorer name is required")
	}

	var updated string
	err := h.Pool.QueryRow(context.Background(),
		`UPDATE users SET tournament_top_scorer = $1 WHERE id = $2 RETURNING tournament_top_scorer`,
		trimmed, userID,
	).Scan(&updated)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "User not found")
	}

	return c.JSON(fiber.Map{"tournamentTopScorer": updated})
}

func trimSpace(s string) string {
	start, end := 0, len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n') {
		end--
	}
	return s[start:end]
}
