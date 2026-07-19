package handlers

import (
	"errors"
	"fmt"
	"math/rand"
	"sort"
	"strings"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"score-predictor-backend/internal/gen/api"
	"score-predictor-backend/internal/leaderboard"
	"score-predictor-backend/internal/models"
)

type AdminHandler struct {
	DB *gorm.DB
}

func (h *AdminHandler) listFixtures() ([]api.Fixture, error) {
	var matches []models.Match
	if err := h.DB.Preload("HomeTeam").Preload("AwayTeam").Order("kickoff_at ASC").Find(&matches).Error; err != nil {
		return nil, err
	}

	result := make([]api.Fixture, 0, len(matches))
	for _, m := range matches {
		var count int64
		if err := h.DB.Model(&models.MatchPrediction{}).Where("match_id = ?", m.ID).Count(&count).Error; err != nil {
			return nil, err
		}
		predictionCount := int(count)
		result = append(result, api.Fixture{
			Id:              ptr(m.ID),
			KickoffAt:       ptr(m.KickoffAt),
			HomeScore:       m.HomeScore,
			AwayScore:       m.AwayScore,
			TopScorerName:   m.TopScorerName,
			TopScorerGoals:  m.TopScorerGoals,
			Status:          ptr(m.Status),
			HomeTeam:        ptr(m.HomeTeam.Name),
			AwayTeam:        ptr(m.AwayTeam.Name),
			PredictionCount: &predictionCount,
		})
	}
	return result, nil
}

func (h *AdminHandler) ListFixtures(c *fiber.Ctx) error {
	fixtures, err := h.listFixtures()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load fixtures")
	}
	return c.JSON(fixtures)
}

func (h *AdminHandler) findOrCreateTeam(name string) (models.Team, error) {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return models.Team{}, fiber.NewError(fiber.StatusBadRequest, "Team name is required")
	}

	var team models.Team
	err := h.DB.Where("name = ?", trimmed).First(&team).Error
	if err == nil {
		return team, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Team{}, err
	}

	team = models.Team{Name: trimmed}
	if err := h.DB.Create(&team).Error; err != nil {
		return models.Team{}, err
	}
	return team, nil
}

func (h *AdminHandler) CreateFixture(c *fiber.Ctx) error {
	var req api.CreateFixtureRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	home, err := h.findOrCreateTeam(req.HomeTeam)
	if err != nil {
		return err
	}
	away, err := h.findOrCreateTeam(req.AwayTeam)
	if err != nil {
		return err
	}
	if home.ID == away.ID {
		return fiber.NewError(fiber.StatusBadRequest, "Home and away teams must be different")
	}

	match := models.Match{
		HomeTeamID: home.ID,
		AwayTeamID: away.ID,
		KickoffAt:  req.KickoffAt,
		Status:     "scheduled",
	}
	if err := h.DB.Create(&match).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to create fixture")
	}

	fixtures, err := h.listFixtures()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load fixture")
	}
	for _, f := range fixtures {
		if *f.Id == match.ID {
			return c.JSON(f)
		}
	}
	return fiber.NewError(fiber.StatusInternalServerError, "Fixture not found after creation")
}

func (h *AdminHandler) SetFixtureResult(c *fiber.Ctx, matchId api.MatchId) error {
	var req api.SetFixtureResultRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	var match models.Match
	if err := h.DB.First(&match, matchId).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Match not found")
	}

	topScorerName := "Unknown"
	if req.TopScorerName != nil && strings.TrimSpace(*req.TopScorerName) != "" {
		topScorerName = strings.TrimSpace(*req.TopScorerName)
	} else if match.TopScorerName != nil {
		topScorerName = *match.TopScorerName
	}

	topScorerGoals := 0
	if req.TopScorerGoals != nil {
		topScorerGoals = *req.TopScorerGoals
	} else if match.TopScorerGoals != nil {
		topScorerGoals = *match.TopScorerGoals
	}

	updates := map[string]interface{}{
		"home_score":       req.HomeScore,
		"away_score":       req.AwayScore,
		"top_scorer_name":  topScorerName,
		"top_scorer_goals": topScorerGoals,
		"status":           "finished",
	}
	if err := h.DB.Model(&match).Updates(updates).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to update result")
	}

	fixtures, err := h.listFixtures()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load fixture")
	}
	for _, f := range fixtures {
		if *f.Id == matchId {
			return c.JSON(f)
		}
	}
	return fiber.NewError(fiber.StatusNotFound, "Fixture not found")
}

func (h *AdminHandler) ReopenFixture(c *fiber.Ctx, matchId api.MatchId) error {
	result := h.DB.Model(&models.Match{}).Where("id = ?", matchId).Updates(map[string]interface{}{
		"home_score":       nil,
		"away_score":       nil,
		"top_scorer_name":  nil,
		"top_scorer_goals": nil,
		"status":           "scheduled",
	})
	if result.Error != nil || result.RowsAffected == 0 {
		return fiber.NewError(fiber.StatusNotFound, "Match not found")
	}

	fixtures, err := h.listFixtures()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load fixture")
	}
	for _, f := range fixtures {
		if *f.Id == matchId {
			return c.JSON(f)
		}
	}
	return fiber.NewError(fiber.StatusNotFound, "Fixture not found")
}

func (h *AdminHandler) DeleteFixture(c *fiber.Ctx, matchId api.MatchId) error {
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("match_id = ?", matchId).Delete(&models.MatchPrediction{}).Error; err != nil {
			return err
		}
		result := tx.Delete(&models.Match{}, matchId)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fiber.NewError(fiber.StatusNotFound, "Match not found")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to delete fixture")
	}

	return c.JSON(api.DeletedResponse{Deleted: ptr(true)})
}

func toParticipantDTO(u models.User) api.Participant {
	return api.Participant{
		Id:                  ptr(u.ID),
		Name:                ptr(u.Name),
		IsAdmin:             ptr(u.IsAdmin),
		TournamentTopScorer: u.TournamentTopScorer,
		CreatedAt:           ptr(u.CreatedAt),
	}
}

func (h *AdminHandler) ListParticipants(c *fiber.Ctx) error {
	var users []models.User
	if err := h.DB.Where("is_admin = ?", false).Order("name").Find(&users).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load participants")
	}

	result := make([]api.Participant, 0, len(users))
	for _, u := range users {
		result = append(result, toParticipantDTO(u))
	}
	return c.JSON(result)
}

func (h *AdminHandler) CreateParticipant(c *fiber.Ctx) error {
	var req api.CreateParticipantRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Name is required")
	}

	pin := ""
	if req.Pin != nil {
		pin = strings.TrimSpace(*req.Pin)
	}
	if pin == "" {
		pin = fmt.Sprintf("%04d", rand.Intn(9000)+1000)
	}
	if len(pin) != 4 || !isDigits(pin) {
		return fiber.NewError(fiber.StatusBadRequest, "PIN must be 4 digits")
	}

	pinHash, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to hash PIN")
	}

	user := models.User{
		Name:          name,
		PinHash:       string(pinHash),
		LastIssuedPin: &pin,
		IsAdmin:       false,
	}
	if err := h.DB.Create(&user).Error; err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Participant already exists")
	}

	participant := toParticipantDTO(user)
	return c.JSON(api.CreateParticipantResponse{User: &participant, Pin: &pin})
}

func isDigits(s string) bool {
	for _, r := range s {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func (h *AdminHandler) DeleteParticipant(c *fiber.Ctx, userId api.UserId) error {
	var user models.User
	if err := h.DB.First(&user, userId).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Participant not found")
	}
	if user.IsAdmin {
		return fiber.NewError(fiber.StatusBadRequest, "Cannot delete an admin user")
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userId).Delete(&models.MatchPrediction{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.User{}, userId).Error
	})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to delete participant")
	}

	return c.JSON(api.DeletedResponse{Deleted: ptr(true)})
}

func (h *AdminHandler) ListAllPredictions(c *fiber.Ctx) error {
	var predictions []models.MatchPrediction
	if err := h.DB.Find(&predictions).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load predictions")
	}

	var users []models.User
	if err := h.DB.Find(&users).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load predictions")
	}
	userByID := make(map[int64]models.User, len(users))
	for _, u := range users {
		userByID[u.ID] = u
	}

	var matches []models.Match
	if err := h.DB.Preload("HomeTeam").Preload("AwayTeam").Find(&matches).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load predictions")
	}
	matchByID := make(map[int64]models.Match, len(matches))
	for _, m := range matches {
		matchByID[m.ID] = m
	}

	result := make([]api.AdminPrediction, 0, len(predictions))
	for _, p := range predictions {
		user, ok := userByID[p.UserID]
		if !ok {
			continue
		}
		match, ok := matchByID[p.MatchID]
		if !ok {
			continue
		}
		result = append(result, api.AdminPrediction{
			Id:                 ptr(p.ID),
			UserId:             ptr(p.UserID),
			UserName:           ptr(user.Name),
			MatchId:            ptr(p.MatchID),
			HomeTeam:           ptr(match.HomeTeam.Name),
			AwayTeam:           ptr(match.AwayTeam.Name),
			KickoffAt:          ptr(match.KickoffAt),
			MatchStatus:        ptr(match.Status),
			PredictedHomeScore: ptr(p.PredictedHomeScore),
			PredictedAwayScore: ptr(p.PredictedAwayScore),
			UpdatedAt:          ptr(p.UpdatedAt),
		})
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].KickoffAt.Equal(*result[j].KickoffAt) {
			return *result[i].UserName < *result[j].UserName
		}
		return result[i].KickoffAt.Before(*result[j].KickoffAt)
	})

	return c.JSON(result)
}

func (h *AdminHandler) ListTopScorerPicks(c *fiber.Ctx) error {
	var users []models.User
	if err := h.DB.Where("is_admin = ?", false).Order("name").Find(&users).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load top scorer picks")
	}

	result := make([]api.TopScorerPick, 0, len(users))
	for _, u := range users {
		result = append(result, api.TopScorerPick{Id: ptr(u.ID), Name: ptr(u.Name), TournamentTopScorer: u.TournamentTopScorer})
	}
	return c.JSON(result)
}

func csvEscape(value string) string {
	if strings.ContainsAny(value, ",\"\n") {
		return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
	}
	return value
}

func (h *AdminHandler) ExportStandingsCsv(c *fiber.Ctx) error {
	entries, err := leaderboard.Get(h.DB)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to compute standings")
	}

	var sb strings.Builder
	sb.WriteString("Rank,Name,Match,Scorer,Total")
	for i, e := range entries {
		matchPts := *e.ExactScorePoints + *e.OutcomePoints
		scorerPts := *e.TopScorerPoints + *e.GoalBonusPoints
		sb.WriteString(fmt.Sprintf("\n%d,%s,%d,%d,%d", i+1, csvEscape(*e.Name), matchPts, scorerPts, *e.Total))
	}

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", `attachment; filename="standings.csv"`)
	return c.SendString(sb.String())
}

func (h *AdminHandler) ExportPinsCsv(c *fiber.Ctx) error {
	var users []models.User
	if err := h.DB.Where("is_admin = ?", false).Order("name").Find(&users).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to load pins")
	}

	var sb strings.Builder
	sb.WriteString("Name,PIN")
	for _, u := range users {
		pinValue := "—"
		if u.LastIssuedPin != nil {
			pinValue = *u.LastIssuedPin
		}
		sb.WriteString(fmt.Sprintf("\n%s,%s", csvEscape(u.Name), csvEscape(pinValue)))
	}

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", `attachment; filename="pins.csv"`)
	return c.SendString(sb.String())
}

func (h *AdminHandler) RecalculateLeaderboard(c *fiber.Ctx) error {
	entries, err := leaderboard.Get(h.DB)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to recalculate")
	}
	return c.JSON(entries)
}
