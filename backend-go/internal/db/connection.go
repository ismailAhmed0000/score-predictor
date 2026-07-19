package db

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func isSupabaseURL(connString string) bool {
	return strings.Contains(connString, "supabase.co") ||
		strings.Contains(connString, "pooler.supabase.com")
}

func NewPool(ctx context.Context, connString string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, err
	}

	if isSupabaseURL(connString) {
		cfg.ConnConfig.TLSConfig = nil 
	}

	return pgxpool.NewWithConfig(ctx, cfg)
}
