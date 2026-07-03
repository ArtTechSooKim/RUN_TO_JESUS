import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { stations } from '@/constants/stations';

type StationProgressValue = {
  clearedIds: Set<string>;
  collectedLetters: Set<number>;
  toggleCleared: (id: string) => void;
};

const StationProgressContext = createContext<StationProgressValue | null>(null);

export function StationProgressProvider({ children }: { children: ReactNode }) {
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());

  const toggleCleared = (id: string) => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
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
    <StationProgressContext.Provider value={{ clearedIds, collectedLetters, toggleCleared }}>
      {children}
    </StationProgressContext.Provider>
  );
}

export function useStationProgress() {
  const ctx = useContext(StationProgressContext);
  if (!ctx) throw new Error('useStationProgress must be used within StationProgressProvider');
  return ctx;
}
