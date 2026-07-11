import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { RUN_TO_JESUS } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { useSoundEffects } from '@/hooks/use-sound-effects';

const PARTICLE_COUNT = 18;
/** How long the animation runs before it dismisses itself, ahead of the provider's longer fallback timer. */
const AUTO_DISMISS_MS = 3000;

function ConvergingParticle({ angle, dist, delay }: { angle: number; dist: number; delay: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    // Particle components are reused across sequential reveals (e.g. RAHAB's 3
    // letters) since their key doesn't change — reset before replaying.
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(angle) * dist * (1 - t.value) },
      { translateY: Math.sin(angle) * dist * (1 - t.value) },
      { scale: 0.4 + t.value * 0.6 },
    ],
    opacity: t.value < 0.85 ? 1 : Math.max(0, (1 - t.value) / 0.15),
  }));

  return <Animated.View style={[styles.particle, style]} />;
}

type FragmentRevealOverlayProps = {
  /** Index into RUN_TO_JESUS currently being revealed, or null when nothing's queued. */
  letterIndex: number | null;
  onDone: () => void;
};

/**
 * Full-screen "믿음의 조각 획득" celebration — black flash → particles converge
 * into the letter → glow flash → fades to expose the already-updated mosaic
 * underneath. Fires from the global `newlyCollected` queue (see
 * use-station-progress), so it plays on every teammate's device, not just the
 * one that scanned.
 */
export function FragmentRevealOverlay({ letterIndex, onDone }: FragmentRevealOverlayProps) {
  const { playTwinkle } = useSoundEffects();
  const dismissedRef = useRef(false);

  const backdrop = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);
  const letterScale = useSharedValue(0.3);
  const letterRotate = useSharedValue(-20);
  const glow = useSharedValue(0);
  const labelOpacity = useSharedValue(0);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        angle: (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.3,
        dist: 130 + Math.random() * 90,
        delay: Math.random() * 150,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [letterIndex],
  );

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onDone();
  }

  useEffect(() => {
    if (letterIndex === null) return;
    dismissedRef.current = false;

    backdrop.value = 0;
    overlayOpacity.value = 1;
    letterScale.value = 0.3;
    letterRotate.value = -20;
    glow.value = 0;
    labelOpacity.value = 0;

    playTwinkle();

    backdrop.value = withTiming(1, { duration: 150 });
    letterScale.value = withDelay(650, withSpring(1, { damping: 10, stiffness: 260 }));
    letterRotate.value = withDelay(650, withSpring(0, { damping: 12, stiffness: 260 }));
    glow.value = withDelay(650, withSequence(withTiming(1, { duration: 180 }), withTiming(0.5, { duration: 300 })));
    labelOpacity.value = withDelay(950, withTiming(1, { duration: 300 }));
    // Hold the settled letter + label on screen for a while before fading —
    // otherwise it reads as vanishing mid-animation.
    overlayOpacity.value = withDelay(2600, withTiming(0, { duration: 400 }));

    const autoTimer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(autoTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterIndex]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const letterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: letterScale.value }, { rotate: `${letterRotate.value}deg` }],
    shadowOpacity: 0.4 + glow.value * 0.6,
    shadowRadius: 20 + glow.value * 40,
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.5 }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  if (letterIndex === null) return null;

  return (
    <Animated.View style={[styles.root, rootStyle]} pointerEvents="auto">
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
        <View style={styles.center}>
          {particles.map((p, i) => (
            <ConvergingParticle key={i} angle={p.angle} dist={p.dist} delay={p.delay} />
          ))}
          <Animated.View style={[styles.flash, flashStyle]} />
          <Animated.View style={[styles.letterCircle, letterStyle]}>
            <ThemedText style={styles.letterText}>{RUN_TO_JESUS[letterIndex]}</ThemedText>
          </Animated.View>
        </View>
        <Animated.View style={[styles.labelBlock, labelStyle]}>
          <ThemedText type="subtitle" style={{ color: Colors.dark.gold }}>
            믿음의 조각 획득!
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            화면을 터치하면 넘어가요
          </ThemedText>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.dark.gold,
  },
  flash: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#fff',
  },
  letterCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: Colors.dark.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,13,23,0.95)',
    shadowColor: Colors.dark.gold,
    shadowOffset: { width: 0, height: 0 },
  },
  letterText: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '800',
    color: Colors.dark.gold,
  },
  labelBlock: {
    position: 'absolute',
    bottom: '18%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.one,
  },
});
