import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { stations } from '@/constants/stations';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';

const SEEN_KEY_PREFIX = 'rtj_seen_fragments_team_';
const REVEAL_DURATION_MS = 3000;
const POLL_MS = 8000;

type StationProgressValue = {
  /** Station ids the current TEAM has tagged, per the server — shared truth across every device on the team. */
  clearedIds: Set<string>;
  collectedLetters: Set<number>;
  /** Letter index currently pinging, for one-shot "ping" animations (own scan or team-sync reveal). */
  newlyCollected: number | null;
  refresh: () => Promise<void>;
  /** Fallback for when scanning doesn't work — records a real tag event same as a scan would. */
  recordManualComplete: (stationId: string) => Promise<void>;
  /** Undo a mistaken tag. Team-wide, since progress is team truth — every teammate's device picks it up on the next poll. */
  cancelStation: (stationId: string) => Promise<void>;
};

const StationProgressContext = createContext<StationProgressValue | null>(null);

export function StationProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [newlyCollected, setNewlyCollected] = useState<number | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealQueue = useRef<number[]>([]);

  const playNextReveal = useCallback(() => {
    if (revealTimer.current) return;
    const next = revealQueue.current.shift();
    if (next === undefined) return;
    setNewlyCollected(next);
    revealTimer.current = setTimeout(() => {
      setNewlyCollected(null);
      revealTimer.current = null;
      playNextReveal();
    }, REVEAL_DURATION_MS);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setClearedIds(new Set());
      return;
    }

    const { stationIds } = await api.getTeamFragments(user.team_id);
    setClearedIds(new Set(stationIds));

    // Reconcile against what THIS device has already shown a reveal for — a
    // teammate tagging a station should still ping the letter here once,
    // even though we never scanned it ourselves (see 기능정리 §3).
    const seenKey = `${SEEN_KEY_PREFIX}${user.team_id}`;
    const savedRaw = await AsyncStorage.getItem(seenKey);
    let seen = new Set<string>(savedRaw ? JSON.parse(savedRaw) : []);

    // Self-heal after a cancelled tag or a super-admin progress reset: drop
    // "seen" markers for stations the team no longer has, so a future re-tag
    // of that same station correctly replays the reveal instead of being
    // suppressed by stale local state.
    const stillCleared = new Set(stationIds);
    const reconciledSeen = new Set([...seen].filter((id) => stillCleared.has(id)));
    if (reconciledSeen.size !== seen.size) {
      seen = reconciledSeen;
      await AsyncStorage.setItem(seenKey, JSON.stringify([...seen]));
    }

    const newlySeen = stationIds.filter((id) => !seen.has(id));

    if (newlySeen.length) {
      const newLetters = new Set<number>();
      for (const id of newlySeen) {
        const station = stations.find((s) => s.id === id);
        station?.letters.forEach((li) => newLetters.add(li));
      }
      revealQueue.current.push(...newLetters);
      playNextReveal();

      const nextSeen = [...seen, ...newlySeen];
      await AsyncStorage.setItem(seenKey, JSON.stringify(nextSeen));
    }
  }, [user, playNextReveal]);

  useEffect(() => {
    refresh();
    // Poll so a teammate's tag or cancel (from a different device) shows up
    // here without needing to leave and re-enter the screen.
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const recordManualComplete = useCallback(
    async (stationId: string) => {
      if (!user) return;
      await api.postTagEvent({ person_id: user.person_id, team_id: user.team_id, station_id: stationId });
      await refresh();
    },
    [user, refresh],
  );

  const cancelStation = useCallback(
    async (stationId: string) => {
      if (!user) return;
      await api.cancelTagEvent(user.team_id, stationId);
      await refresh();
    },
    [user, refresh],
  );

  const collectedLetters = useMemo(() => {
    const letters = new Set<number>();
    for (const station of stations) {
      if (!clearedIds.has(station.id)) continue;
      for (const index of station.letters) letters.add(index);
    }
    return letters;
  }, [clearedIds]);

  return (
    <StationProgressContext.Provider
      value={{ clearedIds, collectedLetters, newlyCollected, refresh, recordManualComplete, cancelStation }}>
      {children}
    </StationProgressContext.Provider>
  );
}

export function useStationProgress() {
  const ctx = useContext(StationProgressContext);
  if (!ctx) throw new Error('useStationProgress must be used within StationProgressProvider');
  return ctx;
}
