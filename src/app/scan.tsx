import { CameraView, useCameraPermissions } from 'expo-camera';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { CollectBurst } from '@/components/collect-burst';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RUN_TO_JESUS } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { useTagScanHandler } from '@/hooks/use-tag-scan-handler';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { handleScan, errorText, collectedStation } = useTagScanHandler();

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.mediaDevices) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          이 브라우저에서는 카메라를 사용할 수 없어요.
        </ThemedText>
      </ThemedView>
    );
  }

  if (!permission) {
    return <ThemedView style={styles.centered} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          스테이션 QR 코드를 스캔하려면 카메라 권한이 필요해요.
        </ThemedText>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
            카메라 권한 허용
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {!collectedStation && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={(result) => handleScan(result.data)}
        />
      )}

      {!collectedStation && (
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.frame} />
          <ThemedText type="small" style={styles.hint}>
            스테이션의 QR 코드를 프레임 안에 맞춰주세요
          </ThemedText>
        </View>
      )}

      {errorText !== '' && (
        <ThemedView type="backgroundElement" style={styles.errorBox}>
          <ThemedText type="small">{errorText}</ThemedText>
        </ThemedView>
      )}

      {collectedStation && (
        <CollectBurst
          letter={collectedStation.letters.length ? RUN_TO_JESUS[collectedStation.letters[0]] : undefined}
          color={collectedStation.color}
          label={`${collectedStation.hall} · ${collectedStation.keyword}`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: Spacing.four,
    borderWidth: 3,
    borderColor: 'rgba(255,215,0,0.85)',
  },
  hint: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  errorBox: {
    position: 'absolute',
    bottom: Spacing.six,
    left: Spacing.four,
    right: Spacing.four,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
