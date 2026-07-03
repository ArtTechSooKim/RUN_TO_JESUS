import { StyleSheet, View } from 'react-native';

import { LetterPiece } from '@/components/letter-piece';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RUN_TO_JESUS } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';

const SEPARATOR_AFTER = new Set([2, 4]); // RUN | TO | JESUS

type CollectionBarProps = {
  collectedIndices: Set<number>;
};

export function CollectionBar({ collectedIndices }: CollectionBarProps) {
  const total = RUN_TO_JESUS.length;
  const collected = collectedIndices.size;

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          글자 조각 수집
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
            <LetterPiece letter={letter} collected={collectedIndices.has(index)} size="sm" />
            {SEPARATOR_AFTER.has(index) && (
              <ThemedText themeColor="textSecondary" style={styles.separator}>
                ·
              </ThemedText>
            )}
          </View>
        ))}
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(collected / total) * 100}%` },
          ]}
        />
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
