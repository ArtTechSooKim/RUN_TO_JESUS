import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { Floor10Fashion, Floor10Young, Floor11Young } from '@/components/floor-map-svg';
import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { floorLabels, floors, stations as allStations, type Floor } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { formatRemaining, sessionProgressPercent, useActiveSessions } from '@/hooks/use-active-sessions';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { api, type ApiSession, type ApiStation } from '@/lib/api';

const POLL_MS = 5000;

const FLOOR_MAPS: Record<Floor, typeof Floor10Young> = {
  'young-10f': Floor10Young,
  'young-11f': Floor11Young,
  'fashion-10f': Floor10Fashion,
};

const EMPTY_CLEARED = new Set<string>();

function StationCard({
  station,
  sessions,
  onStart,
  onEnd,
}: {
  station: ApiStation;
  sessions: ApiSession[];
  onStart: (teamId: number) => void;
  onEnd: (id: number, status: 'completed' | 'cancelled') => void;
}) {
  const [teamInput, setTeamInput] = useState('');

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

      {sessions.map((s) => (
        <View key={s.id} style={styles.sessionRow}>
          <ThemedText type="small" style={styles.sessionTeam}>
            {s.team_id}조{s.started_by_name ? ` · ${s.started_by_name}` : ''} · {sessionProgressPercent(s)}% ·{' '}
            {formatRemaining(s.expected_end_at)}
          </ThemedText>
          <SoundPressable onPress={() => onEnd(s.id, 'cancelled')} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ color: '#F87171' }}>
              해지
            </ThemedText>
          </SoundPressable>
          <SoundPressable
            onPress={() => onEnd(s.id, 'completed')}
            style={({ pressed }) => [styles.smallButton, styles.smallButtonGold, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ color: '#34D399' }}>
              완료
            </ThemedText>
          </SoundPressable>
        </View>
      ))}

      <View style={styles.startRow}>
        <TextInput
          value={teamInput}
          onChangeText={setTeamInput}
          placeholder="팀 번호"
          placeholderTextColor={Colors.dark.textSecondary}
          keyboardType="number-pad"
          style={styles.teamInput}
        />
        <SoundPressable
          onPress={() => {
            const n = Number(teamInput);
            if (Number.isInteger(n) && n >= 1 && n <= 24 && !sessions.some((s) => s.team_id === n)) {
              onStart(n);
              setTeamInput('');
            }
          }}
          style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
          <ThemedText type="small" style={{ color: Colors.dark.background }}>
            세션 시작
          </ThemedText>
        </SoundPressable>
      </View>
    </View>
  );
}

function MapTab({ activeSessions }: { activeSessions: ApiSession[] }) {
  const { playButton } = useSoundEffects();
  const [activeFloor, setActiveFloor] = useState<Floor>('young-10f');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const floorStations = useMemo(() => allStations.filter((s) => s.floor === activeFloor), [activeFloor]);
  const selectedStation = allStations.find((s) => s.id === selectedId) ?? null;
  const FloorMap = FLOOR_MAPS[activeFloor];

  const activeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of activeSessions) counts[s.station_id] = (counts[s.station_id] ?? 0) + 1;
    return counts;
  }, [activeSessions]);

  const activeTeamIds = useMemo(() => {
    const ids: Record<string, number[]> = {};
    for (const s of activeSessions) (ids[s.station_id] ??= []).push(s.team_id);
    return ids;
  }, [activeSessions]);

  const activePercents = useMemo(() => {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const s of activeSessions) {
      sums[s.station_id] = (sums[s.station_id] ?? 0) + sessionProgressPercent(s);
      counts[s.station_id] = (counts[s.station_id] ?? 0) + 1;
    }
    const percents: Record<string, number> = {};
    for (const id of Object.keys(sums)) percents[id] = Math.round(sums[id] / counts[id]);
    return percents;
  }, [activeSessions]);

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

export default function AdminScreen() {
  const [tab, setTab] = useState<'stations' | 'map'>('stations');
  const [stations, setStations] = useState<ApiStation[]>([]);
  const { sessions, refresh: refreshSessions } = useActiveSessions();

  const refreshStations = useCallback(async () => {
    setStations(await api.getStations(true));
  }, []);

  useEffect(() => {
    refreshStations();
    const timer = setInterval(refreshStations, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshStations]);

  async function handleStart(stationId: string, teamId: number) {
    await api.startSession({ station_id: stationId, team_id: teamId });
    refreshSessions();
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
      </View>

      {tab === 'stations' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {stations.map((station) => (
            <StationCard
              key={station.station_id}
              station={station}
              sessions={sessions.filter((s) => s.station_id === station.station_id)}
              onStart={(teamId) => handleStart(station.station_id, teamId)}
              onEnd={handleEnd}
            />
          ))}
        </ScrollView>
      ) : (
        <MapTab activeSessions={sessions} />
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
  smallButtonGold: {
    backgroundColor: 'rgba(52,211,153,0.12)',
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
});
