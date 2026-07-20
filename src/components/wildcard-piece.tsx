import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

/** 새로운시네마를 2번째/3번째로 방문했을 때 받는 보너스 조각 — 특정 글자로 확정되지 않으므로 물음표/글자 없이 은은하게 반짝이기만 한다. */
export function WildcardPiece({ index = 0, size = 36 }: { index?: number; size?: number }) {
  const shimmer = useSharedValue(0.4);

  useEffect(() => {
    shimmer.value = withDelay(
      index * 220,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [shimmer, index]);

  const style = useAnimatedStyle(() => ({
    opacity: shimmer.value,
    shadowOpacity: shimmer.value * 0.7,
    shadowRadius: 6 + shimmer.value * 14,
  }));

  return (
    <Animated.View
      style={[
        styles.tile,
        style,
        { width: size, height: size * 1.15, shadowColor: Colors.dark.gold },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.55)',
    backgroundColor: 'rgba(255,215,0,0.14)',
    shadowOffset: { width: 0, height: 0 },
  },
});
