import { useCallback, useEffect, useState } from 'react';

import { api, type PrepStatus } from '@/lib/api';

const POLL_MS = 8000;

/** Polls which stations are currently marked 준비중🧹 by their staff — see station/prep-status routes. */
export function usePrepStatuses() {
  const [statuses, setStatuses] = useState<PrepStatus[]>([]);

  const refresh = useCallback(async () => {
    try {
      setStatuses(await api.getPrepStatuses());
    } catch {
      // transient network hiccup — keep the last known state
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { statuses, refresh };
}
