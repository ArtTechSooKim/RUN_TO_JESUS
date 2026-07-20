import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { LetterPiece } from '@/components/letter-piece';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WildcardPiece } from '@/components/wildcard-piece';
import { RUN_TO_JESUS } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';

const SEPARATOR_AFTER = new Set([2, 4]); // RUN | TO | JESUS

type CollectionBarProps = {
  collectedIndices: Set<number>;
  newlyCollected?: number | null;
  /** 새로운시네마 2번째/3번째 방문 보너스 — 포지션이 없어 collectedIndices/진행률에는 안 섞이고 글자 줄 끝에 따로만 붙는다. */
  wildcardCount?: number;
};

export function CollectionBar({ collectedIndices, newlyCollected = null, wildcardCount = 0 }: CollectionBarProps) {
  const total = RUN_TO_JESUS.length;
  const collected = collectedIndices.size;
  const progress = useSharedValue(collected / total);

  useEffect(() => {
    progress.value = withTiming(collected / total, { duration: 800 });
  }, [collected, progress, total]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          우리팀 레이스 현황{'\n'}글자 조각 수집
        </ThemedText>
        <ThemedText
          type="smallBold"
          style={collected === total ? { color: Colors.dark.gold } : undefined}>
          {collected} / {total}
        </ThemedText>
      </View>

      <View style={styles.lettersRow}>
        {RUN_TO_JESUS.split('').map((letter, index) => (
          <View key={index} style={styles.letterSlot}>
            <LetterPiece
              letter={letter}
              collected={collectedIndices.has(index)}
              size="sm"
              animateIn={index === newlyCollected}
            />
            {SEPARATOR_AFTER.has(index) && (
              <ThemedText themeColor="textSecondary" style={styles.separator}>
                ·
              </ThemedText>
            )}
          </View>
        ))}
        {wildcardCount > 0 && (
          <View style={styles.letterSlot}>
            <ThemedText themeColor="textSecondary" style={styles.separator}>
              ✨
            </ThemedText>
            {Array.from({ length: wildcardCount }, (_, i) => (
              <WildcardPiece key={i} index={i} size={24} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lettersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  letterSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  separator: {
    fontSize: 10,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
});
