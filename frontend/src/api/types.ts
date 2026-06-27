export type User = {
  id: number;
  name: string;
  isAdmin?: boolean;
};

export type TournamentTopScorer = {
  tournamentTopScorer: string | null;
};

export type SetTournamentTopScorerInput = {
  tournamentTopScorer: string;
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
  topScorerName?: string;
  topScorerGoals?: number;
};

export type AdminFixture = {
  id: number;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  topScorerName: string | null;
  topScorerGoals: number | null;
  status: string;
  homeTeam: string;
  awayTeam: string;
  predictionCount: number;
};

export type AdminParticipant = {
  id: number;
  name: string;
  isAdmin: boolean;
  tournamentTopScorer: string | null;
  createdAt: string;
};

export type AdminPrediction = {
  id: number;
  userId: number;
  userName: string;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  matchStatus: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  updatedAt: string;
};

export type AdminTopScorerPick = {
  id: number;
  name: string;
  tournamentTopScorer: string | null;
};

export type CreateFixtureInput = {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
};

export type CreateParticipantInput = {
  name: string;
  pin?: string;
};

export type CreateParticipantResponse = {
  user: AdminParticipant;
  pin: string;
};
