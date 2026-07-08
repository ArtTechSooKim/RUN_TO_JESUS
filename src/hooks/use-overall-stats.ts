import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';

const POLL_MS = 5000;

/** Polls /api/stats/overall for the runner-progress-bar. */
export function useOverallStats() {
  const [ratio, setRatio] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { ratio } = await api.getOverallStats();
      setRatio(ratio);
    } catch {
      // transient network hiccup — keep the last known value
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return ratio;
}
