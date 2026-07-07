import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

// Native-only feature: react-native-nfc-manager touches NativeModules at
// import time, so it must never even be imported into the web bundle that
// every participant's browser loads — Metro resolves this .web.tsx file
// instead of nfc-scan.tsx automatically for web builds.
export default function NfcScanWebFallback() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="default" style={styles.text}>
        이 브라우저에서는 NFC를 지원하지 않아요.
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        아래 QR 코드 스캔으로 진행해주세요.
      </ThemedText>
      <SoundPressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
          돌아가기
        </ThemedText>
      </SoundPressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
  },
  text: {
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.three,
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
});
