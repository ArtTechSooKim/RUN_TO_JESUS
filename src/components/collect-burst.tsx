import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { Colors, Spacing } from '@/constants/theme';

function BurstParticle({ angle, color, delay }: { angle: number; color: string; delay: number }) {
  const t = useSharedValue(0);
  const dist = useMemo(() => 60 + Math.random() * 50, []);

  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(angle) * dist * t.value },
      { translateY: Math.sin(angle) * dist * t.value },
      { scale: 1 - t.value },
    ],
    opacity: 1 - t.value,
  }));

  return <Animated.View style={[styles.particle, style, { backgroundColor: color }]} />;
}

type CollectBurstProps = {
  /** omit for mini-games that don't award a letter — shows a checkmark instead */
  letter?: string;
  color: string;
  label: string;
};

export function CollectBurst({ letter, color, label }: CollectBurstProps) {
  const ring = useSharedValue(0.5);
  const ringOpacity = useSharedValue(1);
  const letterScale = useSharedValue(0.2);
  const letterRotate = useSharedValue(-30);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    ring.value = withTiming(2, { duration: 1000, easing: Easing.out(Easing.quad) });
    ringOpacity.value = withDelay(100, withTiming(0, { duration: 900 }));
    letterScale.value = withSpring(1, { damping: 18, stiffness: 280 });
    letterRotate.value = withSpring(0, { damping: 18, stiffness: 280 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
  }, [ring, ringOpacity, letterScale, letterRotate, textOpacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
    opacity: ringOpacity.value,
  }));
  const letterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: letterScale.value }, { rotate: `${letterRotate.value}deg` }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  const particles = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({ angle: (i / 14) * Math.PI * 2, delay: i * 20 })),
    [],
  );

  return (
    <View style={styles.backdrop}>
      <View style={styles.center}>
        {particles.map((p, i) => (
          <BurstParticle key={i} angle={p.angle} color={color} delay={p.delay} />
        ))}
        <Animated.View style={[styles.ring, ringStyle, { borderColor: color }]} />
        <Animated.View
          style={[
            styles.letterCircle,
            letterStyle,
            { borderColor: color, shadowColor: color },
          ]}>
          <ThemedText style={[styles.letterText, { color: Colors.dark.gold }]}>
            {letter ?? '✓'}
          </ThemedText>
        </Animated.View>
      </View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <ThemedText type="subtitle" style={{ color: Colors.dark.gold }}>
          {letter ? '조각 획득!' : '참여 완료!'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,13,23,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  center: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  letterCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,13,23,0.9)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
  },
  letterText: {
    fontSize: 40,
    fontWeight: '700',
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.one,
  },
});
