import { ScrollView, StyleSheet, View } from 'react-native';

import { LetterPiece } from '@/components/letter-piece';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RUN_TO_JESUS } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { useStationProgress } from '@/hooks/use-station-progress';

const WORDS = [
  { word: 'RUN', indices: [0, 1, 2] },
  { word: 'TO', indices: [3, 4] },
  { word: 'JESUS', indices: [5, 6, 7, 8, 9] },
];

export default function CollectionScreen() {
  const { collectedLetters } = useStationProgress();
  const total = RUN_TO_JESUS.length;
  const collected = collectedLetters.size;
  const allCollected = collected === total;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
          믿음의 경주 완성
        </ThemedText>

        <View style={styles.wordsBlock}>
          {WORDS.map((w) => (
            <View key={w.word} style={styles.wordRow}>
              {w.indices.map((li) => (
                <LetterPiece
                  key={li}
                  letter={RUN_TO_JESUS[li]}
                  collected={collectedLetters.has(li)}
                  size="lg"
                />
              ))}
            </View>
          ))}
        </View>

        {allCollected ? (
          <View style={styles.finalBlock}>
            <View style={styles.divider} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.verse}>
              "우리에게 구름 같이 둘러싼 허다한 증인들이 있으니{'\n'}
              모든 무거운 것과 얽매이기 쉬운 죄를 벗어 버리고{'\n'}
              인내로써 우리 앞에 당한 경주를 하며" — 히브리서 12:1
            </ThemedText>

            <ThemedView type="backgroundElement" style={styles.messageCard}>
              <ThemedText type="small" style={styles.messageText}>
                우리는 서로 다른 공동체에 속해 있었지만,{'\n'}
                사실 같은 경주를 달리고 있었다.{'\n\n'}
                그리고 그 경주의 목표는{'\n'}
                오직 예수 그리스도이시다.
              </ThemedText>
            </ThemedView>

            <ThemedText type="small" themeColor="textSecondary" style={styles.batonLabel}>
              다음 세대에게 바통을
            </ThemedText>
          </View>
        ) : (
          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${(collected / total) * 100}%` }]}
              />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {collected}/{total} 조각 수집 — 아직 {total - collected}개가 남아있습니다
            </ThemedText>
          </View>
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
    gap: Spacing.five,
    padding: Spacing.four,
    alignItems: 'center',
    paddingTop: Spacing.six,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  wordsBlock: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  wordRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  progressBlock: {
    gap: Spacing.two,
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  finalBlock: {
    gap: Spacing.four,
    alignItems: 'center',
    width: '100%',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,215,0,0.5)',
  },
  verse: {
    textAlign: 'center',
    lineHeight: 22,
  },
  messageCard: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  messageText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  batonLabel: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: Colors.dark.gold,
  },
});
