import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type LetterPieceProps = {
  letter: string;
  collected: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Play a spring pop-in the moment this flips to collected. */
  animateIn?: boolean;
};

const SIZES = {
  sm: { box: 24, font: 13 },
  md: { box: 36, font: 18 },
  lg: { box: 56, font: 28 },
};

export function LetterPiece({ letter, collected, size = 'md', animateIn = false }: LetterPieceProps) {
  const dims = SIZES[size];
  const pop = useSharedValue(animateIn && collected ? 0 : 1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!collected) {
      pop.value = 1;
      glow.value = 0;
      return;
    }
    if (animateIn) {
      pop.value = 0;
      pop.value = withSpring(1, { damping: 12, stiffness: 220 });
    }
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collected]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
    shadowOpacity: 0.3 + glow.value * 0.4,
    shadowRadius: 6 + glow.value * 10,
  }));

  return (
    <Animated.View
      style={[
        styles.box,
        boxStyle,
        {
          width: dims.box,
          height: dims.box * 1.15,
          backgroundColor: collected ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)',
          borderColor: collected ? 'rgba(255,215,0,0.65)' : 'rgba(255,255,255,0.1)',
          shadowColor: Colors.dark.gold,
        },
      ]}>
      <ThemedText
        style={{
          fontSize: dims.font,
          fontWeight: '700',
          color: collected ? Colors.dark.gold : 'rgba(255,255,255,0.18)',
        }}>
        {collected ? letter : '·'}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
});
