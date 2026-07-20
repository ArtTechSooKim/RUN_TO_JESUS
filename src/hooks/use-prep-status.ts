import { useCallback, useEffect, useMemo, useState } from 'react';

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

/** Mirrors sessionMapKey in use-active-sessions.ts — "station:hall" for 라합방's independently-prepped halls, plain station_id everywhere else. */
function prepMapKey(p: PrepStatus) {
  return p.hall_label ? `${p.station_id}:${p.hall_label}` : p.station_id;
}

/** Builds the per-tile lookup maps the floor map SVGs need from the raw prep-status rows — shared by the participant floormap and admin MAP tab. */
export function useMapPrepAggregates(statuses: PrepStatus[]) {
  return useMemo(() => {
    const isPreparing: Record<string, boolean> = {};
    const prepTips: Record<string, string> = {};
    const isRecruiting: Record<string, boolean> = {};
    const recruitTips: Record<string, string> = {};
    for (const p of statuses) {
      const key = prepMapKey(p);
      isPreparing[key] = !!p.is_preparing;
      if (p.tip) prepTips[key] = p.tip;
      isRecruiting[key] = !!p.is_recruiting;
      if (p.recruit_tip) recruitTips[key] = p.recruit_tip;
    }
    return { isPreparing, prepTips, isRecruiting, recruitTips };
  }, [statuses]);
}
