import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

type StarFieldProps = {
  count?: number;
};

function Star({ x, y, size, duration, delay }: { x: number; y: number; size: number; duration: number; delay: number }) {
  const opacity = useSharedValue(0.06);

  opacity.value = withDelay(
    delay,
    withRepeat(
      withSequence(
        withTiming(0.55, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.06, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    ),
  );

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
        duration: Math.random() * 2000 + 1500,
        delay: Math.random() * 3000,
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
