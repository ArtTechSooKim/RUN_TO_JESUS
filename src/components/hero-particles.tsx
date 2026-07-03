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

function Particle({ x, y, size, color, duration, delay }: { x: number; y: number; size: number; color: string; duration: number; delay: number }) {
  const t = useSharedValue(0);

  t.value = withDelay(
    delay,
    withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 2, easing: Easing.out(Easing.sin) }),
        withTiming(0, { duration: duration / 2, easing: Easing.in(Easing.sin) }),
      ),
      -1,
    ),
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -t.value * 30 }],
    opacity: t.value < 0.5 ? t.value * 1.2 : (1 - t.value) * 1.2,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        style,
        { left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    />
  );
}

export function HeroParticles({ color, count = 10 }: { color: string; count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 2500 + 2000,
        delay: Math.random() * 3000,
      })),
    [count],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={p.id} {...p} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});
