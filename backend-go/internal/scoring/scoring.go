package scoring

import "strings"

type Prediction struct {
	PredictedHomeScore int
	PredictedAwayScore int
	PredictedTopScorer *string
}

type MatchResult struct {
	HomeScore      int
	AwayScore      int
	TopScorerName  *string
	TopScorerGoals *int
}

type Breakdown struct {
	ExactScorePoints int `json:"exactScorePoints"`
	OutcomePoints    int `json:"outcomePoints"`
	TopScorerPoints  int `json:"topScorerPoints"`
	GoalBonusPoints  int `json:"goalBonusPoints"`
	Total            int `json:"total"`
}

func normalize(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

func sign(n int) int {
	if n > 0 {
		return 1
	}
	if n < 0 {
		return -1
	}
	return 0
}

func ScorePrediction(p Prediction, m MatchResult) Breakdown {
	var b Breakdown

	isExact := p.PredictedHomeScore == m.HomeScore && p.PredictedAwayScore == m.AwayScore
	if isExact {
		b.ExactScorePoints = 3
	} else if sign(p.PredictedHomeScore-p.PredictedAwayScore) == sign(m.HomeScore-m.AwayScore) {
		b.OutcomePoints = 1
	}

	if p.PredictedTopScorer != nil && m.TopScorerName != nil &&
		normalize(*p.PredictedTopScorer) == normalize(*m.TopScorerName) {
		b.TopScorerPoints = 10
		if m.TopScorerGoals != nil {
			b.GoalBonusPoints = *m.TopScorerGoals
		}
	}

	b.Total = b.ExactScorePoints + b.OutcomePoints + b.TopScorerPoints + b.GoalBonusPoints
	return b
}
