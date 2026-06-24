const GOAL_BONUS_PER_GOAL = 1;

export type PredictionForScoring = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedTopScorer: string | null;
};

export type MatchForScoring = {
  homeScore: number;
  awayScore: number;
  topScorerName: string | null;
  topScorerGoals: number | null;
};

export type MatchPointsBreakdown = {
  exactScorePoints: number;
  outcomePoints: number;
  topScorerPoints: number;
  goalBonusPoints: number;
  total: number;
};

function normalizePlayerName(name: string): string {
  return name.trim().toLowerCase();
}

function isCorrectOutcome(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): boolean {
  return (
    Math.sign(predictedHome - predictedAway) ===
    Math.sign(actualHome - actualAway)
  );
}

export function scorePrediction(
  prediction: PredictionForScoring,
  match: MatchForScoring,
): MatchPointsBreakdown {
  let exactScorePoints = 0;
  let outcomePoints = 0;
  let topScorerPoints = 0;
  let goalBonusPoints = 0;

  const isExactScore =
    prediction.predictedHomeScore === match.homeScore &&
    prediction.predictedAwayScore === match.awayScore;

  if (isExactScore) {
    exactScorePoints = 3;
  } else if (
    isCorrectOutcome(
      prediction.predictedHomeScore,
      prediction.predictedAwayScore,
      match.homeScore,
      match.awayScore,
    )
  ) {
    outcomePoints = 1;
  }

  if (
    prediction.predictedTopScorer &&
    match.topScorerName &&
    normalizePlayerName(prediction.predictedTopScorer) ===
      normalizePlayerName(match.topScorerName)
  ) {
    topScorerPoints = 10;
    goalBonusPoints = (match.topScorerGoals ?? 0) * GOAL_BONUS_PER_GOAL;
  }

  return {
    exactScorePoints,
    outcomePoints,
    topScorerPoints,
    goalBonusPoints,
    total: exactScorePoints + outcomePoints + topScorerPoints + goalBonusPoints,
  };
}
