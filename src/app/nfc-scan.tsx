import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CollectBurst } from '@/components/collect-burst';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RUN_TO_JESUS } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { useTagScanHandler } from '@/hooks/use-tag-scan-handler';

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
  const { handleScan, errorText, collectedStation } = useTagScanHandler();
  const [nfcError, setNfcError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (collectedStation) return;
    let cancelled = false;

    async function run() {
      setNfcError('');
      try {
        await NfcManager.start();
        await NfcManager.requestTechnology(NfcTech.Ndef, {
          alertMessage: '스테이션 NFC 태그에 가까이 대주세요',
        });
        const tag = await NfcManager.getTag();
        if (cancelled) return;

        const record = tag?.ndefMessage?.[0];
        if (!record) {
          setNfcError('태그에서 데이터를 읽지 못했어요.');
          return;
        }
        const text = Ndef.text.decodePayload(Uint8Array.from(record.payload));
        handleScan(text);
      } catch {
        if (!cancelled) {
          setNfcError('NFC 인식에 실패했어요. 태그에 다시 대주세요.');
        }
      } finally {
        NfcManager.cancelTechnologyRequest().catch(() => {});
      }
    }

    run();

    return () => {
      cancelled = true;
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, [attempt, collectedStation, handleScan]);

  if (collectedStation) {
    return (
      <View style={styles.container}>
        <CollectBurst
          letter={RUN_TO_JESUS[collectedStation.letters[0]]}
          color={collectedStation.color}
          label={`${collectedStation.hall} · ${collectedStation.keyword}`}
        />
      </View>
    );
  }

  const message = nfcError || errorText;

  return (
    <ThemedView style={styles.container}>
      <PulsingRing />
      <ThemedText type="default" style={styles.statusText}>
        NFC 태그를 찾는 중...
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
        기기 상단을 스테이션 NFC 태그에 가까이 대주세요
      </ThemedText>

      {message !== '' && (
        <ThemedView type="backgroundElement" style={styles.errorBox}>
          <ThemedText type="small" style={styles.errorText}>
            {message}
          </ThemedText>
          <Pressable
            onPress={() => setAttempt((a) => a + 1)}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
              다시 시도
            </ThemedText>
          </Pressable>
        </ThemedView>
      )}
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
  errorBox: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    marginTop: Spacing.four,
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
});
