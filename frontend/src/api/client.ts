export * from './types';
export { ApiError } from './errors';
export { getToken, setToken, clearToken, isLoggedIn, getUser, setUser } from './request';

import { adminApi } from './admin.api';
import { authApi } from './auth.api';
import { matchesApi } from './matches.api';
import { predictionsApi } from './predictions.api';
import { leaderboardApi } from './leaderboard.api';

export const api = {
  auth: authApi,
  admin: adminApi,
  matches: matchesApi,
  predictions: predictionsApi,
  leaderboard: leaderboardApi,
};
