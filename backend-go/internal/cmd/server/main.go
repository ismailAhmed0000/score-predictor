package main

import (
	"context"
	"log"
	"os"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"score-predictor-backend/internal/auth"
	"score-predictor-backend/internal/db"
	"score-predictor-backend/internal/handlers"
)

func main() {
	ctx := context.Background()

	pool, err := db.NewPool(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	jwtSecret := os.Getenv("JWT_SECRET")
	expiresDays, err := strconv.Atoi(os.Getenv("JWT_EXPIRES_DAYS"))
	if err != nil {
		expiresDays = 30
	}

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: os.Getenv("FRONTEND_URL"),
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	authHandler := &handlers.AuthHandler{
		Pool:        pool,
		JWTSecret:   jwtSecret,
		ExpiresDays: expiresDays,
	}

	app.Post("/auth/login", authHandler.Login)

	authGroup := app.Group("/auth", auth.JWTAuth(jwtSecret))
	authGroup.Get("/me/tournament-top-scorer", authHandler.GetTournamentTopScorer)
	authGroup.Put("/me/tournament-top-scorer", authHandler.SetTournamentTopScorer)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Fatal(app.Listen(":" + port))
}
