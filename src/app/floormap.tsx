import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { Floor10Fashion, Floor10Young, Floor11Young } from '@/components/floor-map-svg';
import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { floorLabels, floors, stations, type Floor } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { formatRemaining, sessionProgressPercent, useActiveSessions, useMapAggregates } from '@/hooks/use-active-sessions';
import { usePrepStatuses } from '@/hooks/use-prep-status';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { useStationProgress } from '@/hooks/use-station-progress';

const FLOOR_MAPS: Record<Floor, typeof Floor10Young> = {
  'young-10f': Floor10Young,
  'young-11f': Floor11Young,
  'fashion-10f': Floor10Fashion,
};

export default function FloorMapScreen() {
  const { clearedIds, cancelStation } = useStationProgress();
  const { sessions: activeSessions } = useActiveSessions();
  const { statuses: prepStatuses } = usePrepStatuses();
  const { playButton } = useSoundEffects();
  const [activeFloor, setActiveFloor] = useState<Floor>('young-10f');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const floorStations = useMemo(
    () => stations.filter((s) => s.floor === activeFloor),
    [activeFloor],
  );
  const selectedStation = stations.find((s) => s.id === selectedId) ?? null;
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

  const selectedSessions = selectedStation
    ? activeSessions.filter((s) => s.station_id === selectedStation.id)
    : [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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
                style={[
                  styles.floorTab,
                  isActive && styles.floorTabActive,
                ]}>
                <ThemedText
                  type="smallBold"
                  style={isActive ? { color: Colors.dark.gold } : { color: Colors.dark.textSecondary }}>
                  {floorLabels[floor]}
                </ThemedText>
              </SoundPressable>
            );
          })}
        </ScrollView>

        <Animated.View key={activeFloor} entering={FadeIn.duration(280)} style={styles.mapBox}>
          <FloorMap
            stations={floorStations}
            clearedIds={clearedIds}
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

        <Animated.View key={`legend-${activeFloor}`} entering={FadeIn.duration(280)} style={styles.legend}>
          {floorStations.map((s) => (
            <View key={s.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {s.hall} — {s.keyword}
              </ThemedText>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
            <ThemedText type="small" themeColor="textSecondary">
              탭하여 입장
            </ThemedText>
          </View>
        </Animated.View>

        {selectedStation && (
          <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOut.duration(150)}>
            <ThemedView type="backgroundElement" style={styles.detailCard}>
              <ThemedText type="smallBold" style={{ color: selectedStation.color }}>
                {selectedStation.hall} · {selectedStation.keyword}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {selectedStation.characterTitle} · 담당 {selectedStation.lead}
              </ThemedText>
              {selectedSessions.length > 0 ? (
                <ThemedText type="small" style={{ color: '#FB923C' }}>
                  🔴{' '}
                  {selectedSessions
                    .map((s) => `${s.team_id}조 ${sessionProgressPercent(s)}% (${formatRemaining(s.expected_end_at)} 남음)`)
                    .join(', ')}{' '}
                  진행중
                </ThemedText>
              ) : (
                <ThemedText type="small">
                  {clearedIds.has(selectedStation.id) ? '클리어 완료' : '아직 도착 전'}
                </ThemedText>
              )}
              <View style={styles.detailActions}>
                <Link href={{ pathname: '/station/[id]', params: { id: selectedStation.id } }} asChild>
                  <SoundPressable style={({ pressed }) => pressed && styles.pressed}>
                    <View style={[styles.primaryButton, { backgroundColor: selectedStation.color }]}>
                      <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
                        스테이션 자세히 보기 →
                      </ThemedText>
                    </View>
                  </SoundPressable>
                </Link>
                {clearedIds.has(selectedStation.id) && (
                  <SoundPressable
                    onPress={() => cancelStation(selectedStation.id)}
                    style={({ pressed }) => [styles.secondaryButton, { borderColor: 'rgba(248,113,113,0.4)' }, pressed && styles.pressed]}>
                    <ThemedText type="small" style={{ color: '#F87171' }}>
                      잘못 태그했어요 (취소)
                    </ThemedText>
                  </SoundPressable>
                )}
              </View>
            </ThemedView>
          </Animated.View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailCard: {
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  detailActions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  primaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: Spacing.two + 2,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
