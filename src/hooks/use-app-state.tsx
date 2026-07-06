import { useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api';

const POLL_INTERVAL_MS = 12000;

/** Polls the global game_state (progress/ended) so the whole app can lock when the event wraps up. */
export function useGameState() {
  const [gameState, setGameState] = useState<'progress' | 'ended'>('progress');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const { game_state } = await api.getAppState();
        if (!cancelled) setGameState(game_state);
      } catch {
        // network hiccup — keep the last known state rather than falsely locking/unlocking
      }
    }

    poll();
    timer.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return gameState;
}
