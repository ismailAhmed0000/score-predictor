import { request } from './request';
import type { Prediction, PredictionInput } from './types';

export const predictionsApi = {
  getMine(matchId: number) {
    return request<Prediction | null>(`/matches/${matchId}/predictions/me`);
  },

  create(matchId: number, data: PredictionInput) {
    return request<Prediction>(`/matches/${matchId}/predictions`, {
      method: 'POST',
      body: data,
    });
  },

  update(matchId: number, data: PredictionInput) {
    return request<Prediction>(`/matches/${matchId}/predictions`, {
      method: 'PUT',
      body: data,
    });
  },

  async save(matchId: number, data: PredictionInput) {
    const existing = await this.getMine(matchId);
    return existing
      ? this.update(matchId, data)
      : this.create(matchId, data);
  },
};
