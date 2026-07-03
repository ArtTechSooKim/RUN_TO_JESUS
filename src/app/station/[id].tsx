import { LinearGradient } from 'expo-linear-gradient';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { HeroParticles } from '@/components/hero-particles';
import { LetterPiece } from '@/components/letter-piece';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RUN_TO_JESUS, stations } from '@/constants/stations';
import { Spacing } from '@/constants/theme';
import { useStationProgress } from '@/hooks/use-station-progress';

function EmojiGlow({ emoji, color }: { emoji: string; color: string }) {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [glow]);

  const style = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + glow.value * 0.5,
    shadowRadius: 10 + glow.value * 14,
  }));

  return (
    <Animated.View style={[style, { shadowColor: color, shadowOffset: { width: 0, height: 0 } }]}>
      <ThemedText style={styles.heroEmoji}>{emoji}</ThemedText>
    </Animated.View>
  );
}

function ScanCta({ color, onPress }: { color: string; onPress?: () => void }) {
  const glow = useSharedValue(0);
  const sweep = useSharedValue(-1);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    sweep.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.linear }),
        withTiming(-1, { duration: 1 }),
      ),
      -1,
    );
  }, [glow, sweep]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.2 + glow.value * 0.4,
    shadowRadius: 8 + glow.value * 14,
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sweep.value * 260 }],
  }));

  return (
    <Link href="/scan" asChild>
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        <Animated.View
          style={[
            styles.ctaButton,
            glowStyle,
            { borderColor: `${color}90`, shadowColor: color, shadowOffset: { width: 0, height: 0 } },
          ]}>
          <Animated.View style={[styles.ctaSweep, sweepStyle, { backgroundColor: `${color}25` }]} />
          <ThemedText type="smallBold" style={{ color }}>
            QR 코드 스캔하기
          </ThemedText>
        </Animated.View>
      </Pressable>
    </Link>
  );
}

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const station = stations.find((s) => s.id === id);
  const { clearedIds, toggleCleared } = useStationProgress();
  const [showQr, setShowQr] = useState(false);

  if (!station) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>스테이션을 찾을 수 없어요.</ThemedText>
      </ThemedView>
    );
  }

  const cleared = clearedIds.has(station.id);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: station.hall }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.hero,
            { backgroundColor: `${station.color}22`, borderColor: `${station.color}55` },
          ]}>
          <LinearGradient
            colors={[`${station.color}40`, `${station.color}00`]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <HeroParticles color={station.color} />
          <EmojiGlow emoji={station.emoji} color={station.color} />
          <Animated.View
            entering={FadeIn.delay(300).duration(500)}
            style={[
              styles.keywordBadge,
              { backgroundColor: `${station.color}25`, borderColor: `${station.color}70` },
            ]}>
            <ThemedText type="smallBold" style={{ color: station.color }}>
              {station.keyword}
            </ThemedText>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.titleBlock}>
          <ThemedText type="small" style={[styles.hallLabel, { color: station.color }]}>
            {station.hall}
          </ThemedText>
          <ThemedText type="subtitle">{station.characterTitle}</ThemedText>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: `${station.color}40` }]} />

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.block}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            핵심 질문
          </ThemedText>
          <ThemedText type="default" style={styles.coreQuestion}>
            "{station.coreQuestion}"
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
            {station.description}
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(360).duration(400)}
          style={[styles.verseCard, { borderColor: `${station.color}30` }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.verseText}>
            {station.verse}
          </ThemedText>
        </Animated.View>

        <View style={styles.letterRow}>
          <ThemedText type="small" themeColor="textSecondary">
            획득 조각
          </ThemedText>
          <View style={styles.letterChips}>
            {station.letters.map((li) => (
              <LetterPiece key={li} letter={RUN_TO_JESUS[li]} collected={cleared} size="sm" />
            ))}
          </View>
        </View>

        {cleared ? (
          <View style={styles.doneBlock}>
            <View
              style={[
                styles.doneBadge,
                { backgroundColor: `${station.color}20`, borderColor: `${station.color}60` },
              ]}>
              <ThemedText style={{ color: station.color }}>✓</ThemedText>
            </View>
            <ThemedText type="smallBold" style={{ color: station.color }}>
              이 스테이션 완료!
            </ThemedText>
            <Pressable
              onPress={() => toggleCleared(station.id)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="link">완료 취소 (테스트용)</ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.ctaBlock}>
            <ScanCta color={station.color} />
            <Pressable
              onPress={() => toggleCleared(station.id)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="small" themeColor="textSecondary">
                스캔이 안 될 때: 직접 완료 처리 (수동 백업)
              </ThemedText>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={() => setShowQr((v) => !v)}
          style={({ pressed }) => [styles.qrToggle, pressed && styles.pressed]}>
          <ThemedText type="small" themeColor="textSecondary">
            {showQr ? '테스트용 QR 코드 닫기' : '테스트용 QR 코드 보기'}
          </ThemedText>
        </Pressable>
        {showQr && (
          <View style={styles.qrOuter}>
            <View style={styles.qrBox}>
              <QRCode value={station.id} size={160} backgroundColor="#fff" />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              다른 기기의 스캔 화면으로 이 코드를 찍어보세요
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
    gap: Spacing.four,
    padding: Spacing.four,
  },
  hero: {
    height: 160,
    borderRadius: Spacing.four,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    overflow: 'hidden',
  },
  heroEmoji: {
    fontSize: 48,
  },
  keywordBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
  titleBlock: {
    gap: Spacing.half,
  },
  hallLabel: {
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  divider: {
    height: 1,
  },
  block: {
    gap: Spacing.two,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  coreQuestion: {
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 28,
  },
  description: {
    lineHeight: 22,
  },
  verseCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  verseText: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
  letterRow: {
    gap: Spacing.two,
  },
  letterChips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  ctaBlock: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 2,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ctaSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    left: -100,
    transform: [{ skewX: '-20deg' }],
  },
  qrToggle: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  qrOuter: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  qrBox: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: '#fff',
  },
  doneBlock: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  doneBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
