// Thin fetch wrapper for the Express API in server/. Always hits the
// deployed Railway URL (not a relative path) so it works the same from
// native builds, web dev, and production — there's no local backend.
const API_BASE_URL = 'https://run-to-jesus-production.up.railway.app/api';

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

/** A station's two manual staff-toggled flags: "준비중🧹" between games, and "도전자 모집중" for versus-format stations waiting on an opponent team. */
export type PrepStatus = {
  station_id: string;
  /** '' for every station except 라합방, whose 사무엘홀/다니엘홀 halls run — and prep — independently. */
  hall_label: string;
  is_preparing: 0 | 1;
  tip: string | null;
  is_recruiting: 0 | 1;
  recruit_tip: string | null;
};

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
  /** Which independently-operated hall this session belongs to (e.g. 라합방's 사무엘홀/다니엘홀) — null for every other station. */
  hall_label: string | null;
};

/** Thrown by request() on a non-2xx response — status lets callers branch on e.g. 409 (conflict) vs other failures. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(`API ${options?.method ?? 'GET'} ${path} failed: ${res.status} ${body}`, res.status);
  }
  return res.json();
}

export const api = {
  login: (body: { person_id?: string; name: string; team_id: number }) =>
    request<ApiUser>('/users/login', { method: 'POST', body: JSON.stringify(body) }),

  updateUser: (personId: string, body: { name?: string; team_id?: number }) =>
    request<ApiUser>(`/users/${personId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  postTagEvent: (body: { person_id: string; team_id: number; station_id: string }) =>
    request<{ station_id: string; letters: number[]; newForTeam: boolean; fragmentLetter: string | null }>(
      '/tag-events',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  getTeamFragments: (teamId: number) =>
    request<{ stationIds: string[]; letters: number[]; wildcardCount: number }>(`/teams/${teamId}/fragments`),

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

  startSession: (body: { station_id: string; team_id: number; started_by_name?: string; hall_label?: string }) =>
    request<ApiSession>('/sessions', { method: 'POST', body: JSON.stringify(body) }),

  endSession: (id: number, body: { status: 'completed' | 'cancelled'; ended_by?: 'auto' | 'admin' }) =>
    request<ApiSession>(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  getAppState: () => request<{ game_state: GameState; updated_at: string }>('/app-state'),

  setAppState: (game_state: 'progress' | 'ended') =>
    request<{ game_state: GameState }>('/app-state', { method: 'PUT', body: JSON.stringify({ game_state }) }),

  getOverallStats: () => request<{ count: number; total: number; ratio: number }>('/stats/overall'),

  getPrepStatuses: () => request<PrepStatus[]>('/prep-status'),

  setPrepStatus: (
    stationId: string,
    body: {
      is_preparing?: boolean;
      tip?: string;
      is_recruiting?: boolean;
      recruit_tip?: string;
      hall_label?: string;
    },
  ) =>
    request<PrepStatus>(`/prep-status/${stationId}`, { method: 'PUT', body: JSON.stringify(body) }),

  resetAllProgress: (password: string) =>
    request<{ ok: true }>('/admin/reset-progress', { method: 'POST', body: JSON.stringify({ password }) }),

  resetAllUsers: (password: string) =>
    request<{ ok: true }>('/admin/reset-users', { method: 'POST', body: JSON.stringify({ password }) }),

  startEnding: () => request<{ game_state: GameState }>('/admin/ending/start', { method: 'POST' }),
};
