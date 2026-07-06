import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { HyperspaceBurst } from '@/components/hyperspace-burst';
import { StarField } from '@/components/star-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

function GlowTitle() {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [glow]);

  const style = useAnimatedStyle(() => ({
    textShadowRadius: 20 + glow.value * 24,
    opacity: 0.92 + glow.value * 0.08,
  }));

  return (
    <Animated.Text style={[styles.title, style]}>
      RUN TO{'\n'}JESUS
    </Animated.Text>
  );
}

function PulsingCta({ onPress }: { onPress: () => void }) {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [glow]);

  const style = useAnimatedStyle(() => ({
    shadowOpacity: 0.35 + glow.value * 0.35,
    shadowRadius: 16 + glow.value * 16,
  }));

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Animated.View
        style={[
          styles.ctaButton,
          style,
          { shadowColor: Colors.dark.gold, shadowOffset: { width: 0, height: 0 } },
        ]}>
        <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
          바통 이어받기
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [launching, setLaunching] = useState(false);
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <StarField count={50} />
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <Animated.Text
            entering={FadeIn.duration(700)}
            style={styles.eyebrow}>
            2026 청년연합수련회
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(200).duration(700)}>
            <GlowTitle />
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(600).duration(700)}
            style={styles.subtitle}>
            믿음의 경주에 오신 것을 환영합니다.{'\n'}바통을 이어받아 함께 달려가십시오.
          </Animated.Text>
        </ThemedView>

        <Animated.View entering={FadeIn.delay(1000).duration(600)}>
          <PulsingCta onPress={() => setLaunching(true)} />
        </Animated.View>
      </SafeAreaView>

      {launching && <HyperspaceBurst onDone={() => router.replace(user ? '/map' : '/login')} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  title: {
    textAlign: 'center',
    color: Colors.dark.gold,
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: 2,
    fontSize: 48,
    fontWeight: '600',
    lineHeight: 52,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  ctaButton: {
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
});
