import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const MAX_DIST = Math.hypot(width, height) / 2 + 40;
const STREAK_COUNT = 32;
const DURATION_MS = 620;

function Streak({ angle, progress }: { angle: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const dist = p * MAX_DIST;
    const length = 3 + p * 160;
    const fadeIn = Math.min(p / 0.12, 1);
    const fadeOut = 1 - Math.max((p - 0.72) / 0.28, 0);
    return {
      width: length,
      opacity: fadeIn * fadeOut,
      transform: [{ rotate: `${angle}deg` }, { translateX: dist }],
    };
  });

  return <Animated.View style={[styles.streak, style]} />;
}

export function HyperspaceBurst({ onDone }: { onDone: () => void }) {
  const progress = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    flash.value = withSequence(withTiming(0.9, { duration: 140 }), withTiming(0, { duration: DURATION_MS - 140 }));
    progress.value = withTiming(1, { duration: DURATION_MS, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  }, [flash, onDone, progress]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const angles = useMemo(() => Array.from({ length: STREAK_COUNT }, (_, i) => (i / STREAK_COUNT) * 360), []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.center}>
        {angles.map((angle) => (
          <Streak key={angle} angle={angle} progress={progress} />
        ))}
      </View>
      <Animated.View style={[styles.flash, flashStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  streak: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.dark.gold,
  },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
});
