package models

import "time"

type MatchPrediction struct {
	ID                 int64     `db:"id" json:"id"`
	UserID             int64     `db:"user_id" json:"userId"`
	MatchID            int64     `db:"match_id" json:"matchId"`
	PredictedHomeScore int       `db:"predicted_home_score" json:"predictedHomeScore"`
	PredictedAwayScore int       `db:"predicted_away_score" json:"predictedAwayScore"`
	PredictedTopScorer *string   `db:"predicted_top_scorer" json:"predictedTopScorer"`
	CreatedAt          time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt          time.Time `db:"updated_at" json:"updatedAt"`
}
