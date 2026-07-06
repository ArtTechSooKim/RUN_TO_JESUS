import { useCallback, useEffect, useState } from 'react';

import { api, type ApiSession } from '@/lib/api';

const POLL_MS = 5000;

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

  return sessions;
}

export function formatRemaining(expectedEndAt: string) {
  const ms = new Date(expectedEndAt).getTime() - Date.now();
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
