import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

function PulsingRing() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.9 }],
    opacity: 1 - pulse.value,
  }));

  return (
    <View style={styles.ringWrap}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <View style={styles.ringCore}>
        <ThemedText style={styles.ringIcon}>📶</ThemedText>
      </View>
    </View>
  );
}

export default function NfcScanScreen() {
  return (
    <ThemedView style={styles.container}>
      <PulsingRing />
      <ThemedText type="default" style={styles.statusText}>
        NFC 태그를 찾는 중...
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
        기기 상단을 스테이션 NFC 태그에 가까이 대주세요
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.five,
  },
  ringWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.dark.gold,
  },
  ringCore: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.dark.gold}1A`,
    borderWidth: 1,
    borderColor: `${Colors.dark.gold}55`,
  },
  ringIcon: {
    fontSize: 36,
  },
  statusText: {
    textAlign: 'center',
  },
  hintText: {
    textAlign: 'center',
  },
});
