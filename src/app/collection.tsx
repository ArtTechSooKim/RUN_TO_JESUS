import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GoldParticles } from '@/components/gold-particles';
import { StarField } from '@/components/star-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WildcardPiece } from '@/components/wildcard-piece';
import { RUN_TO_JESUS } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { useStationProgress } from '@/hooks/use-station-progress';

const WORDS = [
  { word: 'RUN', indices: [0, 1, 2] },
  { word: 'TO', indices: [3, 4] },
  { word: 'JESUS', indices: [5, 6, 7, 8, 9] },
];

const ASSEMBLY_STEP_MS = 180;

type Phase = 'idle' | 'assembling' | 'bloom' | 'complete' | 'verse' | 'message';

function EndingLetterTile({
  letter,
  index,
  collected,
  isComplete,
  delayMs,
}: {
  letter: string;
  index: number;
  collected: boolean;
  isComplete: boolean;
  delayMs: number;
}) {
  const scatterX = ((index * 137) % 200) - 100;
  const scatterY = ((index * 89) % 160) - 80;

  const progress = useSharedValue(collected ? 0 : 1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!collected) return;
    progress.value = withDelay(delayMs, withSpring(1, { damping: 20, stiffness: 200 }));
  }, [collected, delayMs, progress]);

  useEffect(() => {
    if (!isComplete || !collected) {
      glow.value = 0;
      return;
    }
    glow.value = withDelay(
      index * 60,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [isComplete, collected, index, glow]);

  const tileStyle = useAnimatedStyle(() => {
    if (!collected) return { opacity: 0.12, transform: [{ scale: 1 }] };
    return {
      opacity: 1,
      transform: [
        { translateX: scatterX * (1 - progress.value) },
        { translateY: scatterY * (1 - progress.value) },
        { scale: 0.4 + 0.6 * progress.value },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.2 + glow.value * 0.5,
    shadowRadius: 8 + glow.value * 16,
  }));

  return (
    <Animated.View
      style={[
        styles.tile,
        tileStyle,
        glowStyle,
        {
          backgroundColor: collected ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.03)',
          borderColor: collected ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.08)',
          shadowColor: Colors.dark.gold,
        },
      ]}>
      <ThemedText style={{ fontSize: 22, fontWeight: '700', color: collected ? Colors.dark.gold : 'rgba(255,255,255,0.1)' }}>
        {collected ? letter : '·'}
      </ThemedText>
    </Animated.View>
  );
}

export default function CollectionScreen() {
  const { collectedLetters, wildcardCount, loading } = useStationProgress();
  const total = RUN_TO_JESUS.length;
  const collected = collectedLetters.size;
  const allCollected = collected === total;

  const [phase, setPhase] = useState<Phase>('idle');
  const played = useRef(false);

  useEffect(() => {
    if (!allCollected || played.current) return;
    played.current = true;
    setPhase('assembling');
    const lastLetterDelay = (total - 1) * ASSEMBLY_STEP_MS + 400;
    const t1 = setTimeout(() => setPhase('bloom'), lastLetterDelay);
    const t2 = setTimeout(() => setPhase('complete'), lastLetterDelay + 1000);
    const t3 = setTimeout(() => setPhase('verse'), lastLetterDelay + 2400);
    const t4 = setTimeout(() => setPhase('message'), lastLetterDelay + 4900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [allCollected, total]);

  const isComplete = phase === 'complete' || phase === 'verse' || phase === 'message';
  const showBloom = phase === 'bloom';
  const showVerse = phase === 'verse' || phase === 'message';
  const showMessage = phase === 'message';

  const bloomFlash = useSharedValue(0);
  const bloomRing = useSharedValue(0);
  useEffect(() => {
    if (!showBloom) return;
    bloomFlash.value = withSequence(withTiming(1, { duration: 50 }), withTiming(0, { duration: 1400 }));
    bloomRing.value = 0;
    bloomRing.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) });
  }, [showBloom, bloomFlash, bloomRing]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: bloomFlash.value * 0.08 }));
  const ringStyle = useAnimatedStyle(() => ({
    width: 60 + bloomRing.value * 640,
    height: 60 + bloomRing.value * 640,
    borderRadius: (60 + bloomRing.value * 640) / 2,
    opacity: (1 - bloomRing.value) * 0.9,
    marginLeft: -(60 + bloomRing.value * 640) / 2,
    marginTop: -(60 + bloomRing.value * 640) / 2,
  }));

  let letterCounter = 0;

  return (
    <ThemedView style={styles.container}>
      {isComplete && <StarField count={40} />}
      {isComplete && <GoldParticles count={22} />}

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
          믿음의 경주 완성
        </ThemedText>

        <View style={styles.wordsBlockWrapper}>
          {showBloom && (
            <>
              <Animated.View style={[styles.bloomFlash, flashStyle]} />
              <Animated.View style={[styles.bloomRing, ringStyle]} />
            </>
          )}
          <View style={styles.wordsBlock}>
            {WORDS.map((w) => (
              <View key={w.word} style={styles.wordRow}>
                {w.indices.map((li) => {
                  const isCollected = collectedLetters.has(li);
                  const delay = allCollected ? letterCounter * ASSEMBLY_STEP_MS + 100 : 0;
                  if (isCollected) letterCounter++;
                  return (
                    <EndingLetterTile
                      key={li}
                      letter={RUN_TO_JESUS[li]}
                      index={li}
                      collected={isCollected}
                      isComplete={isComplete}
                      delayMs={delay}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {wildcardCount > 0 && (
          <View style={styles.wildcardRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.wildcardLabel}>
              ✨ 보너스 조각
            </ThemedText>
            <View style={styles.wildcardTiles}>
              {Array.from({ length: wildcardCount }, (_, i) => (
                <WildcardPiece key={i} index={i} size={32} />
              ))}
            </View>
          </View>
        )}

        {allCollected ? (
          showVerse && (
            <View style={styles.finalBlock}>
              <View style={styles.divider} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.verse}>
                "우리에게 구름 같이 둘러싼 허다한 증인들이 있으니{'\n'}
                모든 무거운 것과 얽매이기 쉬운 죄를 벗어 버리고{'\n'}
                인내로써 우리 앞에 당한 경주를 하며" — 히브리서 12:1
              </ThemedText>

              {showMessage && (
                <>
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
                </>
              )}
            </View>
          )
        ) : loading ? (
          <ThemedText type="small" themeColor="textSecondary">
            불러오는 중...
          </ThemedText>
        ) : (
          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(collected / total) * 100}%` }]} />
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
  wordsBlockWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordsBlock: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  wordRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  tile: {
    width: 44,
    height: 52,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  wildcardRow: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  wildcardLabel: {
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  wildcardTiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  bloomFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  bloomRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.5)',
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
