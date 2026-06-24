export * from './types';
export { ApiError } from './errors';
export { getToken, setToken, clearToken, isLoggedIn } from './request';

import { authApi } from './auth.api';
import { matchesApi } from './matches.api';
import { predictionsApi } from './predictions.api';
import { leaderboardApi } from './leaderboard.api';

export const api = {
  auth: authApi,
  matches: matchesApi,
  predictions: predictionsApi,
  leaderboard: leaderboardApi,
};
