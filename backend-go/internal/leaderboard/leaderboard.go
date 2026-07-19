package leaderboard

import (
	"sort"

	"gorm.io/gorm"

	"score-predictor-backend/internal/gen/api"
	"score-predictor-backend/internal/models"
	"score-predictor-backend/internal/scoring"
)

type totals struct {
	userID           int64
	name             string
	exactScorePoints int
	outcomePoints    int
	topScorerPoints  int
	goalBonusPoints  int
	total            int
}

func Get(db *gorm.DB) ([]api.LeaderboardEntry, error) {
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		return nil, err
	}

	userByID := make(map[int64]models.User, len(users))
	entries := make(map[int64]*totals, len(users))
	for _, u := range users {
		userByID[u.ID] = u
		entries[u.ID] = &totals{userID: u.ID, name: u.Name}
	}

	var finishedMatches []models.Match
	if err := db.Where("status = ?", "finished").Find(&finishedMatches).Error; err != nil {
		return nil, err
	}

	if len(finishedMatches) > 0 {
		matchByID := make(map[int64]models.Match, len(finishedMatches))
		matchIDs := make([]int64, len(finishedMatches))
		for i, m := range finishedMatches {
			matchByID[m.ID] = m
			matchIDs[i] = m.ID
		}

		var predictions []models.MatchPrediction
		if err := db.Where("match_id IN ?", matchIDs).Find(&predictions).Error; err != nil {
			return nil, err
		}

		for _, p := range predictions {
			match, ok := matchByID[p.MatchID]
			if !ok || match.HomeScore == nil || match.AwayScore == nil ||
				match.TopScorerName == nil || match.TopScorerGoals == nil {
				continue
			}

			user, ok := userByID[p.UserID]
			if !ok {
				continue
			}

			breakdown := scoring.ScorePrediction(
				scoring.Prediction{
					PredictedHomeScore: p.PredictedHomeScore,
					PredictedAwayScore: p.PredictedAwayScore,
					PredictedTopScorer: user.TournamentTopScorer,
				},
				scoring.MatchResult{
					HomeScore:      *match.HomeScore,
					AwayScore:      *match.AwayScore,
					TopScorerName:  match.TopScorerName,
					TopScorerGoals: match.TopScorerGoals,
				},
			)

			entry := entries[p.UserID]
			entry.exactScorePoints += breakdown.ExactScorePoints
			entry.outcomePoints += breakdown.OutcomePoints
			entry.topScorerPoints += breakdown.TopScorerPoints
			entry.goalBonusPoints += breakdown.GoalBonusPoints
			entry.total += breakdown.Total
		}
	}

	rows := make([]*totals, 0, len(entries))
	for _, e := range entries {
		rows = append(rows, e)
	}

	if len(finishedMatches) == 0 {
		sort.Slice(rows, func(i, j int) bool { return rows[i].name < rows[j].name })
	} else {
		sort.Slice(rows, func(i, j int) bool { return rows[i].total > rows[j].total })
	}

	result := make([]api.LeaderboardEntry, 0, len(rows))
	for _, r := range rows {
		result = append(result, api.LeaderboardEntry{
			UserId:           &r.userID,
			Name:             &r.name,
			ExactScorePoints: &r.exactScorePoints,
			OutcomePoints:    &r.outcomePoints,
			TopScorerPoints:  &r.topScorerPoints,
			GoalBonusPoints:  &r.goalBonusPoints,
			Total:            &r.total,
		})
	}

	return result, nil
}
