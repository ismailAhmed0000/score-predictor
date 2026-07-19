package models

import "time"

type User struct {
	ID                  int64     `db:"id" json:"id"`
	Name                string    `db:"name" json:"name"`
	PinHash             string    `db:"pin_hash" json:"-"`
	IsAdmin             bool      `db:"is_admin" json:"isAdmin"`
	LastIssuedPin       *string   `db:"last_issued_pin" json:"-"`
	TournamentTopScorer *string   `db:"tournament_top_scorer" json:"tournamentTopScorer"`
	CreatedAt           time.Time `db:"created_at" json:"createdAt"`
}
