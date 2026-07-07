import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

// See nfc-scan.web.tsx — same reason this can't import react-native-nfc-manager.
export default function NfcWriteWebFallback() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="default" style={styles.text}>
        이 브라우저에서는 NFC 태그 쓰기를 지원하지 않아요.
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
