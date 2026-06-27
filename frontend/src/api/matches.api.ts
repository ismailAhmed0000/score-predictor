import { request } from './request';
import type { Match } from './types';

export const matchesApi = {
  list() {
    return request<Match[]>('/matches');
  },
};
