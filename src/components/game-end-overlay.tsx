import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

/** Full-screen lock shown to every participant once the super admin ends the game. */
export function GameEndOverlay() {
  const glow = useSharedValue(0);

  glow.value = withRepeat(
    withSequence(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
    ),
    -1,
  );

  const batonStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glow.value * 0.4,
    shadowRadius: 8 + glow.value * 16,
  }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: 0.8 + glow.value * 0.2 }));

  return (
    <Animated.View entering={FadeIn.duration(1200)} style={styles.backdrop}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.baton, batonStyle, { shadowColor: Colors.dark.gold, shadowOffset: { width: 0, height: 0 } }]}
        />

        <Animated.Text style={[styles.title, titleStyle]}>본당으로{'\n'}돌아가세요!</Animated.Text>

        <ThemedText type="small" style={styles.subtitle}>
          경주가 완료되었습니다.{'\n'}함께 엔딩을 맞이합니다.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.brand}>
          RUN TO JESUS
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    backgroundColor: 'rgba(7,4,16,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.five,
  },
  baton: {
    width: 80,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.gold,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(240,244,255,0.5)',
    lineHeight: 20,
  },
  brand: {
    color: Colors.dark.gold,
    letterSpacing: 3,
    marginTop: Spacing.two,
  },
});
