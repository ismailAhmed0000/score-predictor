import { request } from './request';
import type { Match, SetMatchResultInput } from './types';

export const matchesApi = {
  list() {
    return request<Match[]>('/matches');
  },

  setResult(matchId: number, data: SetMatchResultInput) {
    return request<Match>(`/matches/${matchId}/result`, {
      method: 'PATCH',
      body: data,
    });
  },
};
