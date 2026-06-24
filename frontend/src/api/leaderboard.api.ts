import { request } from './request';
import type { LeaderboardEntry } from './types';

export const leaderboardApi = {
  get() {
    return request<LeaderboardEntry[]>('/leaderboard');
  },
};
