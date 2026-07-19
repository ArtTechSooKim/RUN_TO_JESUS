import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, type ApiSession } from '@/lib/api';

const POLL_MS = 5000;

/** Groups a session under its station, or "station:hall" for a session that belongs to an independently-run hall (e.g. 라합방's 사무엘홀/다니엘홀) — keeps the floor map from merging two halls' progress into one badge. */
function sessionMapKey(s: ApiSession) {
  return s.hall_label ? `${s.station_id}:${s.hall_label}` : s.station_id;
}

/** Aggregates active sessions into the per-tile maps the floor map SVGs need — shared by the participant floormap and admin MAP tab so both group split-hall stations the same way. */
export function useMapAggregates(sessions: ApiSession[]) {
  return useMemo(() => {
    const activeCounts: Record<string, number> = {};
    const activeTeamIds: Record<string, number[]> = {};
    const sums: Record<string, number> = {};
    const sessionCounts: Record<string, number> = {};
    for (const s of sessions) {
      const key = sessionMapKey(s);
      activeCounts[key] = (activeCounts[key] ?? 0) + 1;
      (activeTeamIds[key] ??= []).push(s.team_id);
      sums[key] = (sums[key] ?? 0) + sessionProgressPercent(s);
      sessionCounts[key] = (sessionCounts[key] ?? 0) + 1;
    }
    const activePercents: Record<string, number> = {};
    for (const key of Object.keys(sums)) activePercents[key] = Math.round(sums[key] / sessionCounts[key]);
    return { activeCounts, activeTeamIds, activePercents };
  }, [sessions]);
}

/** Polls in-progress game_sessions so participant screens can show "N조 진행중" live, per 기능정리 §4. */
export function useActiveSessions() {
  const [sessions, setSessions] = useState<ApiSession[]>([]);

  const refresh = useCallback(async () => {
    try {
      setSessions(await api.getSessions('in_progress'));
    } catch {
      // transient network hiccup — keep the last known state
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { sessions, refresh };
}

export function formatRemaining(expectedEndAt: string) {
  const ms = new Date(expectedEndAt).getTime() - Date.now();
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** How far through its expected duration a session is, 0-100. */
export function sessionProgressPercent(session: ApiSession) {
  const start = new Date(session.started_at).getTime();
  const end = new Date(session.expected_end_at).getTime();
  if (end <= start) return 100;
  const pct = ((Date.now() - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
