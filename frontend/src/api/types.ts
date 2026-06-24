export type User = {
  id: number;
  name: string;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type Match = {
  id: number;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  topScorerName: string | null;
  topScorerGoals: number | null;
  status: string;
  homeTeam: string;
  awayTeam: string;
};

export type Prediction = {
  id: number;
  userId: number;
  matchId: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedTopScorer: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PredictionInput = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedTopScorer?: string;
};

export type LeaderboardEntry = {
  userId: number;
  name: string;
  exactScorePoints: number;
  outcomePoints: number;
  topScorerPoints: number;
  goalBonusPoints: number;
  total: number;
};

export type SetMatchResultInput = {
  homeScore: number;
  awayScore: number;
  topScorerName: string;
  topScorerGoals: number;
};
