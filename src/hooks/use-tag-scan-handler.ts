import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import {
  CINEMA_STATIONS,
  INTRO_QR_ID,
  MASTER_QR_ID,
  MASTER_STATION,
  QR_PREFIX,
  STATION_ALIASES,
  stations,
  type Station,
} from '@/constants/stations';
import { useAuth } from '@/hooks/use-auth';
import { useStationProgress } from '@/hooks/use-station-progress';
import { api } from '@/lib/api';

const BURST_DURATION_MS = 1500;

// 스캔/상세페이지는 새로운시네마의 영화 1/2/3(CINEMA1~3)도 id로 인식해야
// 하지만, 지도/층별 지도용 `stations`에는 일부러 넣지 않았다 — 그래서
// 여기서만 합쳐서 찾는다 (자세한 이유는 constants/stations.ts 참고).
const SCANNABLE_STATIONS = [...stations, ...CINEMA_STATIONS];

/** Shared by the QR camera screen and the NFC screen — both scan the same `RTJ:{id}` payload. */
export function useTagScanHandler() {
  const { user } = useAuth();
  const { refresh, recordMasterComplete, suppressReveal } = useStationProgress();
  const [errorText, setErrorText] = useState('');
  const [collectedStation, setCollectedStation] = useState<Station | null>(null);
  const [grantedLetter, setGrantedLetter] = useState<string | null>(null);
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

      const station = SCANNABLE_STATIONS.find((s) => s.id === id);
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
        const result = await api.postTagEvent({ person_id: user.person_id, team_id: user.team_id, station_id: station.id });
        // This device already gets its own burst below — don't also queue the
        // full-screen team-sync reveal for the same letters a moment later.
        await suppressReveal(station.id);
        await refresh();
        setCollectedStation(station);
        // 새로운시네마는 station.letters가 비어 있어(조건부 배정) 어떤 글자를
        // 받았는지 응답에서 직접 읽어야 함 — 와일드카드('*')는 특정 글자가
        // 아니므로 참여-완료 체크마크로 폴백(undefined)시킨다.
        setGrantedLetter(result.fragmentLetter === '*' ? null : result.fragmentLetter);
        setTimeout(() => {
          router.replace({ pathname: '/station/[id]', params: { id: station.id } });
        }, BURST_DURATION_MS);
      } catch {
        scannedRef.current = false;
        setErrorText('기록에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.');
      }
    },
    [user, refresh, recordMasterComplete, suppressReveal],
  );

  return { handleScan, errorText, collectedStation, grantedLetter };
}
