import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { stations } from '@/constants/stations';

type StationProgressValue = {
  clearedIds: Set<string>;
  collectedLetters: Set<number>;
  /** Letter index most recently collected, for one-shot "ping" animations. */
  newlyCollected: number | null;
  toggleCleared: (id: string) => void;
};

const StationProgressContext = createContext<StationProgressValue | null>(null);

export function StationProgressProvider({ children }: { children: ReactNode }) {
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [newlyCollected, setNewlyCollected] = useState<number | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleCleared = (id: string) => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);

        const station = stations.find((s) => s.id === id);
        if (station) {
          if (clearTimer.current) clearTimeout(clearTimer.current);
          setNewlyCollected(station.letters[0]);
          clearTimer.current = setTimeout(() => setNewlyCollected(null), 3000);
        }
      }
      return next;
    });
  };

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
      value={{ clearedIds, collectedLetters, newlyCollected, toggleCleared }}>
      {children}
    </StationProgressContext.Provider>
  );
}

export function useStationProgress() {
  const ctx = useContext(StationProgressContext);
  if (!ctx) throw new Error('useStationProgress must be used within StationProgressProvider');
  return ctx;
}
