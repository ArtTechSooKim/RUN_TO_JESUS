import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';

import { Floor10Fashion, Floor10Young, Floor11Young } from '@/components/floor-map-svg';
import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { floorLabels, floors, stations as allStations, type Floor, type Station } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { formatRemaining, sessionProgressPercent, useActiveSessions, useMapAggregates } from '@/hooks/use-active-sessions';
import { usePrepStatuses } from '@/hooks/use-prep-status';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { ApiError, api, type ApiSession, type ApiStation, type PrepStatus } from '@/lib/api';

const DEFAULT_PREP_TIP = '대략 10분 준비합니다';
// 삼손방은 12명 릴레이 3레인 구조라 세팅이 다른 방보다 훨씬 빨리 끝남 —
// 처음 준비중을 켤 때 채워지는 기본 문구만 다르고, 그 외 로직은 동일.
const STATION_PREP_TIP_OVERRIDES: Record<string, string> = {
  SAMSON: '대략 5분 준비합니다',
};
function defaultPrepTip(stationId: string) {
  return STATION_PREP_TIP_OVERRIDES[stationId] ?? DEFAULT_PREP_TIP;
}

// tag_events.person_id for admin-initiated grants — there's no real logged-in
// user behind the 관리자 login bypass (see use-auth.tsx), so this is a fixed,
// recognizable stand-in rather than a real person UUID.
const ADMIN_GRANT_PERSON_ID = 'admin-grant';

const POLL_MS = 5000;

// 라합방은 사무엘홀/다니엘홀 두 곳에서 동일한 게임(같은 조각)을 동시에 운영해
// 처리량을 늘리는 스테이션이라, 관리자 화면에서만 두 홀을 독립된 칸으로 나눠
// 각자 다른 시간에 세션을 시작/관리할 수 있게 한다. 조각 획득 로직은 station_id
// 하나로 그대로 공유되고, hall_label은 순전히 이 화면의 표시/구분용.
const HALL_SPLITS: Record<string, string[]> = {
  RAHAB: ['사무엘홀', '다니엘홀'],
};

const FLOOR_MAPS: Record<Floor, typeof Floor10Young> = {
  'young-10f': Floor10Young,
  'young-11f': Floor11Young,
  'fashion-10f': Floor10Fashion,
};

const EMPTY_CLEARED = new Set<string>();

/** Parses "1,2,3" / "1 2 3" / mixed into deduped, valid (1-24) team ids. */
function parseTeamIds(input: string): number[] {
  const parsed = input
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map(Number);
  return [...new Set(parsed)].filter((n) => Number.isInteger(n) && n >= 1 && n <= 24);
}

function HallGroup({
  label,
  sessions,
  activeTeamIdsGlobal,
  onStart,
  onEnd,
}: {
  /** Sub-location name (e.g. "사무엘홀") for split stations — omitted for ordinary single-hall stations. */
  label?: string;
  sessions: ApiSession[];
  /** Every team currently in-progress at ANY station, so we can block starting a team that's already elsewhere. */
  activeTeamIdsGlobal: Set<number>;
  onStart: (teamIds: number[]) => Promise<number[]>;
  onEnd: (id: number, status: 'completed' | 'cancelled') => void;
}) {
  const [teamInput, setTeamInput] = useState('');
  const [error, setError] = useState('');

  async function handleStartPress() {
    const requested = parseTeamIds(teamInput);
    const blocked = requested.filter((n) => activeTeamIdsGlobal.has(n));
    const startable = requested.filter((n) => !activeTeamIdsGlobal.has(n));

    if (!startable.length) {
      if (blocked.length) setError(`${blocked.join(', ')}조는 이미 다른 방에서 진행 중이에요`);
      return;
    }

    const rejected = await onStart(startable);
    const skipped = [...blocked, ...rejected];
    setError(skipped.length ? `${skipped.join(', ')}조는 이미 다른 방에서 진행 중이에요` : '');
    setTeamInput('');
  }

  return (
    <View style={[styles.hallGroupBase, label && styles.hallGroup]}>
      {label && (
        <ThemedText type="small" style={styles.hallLabel}>
          {label}
        </ThemedText>
      )}

      {sessions.map((s) => (
        <View key={s.id} style={styles.sessionRow}>
          <ThemedText type="small" style={styles.sessionTeam}>
            {s.team_id}조{s.started_by_name ? ` · ${s.started_by_name}` : ''} · {sessionProgressPercent(s)}% ·{' '}
            {formatRemaining(s.expected_end_at)}
          </ThemedText>
          <SoundPressable onPress={() => onEnd(s.id, 'cancelled')} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ color: '#F87171' }}>
              취소
            </ThemedText>
          </SoundPressable>
        </View>
      ))}

      <View style={styles.startRow}>
        <TextInput
          value={teamInput}
          onChangeText={(v) => {
            setTeamInput(v);
            setError('');
          }}
          placeholder="팀 번호 (예: 1,2,3)"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.teamInput}
        />
        <SoundPressable
          onPress={handleStartPress}
          style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
          <ThemedText type="small" style={{ color: Colors.dark.background }}>
            세션 시작
          </ThemedText>
        </SoundPressable>
      </View>
      {error !== '' && (
        <ThemedText type="small" style={styles.errorText}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

function PrepToggle({
  stationId,
  prep,
  onChanged,
}: {
  stationId: string;
  prep?: PrepStatus;
  onChanged: () => void;
}) {
  const isPreparing = !!prep?.is_preparing;
  const [tip, setTip] = useState(prep?.tip || defaultPrepTip(stationId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prep?.tip) setTip(prep.tip);
  }, [prep?.tip]);

  async function toggle() {
    setSaving(true);
    try {
      await api.setPrepStatus(stationId, { is_preparing: !isPreparing, tip: tip || defaultPrepTip(stationId) });
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.prepRow}>
      <SoundPressable
        onPress={toggle}
        disabled={saving}
        style={({ pressed }) => [styles.prepToggle, isPreparing && styles.prepToggleActive, pressed && styles.pressed]}>
        <ThemedText type="small" style={{ color: isPreparing ? '#78350F' : Colors.dark.textSecondary }}>
          🧹 준비중{isPreparing ? ' · ON' : ''}
        </ThemedText>
      </SoundPressable>
      {isPreparing && (
        <TextInput
          value={tip}
          onChangeText={setTip}
          onBlur={() => api.setPrepStatus(stationId, { is_preparing: true, tip: tip || defaultPrepTip(stationId) }).then(onChanged)}
          placeholder={`예: ${defaultPrepTip(stationId)}`}
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.prepTipInput}
        />
      )}
    </View>
  );
}

function StationCard({
  station,
  sessions,
  activeTeamIdsGlobal,
  prep,
  onPrepChanged,
  onStart,
  onEnd,
}: {
  station: ApiStation;
  sessions: ApiSession[];
  activeTeamIdsGlobal: Set<number>;
  prep?: PrepStatus;
  onPrepChanged: () => void;
  onStart: (teamIds: number[], hallLabel?: string) => Promise<number[]>;
  onEnd: (id: number, status: 'completed' | 'cancelled') => void;
}) {
  const halls = HALL_SPLITS[station.station_id];
  const unlabeled = halls ? sessions.filter((s) => !s.hall_label) : [];

  return (
    <View style={[styles.card, sessions.length > 0 && { borderColor: `${Colors.dark.gold}40` }]}>
      <View>
        <ThemedText type="smallBold">{station.name}</ThemedText>
        {station.hall_name && (
          <ThemedText type="small" themeColor="textSecondary">
            {station.hall_name}
          </ThemedText>
        )}
      </View>

      <PrepToggle stationId={station.station_id} prep={prep} onChanged={onPrepChanged} />

      {halls ? (
        <>
          {halls.map((hall) => (
            <HallGroup
              key={hall}
              label={hall}
              sessions={sessions.filter((s) => s.hall_label === hall)}
              activeTeamIdsGlobal={activeTeamIdsGlobal}
              onStart={(teamIds) => onStart(teamIds, hall)}
              onEnd={onEnd}
            />
          ))}
          {unlabeled.length > 0 && (
            <HallGroup
              sessions={unlabeled}
              activeTeamIdsGlobal={activeTeamIdsGlobal}
              onStart={(teamIds) => onStart(teamIds)}
              onEnd={onEnd}
            />
          )}
        </>
      ) : (
        <HallGroup
          sessions={sessions}
          activeTeamIdsGlobal={activeTeamIdsGlobal}
          onStart={(teamIds) => onStart(teamIds)}
          onEnd={onEnd}
        />
      )}
    </View>
  );
}

function MapTab({ activeSessions, prepStatuses }: { activeSessions: ApiSession[]; prepStatuses: PrepStatus[] }) {
  const { playButton } = useSoundEffects();
  const [activeFloor, setActiveFloor] = useState<Floor>('young-10f');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const floorStations = useMemo(() => allStations.filter((s) => s.floor === activeFloor), [activeFloor]);
  const selectedStation = allStations.find((s) => s.id === selectedId) ?? null;
  const FloorMap = FLOOR_MAPS[activeFloor];

  const { activeCounts, activeTeamIds, activePercents } = useMapAggregates(activeSessions);
  const isPreparing = useMemo(
    () => Object.fromEntries(prepStatuses.map((p) => [p.station_id, !!p.is_preparing])),
    [prepStatuses],
  );
  const prepTips = useMemo(
    () => Object.fromEntries(prepStatuses.filter((p) => p.tip).map((p) => [p.station_id, p.tip as string])),
    [prepStatuses],
  );

  const selectedSessions = selectedStation ? activeSessions.filter((s) => s.station_id === selectedStation.id) : [];

  return (
    <ScrollView contentContainerStyle={styles.mapTabContent}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorTabs}>
        {floors.map((floor) => {
          const isActive = floor === activeFloor;
          return (
            <SoundPressable
              key={floor}
              onPress={() => {
                setActiveFloor(floor);
                setSelectedId(null);
              }}
              style={[styles.floorTab, isActive && styles.floorTabActive]}>
              <ThemedText type="smallBold" style={isActive ? { color: Colors.dark.gold } : { color: Colors.dark.textSecondary }}>
                {floorLabels[floor]}
              </ThemedText>
            </SoundPressable>
          );
        })}
      </ScrollView>

      <Animated.View key={activeFloor} entering={FadeIn.duration(280)} style={styles.mapBox}>
        <FloorMap
          stations={floorStations}
          clearedIds={EMPTY_CLEARED}
          selectedId={selectedId}
          onSelect={(id) => {
            playButton();
            setSelectedId(id);
          }}
          activeCounts={activeCounts}
          activeTeamIds={activeTeamIds}
          activePercents={activePercents}
          isPreparing={isPreparing}
          prepTips={prepTips}
        />
      </Animated.View>

      {selectedStation && (
        <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOut.duration(150)}>
          <View style={styles.card}>
            <ThemedText type="smallBold" style={{ color: selectedStation.color }}>
              {selectedStation.hall} · {selectedStation.keyword}
            </ThemedText>
            {selectedSessions.length > 0 ? (
              selectedSessions.map((s) => (
                <ThemedText key={s.id} type="small" style={{ color: '#FB923C' }}>
                  🔴 {s.team_id}조{s.started_by_name ? ` · ${s.started_by_name}` : ''} · {sessionProgressPercent(s)}% ·{' '}
                  {formatRemaining(s.expected_end_at)} 남음
                </ThemedText>
              ))
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                지금 진행중인 팀이 없어요
              </ThemedText>
            )}
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

function GrantConfirmModal({
  teamId,
  station,
  onClose,
  onDone,
}: {
  teamId: number;
  station: Station;
  onClose: () => void;
  onDone: () => void;
}) {
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setGranting(true);
    setError('');
    try {
      await api.postTagEvent({ person_id: ADMIN_GRANT_PERSON_ID, team_id: teamId, station_id: station.id });
      onDone();
    } catch {
      setError('부여에 실패했어요. 다시 시도해주세요.');
      setGranting(false);
    }
  }

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.modalBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View entering={FadeInUp.duration(200)} style={styles.modalCard}>
        <ThemedText type="smallBold" style={{ color: Colors.dark.gold }}>
          믿음의 조각 부여
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {teamId}조에게 "{station.keyword}" 조각을 부여할까요? QR을 태그한 것과 동일하게 처리돼요.
        </ThemedText>
        {error !== '' && (
          <ThemedText type="small" style={styles.errorText}>
            {error}
          </ThemedText>
        )}
        <View style={styles.modalActions}>
          <SoundPressable
            onPress={onClose}
            disabled={granting}
            style={({ pressed }) => [styles.modalButtonGhost, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              아니오
            </ThemedText>
          </SoundPressable>
          <SoundPressable
            onPress={handleConfirm}
            disabled={granting}
            style={({ pressed }) => [styles.modalButtonGold, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
              {granting ? '부여 중...' : '예'}
            </ThemedText>
          </SoundPressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function GrantFragmentTab() {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [teamInput, setTeamInput] = useState('');
  const [teamError, setTeamError] = useState('');
  const [confirmTeamId, setConfirmTeamId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const selectedStation = allStations.find((s) => s.id === selectedStationId) ?? null;

  function handleGrantPress() {
    setSuccessMsg('');
    if (!selectedStation) return;
    const n = Number(teamInput);
    if (!Number.isInteger(n) || n < 1 || n > 24) {
      setTeamError('1~24 사이의 팀 번호를 입력해주세요');
      return;
    }
    setTeamError('');
    setConfirmTeamId(n);
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      <ThemedText type="small" themeColor="textSecondary">
        QR/NFC 스캔이 안 될 때, 게임과 조를 선택해서 태그한 것과 동일하게 조각을 부여할 수 있어요.
      </ThemedText>

      <ThemedText type="smallBold" style={styles.grantLabel}>
        게임 선택
      </ThemedText>
      <View style={styles.grantStationGrid}>
        {allStations.map((station) => {
          const selected = station.id === selectedStationId;
          return (
            <SoundPressable
              key={station.id}
              onPress={() => {
                setSelectedStationId(station.id);
                setSuccessMsg('');
              }}
              style={[
                styles.grantStationChip,
                selected && { borderColor: station.color, backgroundColor: `${station.color}22` },
              ]}>
              <ThemedText type="small" style={selected ? { color: station.color } : undefined}>
                {station.emoji} {station.keyword}
              </ThemedText>
            </SoundPressable>
          );
        })}
      </View>

      <ThemedText type="smallBold" style={styles.grantLabel}>
        조 번호
      </ThemedText>
      <TextInput
        value={teamInput}
        onChangeText={(v) => {
          setTeamInput(v);
          setTeamError('');
        }}
        placeholder="예: 7"
        placeholderTextColor={Colors.dark.textSecondary}
        keyboardType="number-pad"
        style={[styles.teamInput, teamError !== '' && { borderColor: '#F87171' }]}
      />
      {teamError !== '' && (
        <ThemedText type="small" style={styles.errorText}>
          {teamError}
        </ThemedText>
      )}

      <SoundPressable
        onPress={handleGrantPress}
        disabled={!selectedStation || !teamInput}
        style={({ pressed }) => [
          styles.startButton,
          styles.grantButton,
          (!selectedStation || !teamInput) && styles.grantButtonDisabled,
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
          믿음의 조각 부여
        </ThemedText>
      </SoundPressable>

      {successMsg !== '' && (
        <ThemedText type="small" style={{ color: Colors.dark.gold, textAlign: 'center' }}>
          {successMsg}
        </ThemedText>
      )}

      {confirmTeamId !== null && selectedStation && (
        <GrantConfirmModal
          teamId={confirmTeamId}
          station={selectedStation}
          onClose={() => setConfirmTeamId(null)}
          onDone={() => {
            setSuccessMsg(`${confirmTeamId}조에게 "${selectedStation.keyword}" 조각을 부여했어요.`);
            setConfirmTeamId(null);
            setTeamInput('');
          }}
        />
      )}
    </ScrollView>
  );
}

export default function AdminScreen() {
  const [tab, setTab] = useState<'stations' | 'map' | 'grant'>('stations');
  const [stations, setStations] = useState<ApiStation[]>([]);
  const { sessions, refresh: refreshSessions } = useActiveSessions();
  const { statuses: prepStatuses, refresh: refreshPrep } = usePrepStatuses();
  const prepByStation = useMemo(
    () => new Map(prepStatuses.map((p) => [p.station_id, p])),
    [prepStatuses],
  );

  const refreshStations = useCallback(async () => {
    // 숨은글자찾기는 물리적 방/세션 개념이 없는 QR 전용 스테이션이라 관리 목록에서 제외.
    setStations((await api.getStations(true)).filter((s) => !s.is_hidden));
  }, []);

  useEffect(() => {
    refreshStations();
    const timer = setInterval(refreshStations, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshStations]);

  const activeTeamIdsGlobal = useMemo(() => new Set(sessions.map((s) => s.team_id)), [sessions]);

  /** Starts a session per team id; returns the subset rejected because that team was already active elsewhere (409). */
  async function handleStart(stationId: string, teamIds: number[], hallLabel?: string): Promise<number[]> {
    const results = await Promise.allSettled(
      teamIds.map((teamId) => api.startSession({ station_id: stationId, team_id: teamId, hall_label: hallLabel })),
    );
    refreshSessions();
    return teamIds.filter((_, i) => {
      const r = results[i];
      return r.status === 'rejected' && r.reason instanceof ApiError && r.reason.status === 409;
    });
  }

  async function handleEnd(id: number, status: 'completed' | 'cancelled') {
    await api.endSession(id, { status, ended_by: 'admin' });
    refreshSessions();
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <SoundPressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ThemedText type="small">← 뒤로</ThemedText>
        </SoundPressable>
        <View>
          <ThemedText type="small" style={{ color: Colors.dark.gold }}>
            관리자 모드
          </ThemedText>
          <ThemedText type="smallBold">스테이션 현황</ThemedText>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <SoundPressable
          onPress={() => setTab('stations')}
          style={[styles.tabButton, tab === 'stations' && styles.tabButtonActive]}>
          <ThemedText type="smallBold" style={{ color: tab === 'stations' ? Colors.dark.gold : Colors.dark.textSecondary }}>
            📋 스테이션 관리
          </ThemedText>
        </SoundPressable>
        <SoundPressable onPress={() => setTab('map')} style={[styles.tabButton, tab === 'map' && styles.tabButtonActive]}>
          <ThemedText type="smallBold" style={{ color: tab === 'map' ? Colors.dark.gold : Colors.dark.textSecondary }}>
            🗺 MAP 페이지
          </ThemedText>
        </SoundPressable>
        <SoundPressable onPress={() => setTab('grant')} style={[styles.tabButton, tab === 'grant' && styles.tabButtonActive]}>
          <ThemedText type="smallBold" style={{ color: tab === 'grant' ? Colors.dark.gold : Colors.dark.textSecondary }}>
            ✨ 조각 부여
          </ThemedText>
        </SoundPressable>
      </View>

      {tab === 'stations' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {stations.map((station) => (
            <StationCard
              key={station.station_id}
              station={station}
              sessions={sessions.filter((s) => s.station_id === station.station_id)}
              activeTeamIdsGlobal={activeTeamIdsGlobal}
              prep={prepByStation.get(station.station_id)}
              onPrepChanged={refreshPrep}
              onStart={(teamIds, hallLabel) => handleStart(station.station_id, teamIds, hallLabel)}
              onEnd={handleEnd}
            />
          ))}
        </ScrollView>
      ) : tab === 'grant' ? (
        <GrantFragmentTab />
      ) : (
        <MapTab activeSessions={sessions} prepStatuses={prepStatuses} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  backButton: {
    paddingVertical: Spacing.one,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.five,
  },
  mapTabContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  floorTabs: {
    flexGrow: 0,
  },
  floorTab: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginRight: Spacing.two,
  },
  floorTabActive: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.45)',
  },
  mapBox: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
    backgroundColor: '#070D1C',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    padding: Spacing.two,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  prepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  prepToggle: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  prepToggleActive: {
    backgroundColor: '#FBBF24',
    borderColor: '#FBBF24',
  },
  prepTipInput: {
    flex: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: Colors.dark.text,
    fontSize: 12,
  },
  hallGroupBase: {
    gap: Spacing.two,
  },
  hallGroup: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  hallLabel: {
    color: Colors.dark.gold,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sessionTeam: {
    flex: 1,
  },
  smallButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(248,113,113,0.12)',
  },
  startRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  teamInput: {
    flex: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: Colors.dark.text,
  },
  startButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: Colors.dark.gold,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  errorText: {
    color: '#F87171',
  },
  grantLabel: {
    marginTop: Spacing.one,
  },
  grantStationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  grantStationChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  grantButton: {
    marginTop: Spacing.one,
    paddingVertical: Spacing.three,
  },
  grantButtonDisabled: {
    opacity: 0.4,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.six,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  modalButtonGhost: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalButtonGold: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: Colors.dark.gold,
  },
});
