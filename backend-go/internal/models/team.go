package models

import "time"

type Team struct {
	ID        int64     `gorm:"column:id;primaryKey" json:"id"`
	Name      string    `gorm:"column:name;unique;not null" json:"name"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
}

func (Team) TableName() string {
	return "teams"
}
