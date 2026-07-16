import { Link, Stack, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CollectionBar } from '@/components/collection-bar';
import { RunnerProgressBar } from '@/components/runner-progress-bar';
import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { stations } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { formatRemaining, sessionProgressPercent, useActiveSessions } from '@/hooks/use-active-sessions';
import { useOverallStats } from '@/hooks/use-overall-stats';
import { useStationProgress } from '@/hooks/use-station-progress';
import { useTheme } from '@/hooks/use-theme';
import type { ApiSession } from '@/lib/api';

function StationCard({
  station,
  done,
  collectedLetters,
  activeSessions,
  index,
}: {
  station: (typeof stations)[number];
  done: boolean;
  collectedLetters: Set<number>;
  activeSessions: ApiSession[];
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(320)}>
      <Link href={{ pathname: '/station/[id]', params: { id: station.id } }} asChild>
        <SoundPressable style={({ pressed }) => pressed && styles.pressed}>
          <View
            style={[
              styles.card,
              {
                borderColor: done ? `${station.color}40` : 'rgba(255,255,255,0.07)',
                backgroundColor: done ? `${station.color}14` : 'rgba(17,24,39,0.7)',
              },
            ]}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: `${station.color}15`,
                  borderColor: `${station.color}35`,
                  shadowColor: station.color,
                  shadowOpacity: done ? 0.5 : 0,
                },
              ]}>
              <ThemedText style={styles.iconEmoji}>{station.emoji}</ThemedText>
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <ThemedText type="smallBold" numberOfLines={1} style={styles.cardHall}>
                  {station.keyword}
                </ThemedText>
                <View
                  style={[
                    styles.keywordBadge,
                    { backgroundColor: `${station.color}18`, borderColor: `${station.color}35` },
                  ]}>
                  <ThemedText style={{ color: station.color, fontSize: 11, fontWeight: '600' }}>
                    {station.hall}
                  </ThemedText>
                </View>
              </View>
              {activeSessions.length > 0 ? (
                <ThemedText type="small" numberOfLines={1} style={{ color: '#FB923C' }}>
                  🔴{' '}
                  {activeSessions
                    .map((s) => `${s.team_id}조 ${sessionProgressPercent(s)}% (${formatRemaining(s.expected_end_at)})`)
                    .join(', ')}{' '}
                  진행중
                </ThemedText>
              ) : (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {station.description}
                </ThemedText>
              )}

              {station.letters.length > 0 && (
                <View style={styles.dotsRow}>
                  {station.letters.map((li) => (
                    <View
                      key={li}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: collectedLetters.has(li)
                            ? station.color
                            : 'rgba(255,255,255,0.12)',
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.cardStatus}>
              {done ? (
                <View
                  style={[
                    styles.doneCircle,
                    { backgroundColor: `${station.color}25`, borderColor: `${station.color}50` },
                  ]}>
                  <ThemedText style={{ color: station.color, fontSize: 12 }}>✓</ThemedText>
                </View>
              ) : (
                <ThemedText themeColor="textSecondary">›</ThemedText>
              )}
            </View>
          </View>
        </SoundPressable>
      </Link>
    </Animated.View>
  );
}

export default function MapScreen() {
  const theme = useTheme();
  const { clearedIds, collectedLetters, newlyCollected } = useStationProgress();
  const { sessions: activeSessions } = useActiveSessions();
  const overallRatio = useOverallStats();
  const total = 10;
  const allDone = collectedLetters.size === total;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <SoundPressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
              <ThemedText style={{ color: theme.textSecondary }}>⚙️</ThemedText>
            </SoundPressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.overallBlock}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            전체팀 레이스 현황
          </ThemedText>
          <RunnerProgressBar percent={overallRatio * 100} mode="progress" />
        </View>

        <Link href="/collection" asChild>
          <SoundPressable style={({ pressed }) => pressed && styles.pressed}>
            <CollectionBar collectedIndices={collectedLetters} newlyCollected={newlyCollected} />
          </SoundPressable>
        </Link>

        <View style={styles.headingBlock}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            레이스 존
          </ThemedText>
          <View style={styles.headingRow}>
            <ThemedText type="subtitle" style={styles.headingText}>
              {stations.length}개 존을 만나보세요
            </ThemedText>
            <SoundPressable
              onPress={() => router.push('/floormap')}
              style={({ pressed }) => [styles.floorMapButton, pressed && styles.pressed]}>
              <ThemedText type="small" style={{ color: Colors.dark.gold }}>
                🗺 지도
              </ThemedText>
            </SoundPressable>
          </View>
        </View>

        <View style={styles.cardList}>
          {stations.map((station, index) => (
            <StationCard
              key={station.id}
              station={station}
              done={clearedIds.has(station.id)}
              collectedLetters={collectedLetters}
              activeSessions={activeSessions.filter((s) => s.station_id === station.id)}
              index={index}
            />
          ))}
        </View>

        {collectedLetters.size > 0 && (
          <Link href="/collection" asChild>
            <SoundPressable style={({ pressed }) => pressed && styles.pressed}>
              <View
                style={[
                  styles.collectionCta,
                  allDone
                    ? { backgroundColor: Colors.dark.gold }
                    : { backgroundColor: 'rgba(255,215,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: allDone ? Colors.dark.background : Colors.dark.gold }}>
                  {allDone ? '✦  완성된 메시지 보기' : `수집 현황 보기 (${collectedLetters.size}/${total})`}
                </ThemedText>
              </View>
            </SoundPressable>
          </Link>
        )}
      </ScrollView>

      <Link href="/scan" asChild>
        <SoundPressable sound="stamp" style={({ pressed }) => [styles.scanFab, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
            QR 스캔
          </ThemedText>
        </SoundPressable>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six + Spacing.five,
  },
  overallBlock: {
    gap: Spacing.two,
  },
  headingBlock: {
    gap: Spacing.one,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headingText: {
    flex: 1,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  floorMapButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  cardList: {
    gap: Spacing.three,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  iconEmoji: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardHall: {
    flexShrink: 1,
  },
  keywordBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: Spacing.one,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionCta: {
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  settingsButton: {
    padding: Spacing.two,
    marginRight: Spacing.two,
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
