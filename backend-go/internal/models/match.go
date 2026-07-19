package models

import "time"

type Match struct {
	ID             int64     `db:"id" json:"id"`
	HomeTeamID     int64     `db:"home_team_id" json:"homeTeamId"`
	AwayTeamID     int64     `db:"away_team_id" json:"awayTeamId"`
	KickoffAt      time.Time `db:"kickoff_at" json:"kickoffAt"`
	HomeScore      *int      `db:"home_score" json:"homeScore"`
	AwayScore      *int      `db:"away_score" json:"awayScore"`
	TopScorerName  *string   `db:"top_scorer_name" json:"topScorerName"`
	TopScorerGoals *int      `db:"top_scorer_goals" json:"topScorerGoals"`
	Status         string    `db:"status" json:"status"`
	CreatedAt      time.Time `db:"created_at" json:"createdAt"`
}
