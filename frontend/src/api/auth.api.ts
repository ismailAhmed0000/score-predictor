import { request } from './request';
import type {
  LoginResponse,
  SetTournamentTopScorerInput,
  TournamentTopScorer,
} from './types';

export const authApi = {
  login(name: string, pin: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { name, pin },
    });
  },

  getTournamentTopScorer() {
    return request<TournamentTopScorer>('/auth/me/tournament-top-scorer');
  },

  setTournamentTopScorer(tournamentTopScorer: string) {
    return request<TournamentTopScorer>('/auth/me/tournament-top-scorer', {
      method: 'PUT',
      body: { tournamentTopScorer } satisfies SetTournamentTopScorerInput,
    });
  },
};
