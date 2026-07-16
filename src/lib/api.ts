// Thin fetch wrapper for the Express API in server/. Always hits the
// deployed Railway URL (not a relative path) so it works the same from
// native builds, web dev, and production — there's no local backend.
export const WEB_BASE_URL = 'https://run-to-jesus-production.up.railway.app';
const API_BASE_URL = `${WEB_BASE_URL}/api`;

export type ApiUser = {
  person_id: string;
  name: string;
  team_id: number;
};

export type ApiStation = {
  station_id: string;
  name: string;
  hall_name: string | null;
  duration_minutes: number;
  concurrent_capacity: number;
  letters: number[];
  is_active: 0 | 1;
  /** 숨은글자찾기 전용 — filtered out of admin's station list. */
  is_hidden: 0 | 1;
  /** 노아방/아벨방/영화관 — session auto-starts on tag instead of via admin. */
  is_minigame: 0 | 1;
};

export type GameState = 'progress' | 'ended' | 'ending';

export type ApiSession = {
  id: number;
  station_id: string;
  team_id: number;
  started_at: string;
  expected_end_at: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  ended_at: string | null;
  ended_by: 'auto' | 'admin' | null;
  started_by_name: string | null;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${options?.method ?? 'GET'} ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

export const api = {
  login: (body: { person_id?: string; name: string; team_id: number }) =>
    request<ApiUser>('/users/login', { method: 'POST', body: JSON.stringify(body) }),

  updateUser: (personId: string, body: { name?: string; team_id?: number }) =>
    request<ApiUser>(`/users/${personId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  postTagEvent: (body: { person_id: string; team_id: number; station_id: string }) =>
    request<{ station_id: string; letters: number[]; newForTeam: boolean }>('/tag-events', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getTeamFragments: (teamId: number) =>
    request<{ stationIds: string[]; letters: number[] }>(`/teams/${teamId}/fragments`),

  cancelTagEvent: (teamId: number, stationId: string) =>
    request<{ ok: true }>(`/tag-events/${teamId}/${stationId}`, { method: 'DELETE' }),

  postRevealLog: (body: { person_id: string; station_id: string; source: 'own_tag' | 'team_sync' }) =>
    request<{ ok: true }>('/fragment-reveal-log', { method: 'POST', body: JSON.stringify(body) }),

  getStations: (onlyActive = false) =>
    request<ApiStation[]>(`/stations${onlyActive ? '?active=true' : ''}`),

  createStation: (body: Partial<ApiStation> & { station_id: string; name: string }) =>
    request<ApiStation>('/stations', { method: 'POST', body: JSON.stringify(body) }),

  updateStation: (stationId: string, body: Partial<ApiStation>) =>
    request<ApiStation>(`/stations/${stationId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deactivateStation: (stationId: string) =>
    request<{ ok: true }>(`/stations/${stationId}`, { method: 'DELETE' }),

  getSessions: (status?: ApiSession['status']) =>
    request<ApiSession[]>(`/sessions${status ? `?status=${status}` : ''}`),

  startSession: (body: { station_id: string; team_id: number; started_by_name?: string }) =>
    request<ApiSession>('/sessions', { method: 'POST', body: JSON.stringify(body) }),

  endSession: (id: number, body: { status: 'completed' | 'cancelled'; ended_by?: 'auto' | 'admin' }) =>
    request<ApiSession>(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  getAppState: () => request<{ game_state: GameState; updated_at: string }>('/app-state'),

  setAppState: (game_state: 'progress' | 'ended') =>
    request<{ game_state: GameState }>('/app-state', { method: 'PUT', body: JSON.stringify({ game_state }) }),

  getOverallStats: () => request<{ count: number; total: number; ratio: number }>('/stats/overall'),

  resetAllProgress: (password: string) =>
    request<{ ok: true }>('/admin/reset-progress', { method: 'POST', body: JSON.stringify({ password }) }),

  startEnding: () => request<{ game_state: GameState }>('/admin/ending/start', { method: 'POST' }),
};
