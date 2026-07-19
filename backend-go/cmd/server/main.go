package main

import (
	"log"
	"os"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"score-predictor-backend/internal/auth"
	"score-predictor-backend/internal/db"
	"score-predictor-backend/internal/gen/api"
	"score-predictor-backend/internal/handlers"
)

func main() {
	conn, err := db.NewConnection(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

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

	server := handlers.NewServer(conn, jwtSecret, expiresDays)
	wrapper := api.ServerInterfaceWrapper{Handler: server}

	// Public.
	app.Post("/auth/login", wrapper.LoginUser)

	// Authenticated.
	authGroup := app.Group("/auth", auth.JWTAuth(jwtSecret))
	authGroup.Get("/me/tournament-top-scorer", wrapper.GetTournamentTopScorer)
	authGroup.Put("/me/tournament-top-scorer", wrapper.SetTournamentTopScorer)

	matchesGroup := app.Group("/matches", auth.JWTAuth(jwtSecret))
	matchesGroup.Get("/", wrapper.ListMatches)
	matchesGroup.Get("/:matchId/predictions/me", wrapper.GetMyPrediction)
	matchesGroup.Post("/:matchId/predictions", wrapper.CreatePrediction)
	matchesGroup.Put("/:matchId/predictions", wrapper.UpdatePrediction)

	app.Get("/leaderboard", auth.JWTAuth(jwtSecret), wrapper.GetLeaderboard)

	// Authenticated + admin.
	adminGroup := app.Group("/admin", auth.JWTAuth(jwtSecret), auth.RequireAdmin)
	adminGroup.Get("/fixtures", wrapper.ListFixtures)
	adminGroup.Post("/fixtures", wrapper.CreateFixture)
	adminGroup.Patch("/fixtures/:matchId/result", wrapper.SetFixtureResult)
	adminGroup.Patch("/fixtures/:matchId/reopen", wrapper.ReopenFixture)
	adminGroup.Delete("/fixtures/:matchId", wrapper.DeleteFixture)
	adminGroup.Get("/participants", wrapper.ListParticipants)
	adminGroup.Post("/participants", wrapper.CreateParticipant)
	adminGroup.Delete("/participants/:userId", wrapper.DeleteParticipant)
	adminGroup.Get("/predictions", wrapper.ListAllPredictions)
	adminGroup.Get("/top-scorer-picks", wrapper.ListTopScorerPicks)
	adminGroup.Get("/export/standings.csv", wrapper.ExportStandingsCsv)
	adminGroup.Get("/export/pins.csv", wrapper.ExportPinsCsv)
	adminGroup.Post("/recalculate", wrapper.RecalculateLeaderboard)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Fatal(app.Listen(":" + port))
}
