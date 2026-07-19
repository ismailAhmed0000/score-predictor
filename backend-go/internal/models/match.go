package models

import "time"

type Match struct {
	ID             int64     `gorm:"column:id;primaryKey" json:"id"`
	HomeTeamID     int64     `gorm:"column:home_team_id;not null" json:"homeTeamId"`
	AwayTeamID     int64     `gorm:"column:away_team_id;not null" json:"awayTeamId"`
	KickoffAt      time.Time `gorm:"column:kickoff_at;not null" json:"kickoffAt"`
	HomeScore      *int      `gorm:"column:home_score" json:"homeScore"`
	AwayScore      *int      `gorm:"column:away_score" json:"awayScore"`
	TopScorerName  *string   `gorm:"column:top_scorer_name" json:"topScorerName"`
	TopScorerGoals *int      `gorm:"column:top_scorer_goals" json:"topScorerGoals"`
	Status         string    `gorm:"column:status;not null;default:scheduled" json:"status"`
	CreatedAt      time.Time `gorm:"column:created_at" json:"createdAt"`

	HomeTeam Team `gorm:"foreignKey:HomeTeamID" json:"-"`
	AwayTeam Team `gorm:"foreignKey:AwayTeamID" json:"-"`
}

func (Match) TableName() string {
	return "matches"
}
