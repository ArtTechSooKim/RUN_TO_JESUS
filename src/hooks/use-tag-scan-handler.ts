import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { INTRO_QR_ID, MASTER_QR_ID, MASTER_STATION, QR_PREFIX, STATION_ALIASES, stations, type Station } from '@/constants/stations';
import { useAuth } from '@/hooks/use-auth';
import { useStationProgress } from '@/hooks/use-station-progress';
import { api } from '@/lib/api';

const BURST_DURATION_MS = 1500;

/** Shared by the QR camera screen and the NFC screen — both scan the same `RTJ:{id}` payload. */
export function useTagScanHandler() {
  const { user } = useAuth();
  const { refresh, recordMasterComplete } = useStationProgress();
  const [errorText, setErrorText] = useState('');
  const [collectedStation, setCollectedStation] = useState<Station | null>(null);
  const scannedRef = useRef(false);

  const handleScan = useCallback(
    async (data: string) => {
      if (scannedRef.current) return;

      const raw = data.trim();
      const scannedId = raw.startsWith(QR_PREFIX) ? raw.slice(QR_PREFIX.length) : raw;
      const id = STATION_ALIASES[scannedId] ?? scannedId;

      if (id === INTRO_QR_ID) {
        scannedRef.current = true;
        router.replace('/map');
        return;
      }

      if (id === MASTER_QR_ID) {
        if (!user) {
          setErrorText('로그인이 필요해요.');
          return;
        }
        scannedRef.current = true;
        setErrorText('');
        try {
          await recordMasterComplete();
          setCollectedStation(MASTER_STATION);
          setTimeout(() => router.replace('/map'), BURST_DURATION_MS);
        } catch {
          scannedRef.current = false;
          setErrorText('기록에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.');
        }
        return;
      }

      const station = stations.find((s) => s.id === id);
      if (!station) {
        setErrorText(`알 수 없는 태그예요: "${data}"`);
        return;
      }

      if (!user) {
        setErrorText('로그인이 필요해요.');
        return;
      }

      scannedRef.current = true;
      setErrorText('');
      try {
        await api.postTagEvent({ person_id: user.person_id, team_id: user.team_id, station_id: station.id });
        await refresh();
        setCollectedStation(station);
        setTimeout(() => {
          router.replace({ pathname: '/station/[id]', params: { id: station.id } });
        }, BURST_DURATION_MS);
      } catch {
        scannedRef.current = false;
        setErrorText('기록에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.');
      }
    },
    [user, refresh, recordMasterComplete],
  );

  return { handleScan, errorText, collectedStation };
}
