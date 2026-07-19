package handlers

import "gorm.io/gorm"

// Server implements the generated api.ServerInterface by composing the
// per-domain handlers. Each embedded handler contributes the methods for
// its slice of the OpenAPI spec.
type Server struct {
	*AuthHandler
	*MatchesHandler
	*PredictionsHandler
	*LeaderboardHandler
	*AdminHandler
}

func NewServer(db *gorm.DB, jwtSecret string, expiresDays int) *Server {
	return &Server{
		AuthHandler:        &AuthHandler{DB: db, JWTSecret: jwtSecret, ExpiresDays: expiresDays},
		MatchesHandler:     &MatchesHandler{DB: db},
		PredictionsHandler: &PredictionsHandler{DB: db},
		LeaderboardHandler: &LeaderboardHandler{DB: db},
		AdminHandler:       &AdminHandler{DB: db},
	}
}
