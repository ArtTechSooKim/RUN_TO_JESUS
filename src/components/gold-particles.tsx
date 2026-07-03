import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function Particle({ startX, delay, size, rise, gold }: { startX: number; delay: number; size: number; rise: number; gold: boolean }) {
  const progress = useSharedValue(0);

  progress.value = withDelay(
    delay,
    withRepeat(
      withSequence(
        withTiming(1, { duration: 4500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 1 }),
        withTiming(0, { duration: Math.random() * 2500 + 1 }),
      ),
      -1,
    ),
  );

  const style = useAnimatedStyle(() => {
    const y = -progress.value * rise;
    const opacity =
      progress.value < 0.1
        ? progress.value * 9
        : progress.value > 0.75
          ? (1 - progress.value) * 4
          : 0.9;
    return {
      transform: [{ translateY: y }],
      opacity: Math.max(0, Math.min(1, opacity)),
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        style,
        {
          left: `${startX}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: gold ? '#FFD700' : '#FFFFFF',
          shadowColor: '#FFD700',
        },
      ]}
    />
  );
}

export function GoldParticles({ count = 26 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        startX: Math.random() * 100,
        delay: Math.random() * 4000,
        size: Math.random() * 3 + 1.5,
        rise: Math.random() * 400 + 300,
        gold: Math.random() > 0.5,
      })),
    [count],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={p.id} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    bottom: -10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
});
