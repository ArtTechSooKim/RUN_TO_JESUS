import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CollectionBar } from '@/components/collection-bar';
import { Floor10Fashion, Floor10Young, Floor11Young } from '@/components/floor-map-svg';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { floorLabels, floors, stations, type Floor } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { useStationProgress } from '@/hooks/use-station-progress';
import { useTheme } from '@/hooks/use-theme';

const FLOOR_MAPS: Record<Floor, typeof Floor10Young> = {
  'young-10f': Floor10Young,
  'young-11f': Floor11Young,
  'fashion-10f': Floor10Fashion,
};

export default function MapScreen() {
  const theme = useTheme();
  const { clearedIds, collectedLetters, newlyCollected, toggleCleared } = useStationProgress();
  const [activeFloor, setActiveFloor] = useState<Floor>('young-10f');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const floorStations = useMemo(
    () => stations.filter((s) => s.floor === activeFloor),
    [activeFloor],
  );
  const selectedStation = stations.find((s) => s.id === selectedId) ?? null;
  const FloorMap = FLOOR_MAPS[activeFloor];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Link href="/collection" asChild>
          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <CollectionBar collectedIndices={collectedLetters} newlyCollected={newlyCollected} />
          </Pressable>
        </Link>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorTabs}>
          {floors.map((floor) => {
            const isActive = floor === activeFloor;
            return (
              <Pressable
                key={floor}
                onPress={() => {
                  setActiveFloor(floor);
                  setSelectedId(null);
                }}
                style={[
                  styles.floorTab,
                  { borderColor: theme.textSecondary },
                  isActive && { backgroundColor: theme.text, borderColor: theme.text },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={isActive ? { color: theme.background } : undefined}>
                  {floorLabels[floor]}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.mapBox}>
          <FloorMap
            stations={floorStations}
            clearedIds={clearedIds}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </View>

        <View style={styles.legend}>
          {floorStations.map((s) => (
            <View key={s.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {s.hall} — {s.keyword}
              </ThemedText>
            </View>
          ))}
        </View>

        {selectedStation && (
          <ThemedView type="backgroundElement" style={styles.detailCard}>
            <ThemedText type="smallBold" style={{ color: selectedStation.color }}>
              {selectedStation.hall} · {selectedStation.keyword}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {selectedStation.characterTitle} · 담당 {selectedStation.lead}
            </ThemedText>
            <ThemedText type="small">
              {clearedIds.has(selectedStation.id) ? '클리어 완료' : '아직 탐험 전'}
            </ThemedText>
            <ThemedView style={styles.detailActions}>
              <Link href={{ pathname: '/station/[id]', params: { id: selectedStation.id } }} asChild>
                <Pressable style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
                  <ThemedText type="link">스테이션 자세히 보기</ThemedText>
                </Pressable>
              </Link>
              <Pressable
                onPress={() => toggleCleared(selectedStation.id)}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
                <ThemedText type="link">
                  {clearedIds.has(selectedStation.id)
                    ? '클리어 취소 (테스트용)'
                    : '클리어 처리 (테스트용)'}
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        )}
      </ScrollView>

      <Link href="/scan" asChild>
        <Pressable style={({ pressed }) => [styles.scanFab, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
            QR 스캔
          </ThemedText>
        </Pressable>
      </Link>
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
    marginRight: Spacing.two,
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
    flexDirection: 'row',
    gap: Spacing.four,
    backgroundColor: 'transparent',
  },
  linkButton: {
    marginTop: Spacing.two,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  scanFab: {
    position: 'absolute',
    bottom: Spacing.five,
    alignSelf: 'center',
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
    shadowColor: Colors.dark.gold,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
