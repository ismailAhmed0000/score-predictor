import { API_URL } from './config';
import { getToken, request } from './request';
import type {
  AdminFixture,
  AdminParticipant,
  AdminPrediction,
  AdminTopScorerPick,
  CreateFixtureInput,
  CreateParticipantInput,
  CreateParticipantResponse,
  LeaderboardEntry,
  SetMatchResultInput,
} from './types';

async function downloadCsv(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const adminApi = {
  listFixtures() {
    return request<AdminFixture[]>('/admin/fixtures');
  },

  createFixture(data: CreateFixtureInput) {
    return request<AdminFixture>('/admin/fixtures', {
      method: 'POST',
      body: data,
    });
  },

  updateResult(matchId: number, data: SetMatchResultInput) {
    return request<AdminFixture>(`/admin/fixtures/${matchId}/result`, {
      method: 'PATCH',
      body: data,
    });
  },

  reopenFixture(matchId: number) {
    return request<AdminFixture>(`/admin/fixtures/${matchId}/reopen`, {
      method: 'PATCH',
    });
  },

  deleteFixture(matchId: number) {
    return request<{ deleted: boolean }>(`/admin/fixtures/${matchId}`, {
      method: 'DELETE',
    });
  },

  listParticipants() {
    return request<AdminParticipant[]>('/admin/participants');
  },

  createParticipant(data: CreateParticipantInput) {
    return request<CreateParticipantResponse>('/admin/participants', {
      method: 'POST',
      body: data,
    });
  },

  deleteParticipant(userId: number) {
    return request<{ deleted: boolean }>(`/admin/participants/${userId}`, {
      method: 'DELETE',
    });
  },

  listPredictions() {
    return request<AdminPrediction[]>('/admin/predictions');
  },

  listTopScorerPicks() {
    return request<AdminTopScorerPick[]>('/admin/top-scorer-picks');
  },

  recalculate() {
    return request<LeaderboardEntry[]>('/admin/recalculate', {
      method: 'POST',
    });
  },

  exportStandingsCsv() {
    return downloadCsv('/admin/export/standings.csv', 'standings.csv');
  },

  exportPinsCsv() {
    return downloadCsv('/admin/export/pins.csv', 'pins.csv');
  },
};
