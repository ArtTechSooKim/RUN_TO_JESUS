import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { INTRO_QR_ID, QR_PREFIX, STATION_ALIASES, stations, type Station } from '@/constants/stations';
import { useStationProgress } from '@/hooks/use-station-progress';

const BURST_DURATION_MS = 1500;

/** Shared by the QR camera screen and the NFC screen — both scan the same `RTJ:{id}` payload. */
export function useTagScanHandler() {
  const { clearedIds, toggleCleared } = useStationProgress();
  const [errorText, setErrorText] = useState('');
  const [collectedStation, setCollectedStation] = useState<Station | null>(null);
  const scannedRef = useRef(false);

  const handleScan = useCallback(
    (data: string) => {
      if (scannedRef.current) return;

      const raw = data.trim();
      const scannedId = raw.startsWith(QR_PREFIX) ? raw.slice(QR_PREFIX.length) : raw;
      const id = STATION_ALIASES[scannedId] ?? scannedId;

      if (id === INTRO_QR_ID) {
        scannedRef.current = true;
        router.replace('/map');
        return;
      }

      const station = stations.find((s) => s.id === id);
      if (!station) {
        setErrorText(`알 수 없는 태그예요: "${data}"`);
        return;
      }

      scannedRef.current = true;
      setErrorText('');
      if (!clearedIds.has(station.id)) {
        toggleCleared(station.id);
      }
      setCollectedStation(station);
      setTimeout(() => {
        router.replace({ pathname: '/station/[id]', params: { id: station.id } });
      }, BURST_DURATION_MS);
    },
    [clearedIds, toggleCleared],
  );

  return { handleScan, errorText, collectedStation };
}
