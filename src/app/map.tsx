import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { FloorPlanMap, type StationStatus } from '@/components/floor-plan-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { floors, stations, type Floor } from '@/constants/stations';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function randomCrowd() {
  return Math.floor(Math.random() * 12);
}

export default function MapScreen() {
  const theme = useTheme();
  const [activeFloor, setActiveFloor] = useState<Floor>('young-10f');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusById, setStatusById] = useState<Record<string, StationStatus>>(() =>
    Object.fromEntries(stations.map((s) => [s.id, { cleared: false, crowdCount: randomCrowd() }])),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusById((prev) => {
        const next = { ...prev };
        for (const station of stations) {
          if (next[station.id].cleared) continue;
          next[station.id] = { ...next[station.id], crowdCount: randomCrowd() };
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const floorStations = useMemo(
    () => stations.filter((s) => s.floor === activeFloor),
    [activeFloor],
  );
  const currentFloor = floors.find((f) => f.id === activeFloor)!;
  const selectedStation = stations.find((s) => s.id === selectedId) ?? null;
  const selectedStatus = selectedId ? statusById[selectedId] : null;

  function toggleCleared(id: string) {
    setStatusById((prev) => ({
      ...prev,
      [id]: { ...prev[id], cleared: !prev[id].cleared },
    }));
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorTabs}>
          {floors.map((floor) => {
            const isActive = floor.id === activeFloor;
            return (
              <Pressable
                key={floor.id}
                onPress={() => {
                  setActiveFloor(floor.id);
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
                  {floor.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <FloorPlanMap
          image={currentFloor.image}
          stations={floorStations}
          statusById={statusById}
          selectedId={selectedId}
          onSelectStation={setSelectedId}
        />

        <ThemedView type="backgroundElement" style={styles.legend}>
          <LegendItem color="#9aa0a8" label="미탐험" />
          <LegendItem color="#f2b94b" label="보통" />
          <LegendItem color="#e5484d" label="혼잡" />
          <LegendItem color="#3ba55c" label="클리어" />
        </ThemedView>

        {selectedStation && selectedStatus && (
          <ThemedView type="backgroundElement" style={styles.detailCard}>
            <ThemedText type="smallBold">
              {selectedStation.name} · {selectedStation.hall}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {selectedStation.characters} · 담당 {selectedStation.lead}
            </ThemedText>
            <ThemedText type="small">
              현재 인원 {selectedStatus.crowdCount}명 ·{' '}
              {selectedStatus.cleared ? '클리어 완료' : '아직 탐험 전'}
            </ThemedText>
            <Pressable
              onPress={() => toggleCleared(selectedStation.id)}
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
              <ThemedText type="link">
                {selectedStatus.cleared ? '클리어 취소 (테스트용)' : '클리어 처리 (테스트용)'}
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <ThemedView style={styles.legendItem}>
      <ThemedView style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="small">{label}</ThemedText>
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailCard: {
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
