import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { api, type ApiSession, type ApiStation } from '@/lib/api';

const POLL_MS = 5000;

function formatRemaining(expectedEndAt: string) {
  const ms = new Date(expectedEndAt).getTime() - Date.now();
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
  const atCapacity = sessions.length >= station.concurrent_capacity;

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
            {s.team_id}조{s.started_by_name ? ` · ${s.started_by_name}` : ''} · {formatRemaining(s.expected_end_at)}
          </ThemedText>
          <Pressable onPress={() => onEnd(s.id, 'cancelled')} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ color: '#F87171' }}>
              해지
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => onEnd(s.id, 'completed')}
            style={({ pressed }) => [styles.smallButton, styles.smallButtonGold, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ color: '#34D399' }}>
              완료
            </ThemedText>
          </Pressable>
        </View>
      ))}

      {!atCapacity && (
        <View style={styles.startRow}>
          <TextInput
            value={teamInput}
            onChangeText={setTeamInput}
            placeholder="팀 번호"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="number-pad"
            style={styles.teamInput}
          />
          <Pressable
            onPress={() => {
              const n = Number(teamInput);
              if (Number.isInteger(n) && n >= 1 && n <= 24) {
                onStart(n);
                setTeamInput('');
              }
            }}
            style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ color: Colors.dark.background }}>
              세션 시작
            </ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function AdminScreen() {
  const [stations, setStations] = useState<ApiStation[]>([]);
  const [sessions, setSessions] = useState<ApiSession[]>([]);

  const refresh = useCallback(async () => {
    const [stationList, sessionList] = await Promise.all([
      api.getStations(true),
      api.getSessions('in_progress'),
    ]);
    setStations(stationList);
    setSessions(sessionList);
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  async function handleStart(stationId: string, teamId: number) {
    await api.startSession({ station_id: stationId, team_id: teamId });
    refresh();
  }

  async function handleEnd(id: number, status: 'completed' | 'cancelled') {
    await api.endSession(id, { status, ended_by: 'admin' });
    refresh();
  }

  const inProgressCount = sessions.length;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ThemedText type="small">← 뒤로</ThemedText>
        </Pressable>
        <View>
          <ThemedText type="small" style={{ color: Colors.dark.gold }}>
            관리자 모드
          </ThemedText>
          <ThemedText type="smallBold">스테이션 현황</ThemedText>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <ThemedText type="smallBold" style={{ color: Colors.dark.gold }}>
            {inProgressCount}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            진행중
          </ThemedText>
        </View>
        <View style={styles.summaryBox}>
          <ThemedText type="smallBold">{stations.length}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            전체 스테이션
          </ThemedText>
        </View>
      </View>

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
  summaryBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.five,
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
