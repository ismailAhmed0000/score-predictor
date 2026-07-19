package handlers

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"score-predictor-backend/internal/gen/api"
	"score-predictor-backend/internal/models"
)

type PredictionsHandler struct {
	DB *gorm.DB
}

func toPredictionDTO(p models.MatchPrediction) api.Prediction {
	return api.Prediction{
		Id:                 ptr(p.ID),
		UserId:             ptr(p.UserID),
		MatchId:            ptr(p.MatchID),
		PredictedHomeScore: ptr(p.PredictedHomeScore),
		PredictedAwayScore: ptr(p.PredictedAwayScore),
		PredictedTopScorer: p.PredictedTopScorer,
		CreatedAt:          ptr(p.CreatedAt),
		UpdatedAt:          ptr(p.UpdatedAt),
	}
}

func (h *PredictionsHandler) getOpenMatchOrError(matchID int64) error {
	var match models.Match
	if err := h.DB.Select("kickoff_at").First(&match, matchID).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Match not found")
	}
	if !time.Now().Before(match.KickoffAt) {
		return fiber.NewError(fiber.StatusBadRequest, "Match already started")
	}
	return nil
}

func (h *PredictionsHandler) GetMyPrediction(c *fiber.Ctx, matchId api.MatchId) error {
	userID := c.Locals("userID").(int64)

	var p models.MatchPrediction
	err := h.DB.Where("match_id = ? AND user_id = ?", matchId, userID).First(&p).Error
	if err != nil {
		return c.JSON(nil)
	}
	return c.JSON(toPredictionDTO(p))
}

func (h *PredictionsHandler) CreatePrediction(c *fiber.Ctx, matchId api.MatchId) error {
	userID := c.Locals("userID").(int64)

	var req api.PredictionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.getOpenMatchOrError(matchId); err != nil {
		return err
	}

	p := models.MatchPrediction{
		UserID:             userID,
		MatchID:            matchId,
		PredictedHomeScore: req.PredictedHomeScore,
		PredictedAwayScore: req.PredictedAwayScore,
		PredictedTopScorer: req.PredictedTopScorer,
	}
	if err := h.DB.Create(&p).Error; err != nil {
		return fiber.NewError(fiber.StatusConflict, "Prediction already exists for this match")
	}

	return c.JSON(toPredictionDTO(p))
}

func (h *PredictionsHandler) UpdatePrediction(c *fiber.Ctx, matchId api.MatchId) error {
	userID := c.Locals("userID").(int64)

	var req api.PredictionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.getOpenMatchOrError(matchId); err != nil {
		return err
	}

	var p models.MatchPrediction
	err := h.DB.Where("match_id = ? AND user_id = ?", matchId, userID).First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fiber.NewError(fiber.StatusNotFound, "Prediction not found")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load prediction")
	}

	p.PredictedHomeScore = req.PredictedHomeScore
	p.PredictedAwayScore = req.PredictedAwayScore
	p.PredictedTopScorer = req.PredictedTopScorer
	p.UpdatedAt = time.Now()

	if err := h.DB.Save(&p).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to update prediction")
	}

	return c.JSON(toPredictionDTO(p))
}
