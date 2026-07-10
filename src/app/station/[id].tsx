import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { HeroParticles } from '@/components/hero-particles';
import { LetterPiece } from '@/components/letter-piece';
import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { floorLabels, QR_PREFIX, RUN_TO_JESUS, STATION_ALIASES, stations } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { useStationProgress } from '@/hooks/use-station-progress';

function InfoBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={[styles.infoBadge, { backgroundColor: `${color}18`, borderColor: `${color}45` }]}>
      <ThemedText style={styles.infoBadgeIcon}>{icon}</ThemedText>
      <ThemedText type="small" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

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
      <SoundPressable sound="stamp" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
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
      </SoundPressable>
    </Link>
  );
}

function NfcCta({ color }: { color: string }) {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glow.value * 0.35,
    shadowRadius: 12 + glow.value * 14,
  }));

  return (
    <Link href="/nfc-scan" asChild>
      <SoundPressable sound="stamp" style={({ pressed }) => pressed && styles.pressed}>
        <Animated.View
          style={[styles.nfcButton, glowStyle, { backgroundColor: color, shadowColor: color }]}>
          <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
            NFC 태그 스캔하기
          </ThemedText>
        </Animated.View>
      </SoundPressable>
    </Link>
  );
}

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resolvedId = id ? (STATION_ALIASES[id] ?? id) : id;
  const station = stations.find((s) => s.id === resolvedId);
  const { clearedIds, recordManualComplete, cancelStation } = useStationProgress();
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
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <SvgLinearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={station.color} stopOpacity={0.25} />
                <Stop offset="1" stopColor={station.color} stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height="100%" fill="url(#heroGradient)" />
          </Svg>
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

        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.badgeRow}>
          <InfoBadge icon="📍" label={station.hall} color={station.color} />
          {station.floor && (
            <InfoBadge icon="🏢" label={floorLabels[station.floor]} color={station.color} />
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(260).duration(400)}
          style={[styles.descriptionCard, { borderColor: `${station.color}30`, backgroundColor: `${station.color}0D` }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            게임 소개
          </ThemedText>
          <ThemedText type="default" style={styles.description}>
            {station.description}
          </ThemedText>
        </Animated.View>

        {station.letters.length > 0 && (
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
        )}

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
            <SoundPressable
              onPress={() => cancelStation(station.id)}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
              <ThemedText type="small" style={{ color: '#F87171' }}>
                잘못 태그했어요 (취소)
              </ThemedText>
            </SoundPressable>
          </View>
        ) : (
          <View style={styles.ctaBlock}>
            <NfcCta color={station.color} />
            <ScanCta color={station.color} />
            <SoundPressable
              onPress={() => recordManualComplete(station.id)}
              style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
              <ThemedText type="small" themeColor="textSecondary">
                스캔이 안 될 때: 직접 완료 처리 (수동 백업)
              </ThemedText>
            </SoundPressable>
          </View>
        )}

        <SoundPressable
          onPress={() => setShowQr((v) => !v)}
          style={({ pressed }) => [styles.ghostButton, styles.qrToggle, pressed && styles.pressed]}>
          <ThemedText type="small" themeColor="textSecondary">
            {showQr ? '테스트용 QR 코드 닫기' : '테스트용 QR 코드 보기'}
          </ThemedText>
        </SoundPressable>
        {showQr && (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.qrOuter}>
            <View style={styles.qrBox}>
              <QRCode value={`${QR_PREFIX}${station.id}`} size={160} backgroundColor="#fff" />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              다른 기기의 스캔 화면으로 이 코드를 찍어보세요
            </ThemedText>
          </Animated.View>
        )}

        <Link href={{ pathname: '/nfc-write', params: { id: station.id } }} asChild>
          <SoundPressable style={({ pressed }) => [styles.ghostButton, styles.qrToggle, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              테스트용 NFC 태그 쓰기
            </ThemedText>
          </SoundPressable>
        </Link>
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
    lineHeight: 56,
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
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
  infoBadgeIcon: {
    fontSize: 13,
  },
  descriptionCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  description: {
    lineHeight: 22,
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
  nfcButton: {
    width: '100%',
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  ghostButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  qrToggle: {
    marginTop: Spacing.one,
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
  cancelButton: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
