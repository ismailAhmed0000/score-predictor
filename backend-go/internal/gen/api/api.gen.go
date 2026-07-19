package api

import (
	"bytes"
	"compress/flate"
	"encoding/base64"
	"fmt"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/gofiber/fiber/v2"
	"github.com/oapi-codegen/runtime"
)

type AdminPrediction struct {
	AwayTeam           *string    `json:"awayTeam,omitempty"`
	HomeTeam           *string    `json:"homeTeam,omitempty"`
	Id                 *int64     `json:"id,omitempty"`
	KickoffAt          *time.Time `json:"kickoffAt,omitempty"`
	MatchId            *int64     `json:"matchId,omitempty"`
	MatchStatus        *string    `json:"matchStatus,omitempty"`
	PredictedAwayScore *int       `json:"predictedAwayScore,omitempty"`
	PredictedHomeScore *int       `json:"predictedHomeScore,omitempty"`
	UpdatedAt          *time.Time `json:"updatedAt,omitempty"`
	UserId             *int64     `json:"userId,omitempty"`
	UserName           *string    `json:"userName,omitempty"`
}

type AuthUser struct {
	Id      *int64  `json:"id,omitempty"`
	IsAdmin *bool   `json:"isAdmin,omitempty"`
	Name    *string `json:"name,omitempty"`
}

type CreateFixtureRequest struct {
	AwayTeam  string    `json:"awayTeam"`
	HomeTeam  string    `json:"homeTeam"`
	KickoffAt time.Time `json:"kickoffAt"`
}

type CreateParticipantRequest struct {
	Name string  `json:"name"`
	Pin  *string `json:"pin,omitempty"`
}

type CreateParticipantResponse struct {
	Pin  *string      `json:"pin,omitempty"`
	User *Participant `json:"user,omitempty"`
}

type DeletedResponse struct {
	Deleted *bool `json:"deleted,omitempty"`
}

type Fixture struct {
	AwayScore       *int       `json:"awayScore,omitempty"`
	AwayTeam        *string    `json:"awayTeam,omitempty"`
	HomeScore       *int       `json:"homeScore,omitempty"`
	HomeTeam        *string    `json:"homeTeam,omitempty"`
	Id              *int64     `json:"id,omitempty"`
	KickoffAt       *time.Time `json:"kickoffAt,omitempty"`
	PredictionCount *int       `json:"predictionCount,omitempty"`
	Status          *string    `json:"status,omitempty"`
	TopScorerGoals  *int       `json:"topScorerGoals,omitempty"`
	TopScorerName   *string    `json:"topScorerName,omitempty"`
}

type LeaderboardEntry struct {
	ExactScorePoints *int    `json:"exactScorePoints,omitempty"`
	GoalBonusPoints  *int    `json:"goalBonusPoints,omitempty"`
	Name             *string `json:"name,omitempty"`
	OutcomePoints    *int    `json:"outcomePoints,omitempty"`
	TopScorerPoints  *int    `json:"topScorerPoints,omitempty"`
	Total            *int    `json:"total,omitempty"`
	UserId           *int64  `json:"userId,omitempty"`
}

type LoginRequest struct {
	Name string `json:"name"`
	Pin  string `json:"pin"`
}

type LoginResponse struct {
	AccessToken *string   `json:"accessToken,omitempty"`
	User        *AuthUser `json:"user,omitempty"`
}

type Match struct {
	AwayScore      *int       `json:"awayScore,omitempty"`
	AwayTeam       *string    `json:"awayTeam,omitempty"`
	HomeScore      *int       `json:"homeScore,omitempty"`
	HomeTeam       *string    `json:"homeTeam,omitempty"`
	Id             *int64     `json:"id,omitempty"`
	KickoffAt      *time.Time `json:"kickoffAt,omitempty"`
	Status         *string    `json:"status,omitempty"`
	TopScorerGoals *int       `json:"topScorerGoals,omitempty"`
	TopScorerName  *string    `json:"topScorerName,omitempty"`
}

type Participant struct {
	CreatedAt           *time.Time `json:"createdAt,omitempty"`
	Id                  *int64     `json:"id,omitempty"`
	IsAdmin             *bool      `json:"isAdmin,omitempty"`
	Name                *string    `json:"name,omitempty"`
	TournamentTopScorer *string    `json:"tournamentTopScorer,omitempty"`
}

type Prediction struct {
	CreatedAt          *time.Time `json:"createdAt,omitempty"`
	Id                 *int64     `json:"id,omitempty"`
	MatchId            *int64     `json:"matchId,omitempty"`
	PredictedAwayScore *int       `json:"predictedAwayScore,omitempty"`
	PredictedHomeScore *int       `json:"predictedHomeScore,omitempty"`
	PredictedTopScorer *string    `json:"predictedTopScorer,omitempty"`
	UpdatedAt          *time.Time `json:"updatedAt,omitempty"`
	UserId             *int64     `json:"userId,omitempty"`
}

type PredictionRequest struct {
	PredictedAwayScore int     `json:"predictedAwayScore"`
	PredictedHomeScore int     `json:"predictedHomeScore"`
	PredictedTopScorer *string `json:"predictedTopScorer,omitempty"`
}

type SetFixtureResultRequest struct {
	AwayScore      int     `json:"awayScore"`
	HomeScore      int     `json:"homeScore"`
	TopScorerGoals *int    `json:"topScorerGoals,omitempty"`
	TopScorerName  *string `json:"topScorerName,omitempty"`
}

type SetTournamentTopScorerRequest struct {
	TournamentTopScorer string `json:"tournamentTopScorer"`
}

type TopScorerPick struct {
	Id                  *int64  `json:"id,omitempty"`
	Name                *string `json:"name,omitempty"`
	TournamentTopScorer *string `json:"tournamentTopScorer,omitempty"`
}

type TournamentTopScorerResponse struct {
	TournamentTopScorer *string `json:"tournamentTopScorer,omitempty"`
}

type MatchId = int64

type UserId = int64

type CreateFixtureJSONRequestBody = CreateFixtureRequest

type SetFixtureResultJSONRequestBody = SetFixtureResultRequest

type CreateParticipantJSONRequestBody = CreateParticipantRequest

type LoginUserJSONRequestBody = LoginRequest

type SetTournamentTopScorerJSONRequestBody = SetTournamentTopScorerRequest

type CreatePredictionJSONRequestBody = PredictionRequest

type UpdatePredictionJSONRequestBody = PredictionRequest

type ServerInterface interface {
	ExportPinsCsv(c *fiber.Ctx) error

	ExportStandingsCsv(c *fiber.Ctx) error

	ListFixtures(c *fiber.Ctx) error

	CreateFixture(c *fiber.Ctx) error

	DeleteFixture(c *fiber.Ctx, matchId MatchId) error

	ReopenFixture(c *fiber.Ctx, matchId MatchId) error

	SetFixtureResult(c *fiber.Ctx, matchId MatchId) error

	ListParticipants(c *fiber.Ctx) error

	CreateParticipant(c *fiber.Ctx) error

	DeleteParticipant(c *fiber.Ctx, userId UserId) error

	ListAllPredictions(c *fiber.Ctx) error

	RecalculateLeaderboard(c *fiber.Ctx) error

	ListTopScorerPicks(c *fiber.Ctx) error

	LoginUser(c *fiber.Ctx) error

	GetTournamentTopScorer(c *fiber.Ctx) error

	SetTournamentTopScorer(c *fiber.Ctx) error

	GetLeaderboard(c *fiber.Ctx) error

	ListMatches(c *fiber.Ctx) error

	CreatePrediction(c *fiber.Ctx, matchId MatchId) error

	UpdatePrediction(c *fiber.Ctx, matchId MatchId) error

	GetMyPrediction(c *fiber.Ctx, matchId MatchId) error
}

type ServerInterfaceWrapper struct {
	Handler            ServerInterface
	HandlerMiddlewares []HandlerMiddlewareFunc
}

type MiddlewareFunc fiber.Handler
type HandlerMiddlewareFunc func(c *fiber.Ctx, next fiber.Handler) error

func (siw *ServerInterfaceWrapper) ExportPinsCsv(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.ExportPinsCsv(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) ExportStandingsCsv(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.ExportStandingsCsv(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) ListFixtures(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.ListFixtures(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) CreateFixture(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.CreateFixture(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) DeleteFixture(c *fiber.Ctx) error {

	var err error
	_ = err

	var matchId MatchId

	err = runtime.BindStyledParameterWithOptions("simple", "matchId", c.Params("matchId"), &matchId, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true, Type: "integer", Format: "int64"})
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Errorf("Invalid format for parameter matchId: %w", err).Error())
	}

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.DeleteFixture(c, matchId)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) ReopenFixture(c *fiber.Ctx) error {

	var err error
	_ = err

	var matchId MatchId

	err = runtime.BindStyledParameterWithOptions("simple", "matchId", c.Params("matchId"), &matchId, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true, Type: "integer", Format: "int64"})
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Errorf("Invalid format for parameter matchId: %w", err).Error())
	}

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.ReopenFixture(c, matchId)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) SetFixtureResult(c *fiber.Ctx) error {

	var err error
	_ = err

	var matchId MatchId

	err = runtime.BindStyledParameterWithOptions("simple", "matchId", c.Params("matchId"), &matchId, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true, Type: "integer", Format: "int64"})
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Errorf("Invalid format for parameter matchId: %w", err).Error())
	}

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.SetFixtureResult(c, matchId)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) ListParticipants(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.ListParticipants(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) CreateParticipant(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.CreateParticipant(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) DeleteParticipant(c *fiber.Ctx) error {

	var err error
	_ = err

	var userId UserId

	err = runtime.BindStyledParameterWithOptions("simple", "userId", c.Params("userId"), &userId, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true, Type: "integer", Format: "int64"})
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Errorf("Invalid format for parameter userId: %w", err).Error())
	}

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.DeleteParticipant(c, userId)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) ListAllPredictions(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.ListAllPredictions(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) RecalculateLeaderboard(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.RecalculateLeaderboard(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) ListTopScorerPicks(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.ListTopScorerPicks(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) LoginUser(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.LoginUser(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) GetTournamentTopScorer(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.GetTournamentTopScorer(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) SetTournamentTopScorer(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.SetTournamentTopScorer(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) GetLeaderboard(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.GetLeaderboard(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) ListMatches(c *fiber.Ctx) error {

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.ListMatches(c)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) CreatePrediction(c *fiber.Ctx) error {

	var err error
	_ = err

	var matchId MatchId

	err = runtime.BindStyledParameterWithOptions("simple", "matchId", c.Params("matchId"), &matchId, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true, Type: "integer", Format: "int64"})
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Errorf("Invalid format for parameter matchId: %w", err).Error())
	}

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.CreatePrediction(c, matchId)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) UpdatePrediction(c *fiber.Ctx) error {

	var err error
	_ = err

	var matchId MatchId

	err = runtime.BindStyledParameterWithOptions("simple", "matchId", c.Params("matchId"), &matchId, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true, Type: "integer", Format: "int64"})
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Errorf("Invalid format for parameter matchId: %w", err).Error())
	}

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.UpdatePrediction(c, matchId)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

func (siw *ServerInterfaceWrapper) GetMyPrediction(c *fiber.Ctx) error {

	var err error
	_ = err

	var matchId MatchId

	err = runtime.BindStyledParameterWithOptions("simple", "matchId", c.Params("matchId"), &matchId, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true, Type: "integer", Format: "int64"})
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Errorf("Invalid format for parameter matchId: %w", err).Error())
	}

	handler := func(c *fiber.Ctx) error {
		return siw.Handler.GetMyPrediction(c, matchId)
	}

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		m := siw.HandlerMiddlewares[i]
		next := handler
		handler = func(c *fiber.Ctx) error {
			return m(c, next)
		}
	}

	return handler(c)
}

type FiberServerOptions struct {
	BaseURL            string
	Middlewares        []MiddlewareFunc
	HandlerMiddlewares []HandlerMiddlewareFunc
}

func RegisterHandlers(router fiber.Router, si ServerInterface) {
	RegisterHandlersWithOptions(router, si, FiberServerOptions{})
}

func RegisterHandlersWithOptions(router fiber.Router, si ServerInterface, options FiberServerOptions) {
	wrapper := ServerInterfaceWrapper{
		Handler:            si,
		HandlerMiddlewares: options.HandlerMiddlewares,
	}

	for _, m := range options.Middlewares {
		router.Use(fiber.Handler(m))
	}

	router.Post(options.BaseURL+"/auth/login", wrapper.LoginUser)

	router.Get(options.BaseURL+"/auth/me/tournament-top-scorer", wrapper.GetTournamentTopScorer)

	router.Put(options.BaseURL+"/auth/me/tournament-top-scorer", wrapper.SetTournamentTopScorer)

	router.Get(options.BaseURL+"/matches", wrapper.ListMatches)

	router.Get(options.BaseURL+"/matches/:matchId/predictions/me", wrapper.GetMyPrediction)

	router.Post(options.BaseURL+"/matches/:matchId/predictions", wrapper.CreatePrediction)

	router.Put(options.BaseURL+"/matches/:matchId/predictions", wrapper.UpdatePrediction)

	router.Get(options.BaseURL+"/leaderboard", wrapper.GetLeaderboard)

	router.Get(options.BaseURL+"/admin/fixtures", wrapper.ListFixtures)

	router.Post(options.BaseURL+"/admin/fixtures", wrapper.CreateFixture)

	router.Patch(options.BaseURL+"/admin/fixtures/:matchId/result", wrapper.SetFixtureResult)

	router.Patch(options.BaseURL+"/admin/fixtures/:matchId/reopen", wrapper.ReopenFixture)

	router.Delete(options.BaseURL+"/admin/fixtures/:matchId", wrapper.DeleteFixture)

	router.Get(options.BaseURL+"/admin/participants", wrapper.ListParticipants)

	router.Post(options.BaseURL+"/admin/participants", wrapper.CreateParticipant)

	router.Delete(options.BaseURL+"/admin/participants/:userId", wrapper.DeleteParticipant)

	router.Get(options.BaseURL+"/admin/predictions", wrapper.ListAllPredictions)

	router.Get(options.BaseURL+"/admin/top-scorer-picks", wrapper.ListTopScorerPicks)

	router.Get(options.BaseURL+"/admin/export/standings.csv", wrapper.ExportStandingsCsv)

	router.Get(options.BaseURL+"/admin/export/pins.csv", wrapper.ExportPinsCsv)

	router.Post(options.BaseURL+"/admin/recalculate", wrapper.RecalculateLeaderboard)

}

var swaggerSpec = []string{
	"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",
}

func decodeSpec() ([]byte, error) {
	encoded := strings.Join(swaggerSpec, "")
	compressed, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, fmt.Errorf("error base64 decoding spec: %w", err)
	}
	zr := flate.NewReader(bytes.NewReader(compressed))
	var buf bytes.Buffer
	if _, err := buf.ReadFrom(zr); err != nil {
		return nil, fmt.Errorf("read flate: %w", err)
	}
	if err := zr.Close(); err != nil {
		return nil, fmt.Errorf("close flate reader: %w", err)
	}

	return buf.Bytes(), nil
}

var rawSpec = decodeSpecCached()

func decodeSpecCached() func() ([]byte, error) {
	data, err := decodeSpec()
	return func() ([]byte, error) {
		return data, err
	}
}

func PathToRawSpec(pathToFile string) map[string]func() ([]byte, error) {
	res := make(map[string]func() ([]byte, error))
	if len(pathToFile) > 0 {
		res[pathToFile] = rawSpec
	}

	return res
}

func GetSpec() (swagger *openapi3.T, err error) {
	resolvePath := PathToRawSpec("")

	loader := openapi3.NewLoader()
	loader.IsExternalRefsAllowed = true
	loader.ReadFromURIFunc = func(loader *openapi3.Loader, url *url.URL) ([]byte, error) {
		pathToFile := url.String()
		pathToFile = path.Clean(pathToFile)
		getSpec, ok := resolvePath[pathToFile]
		if !ok {
			err1 := fmt.Errorf("path not found: %s", pathToFile)
			return nil, err1
		}
		return getSpec()
	}
	var specData []byte
	specData, err = rawSpec()
	if err != nil {
		return
	}
	swagger, err = loader.LoadFromData(specData)
	if err != nil {
		return
	}
	return
}

func GetSpecJSON() ([]byte, error) {
	return rawSpec()
}

func GetSwagger() (*openapi3.T, error) {
	return GetSpec()
}
