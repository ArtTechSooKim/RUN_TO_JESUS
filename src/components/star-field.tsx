import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

type StarFieldProps = {
  count?: number;
};

function Star({
  x,
  y,
  size,
  duration,
  delay,
  peakOpacity,
}: {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  peakOpacity: number;
}) {
  const opacity = useSharedValue(0.05);
  const scale = useSharedValue(1);

  opacity.value = withDelay(
    delay,
    withRepeat(
      withSequence(
        withTiming(peakOpacity, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.05, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    ),
  );
  scale.value = withDelay(
    delay,
    withRepeat(
      withSequence(
        withTiming(1.6, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    ),
  );

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        styles.star,
        style,
        { left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  );
}

export function StarField({ count = 40 }: StarFieldProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.8 + 0.6,
        duration: Math.random() * 1400 + 900,
        delay: Math.random() * 3000,
        // Most stars glimmer gently; a handful sparkle brightly, for variety.
        peakOpacity: Math.random() > 0.82 ? 1 : Math.random() * 0.35 + 0.4,
      })),
    [count],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s) => (
        <Star key={s.id} {...s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
