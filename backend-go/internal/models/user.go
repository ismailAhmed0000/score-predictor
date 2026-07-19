package models

import "time"

type User struct {
	ID                  int64     `gorm:"column:id;primaryKey" json:"id"`
	Name                string    `gorm:"column:name;unique;not null" json:"name"`
	PinHash             string    `gorm:"column:pin_hash;not null" json:"-"`
	IsAdmin             bool      `gorm:"column:is_admin;not null;default:false" json:"isAdmin"`
	LastIssuedPin       *string   `gorm:"column:last_issued_pin" json:"-"`
	TournamentTopScorer *string   `gorm:"column:tournament_top_scorer" json:"tournamentTopScorer"`
	CreatedAt           time.Time `gorm:"column:created_at" json:"createdAt"`
}

func (User) TableName() string {
	return "users"
}
