package db

import (
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func usesTransactionPooler(connString string) bool {
	return strings.Contains(connString, ":6543") ||
		strings.Contains(connString, "pooler.supabase.com")
}

// NewConnection opens a GORM/Postgres connection. PreferSimpleProtocol is
// forced on for Supabase's transaction pooler, which does not support
// prepared statements across pooled connections.
func NewConnection(connString string) (*gorm.DB, error) {
	return gorm.Open(postgres.New(postgres.Config{
		DSN:                  connString,
		PreferSimpleProtocol: usesTransactionPooler(connString),
	}), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
}
