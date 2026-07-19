package models

import "time"

type MatchPrediction struct {
	ID                 int64     `gorm:"column:id;primaryKey" json:"id"`
	UserID             int64     `gorm:"column:user_id;not null;uniqueIndex:uq_user_match" json:"userId"`
	MatchID            int64     `gorm:"column:match_id;not null;uniqueIndex:uq_user_match" json:"matchId"`
	PredictedHomeScore int       `gorm:"column:predicted_home_score;not null" json:"predictedHomeScore"`
	PredictedAwayScore int       `gorm:"column:predicted_away_score;not null" json:"predictedAwayScore"`
	PredictedTopScorer *string   `gorm:"column:predicted_top_scorer" json:"predictedTopScorer"`
	CreatedAt          time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt          time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

func (MatchPrediction) TableName() string {
	return "match_predictions"
}
