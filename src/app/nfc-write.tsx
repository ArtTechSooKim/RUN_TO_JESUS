import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';

import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { QR_PREFIX, stations } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';

type Status = 'idle' | 'writing' | 'success' | 'error';

export default function NfcWriteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const station = stations.find((s) => s.id === id);
  const [status, setStatus] = useState<Status>('idle');

  if (!station) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>스테이션을 찾을 수 없어요.</ThemedText>
      </ThemedView>
    );
  }

  const payload = `${QR_PREFIX}${station.id}`;

  async function write() {
    setStatus('writing');
    try {
      await NfcManager.start();
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: '빈 NFC 태그를 가까이 대주세요',
      });
      const bytes = Ndef.encodeMessage([Ndef.textRecord(payload)]);
      if (!bytes) throw new Error('encode failed');
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.center}>
        {station.hall} 태그 쓰기
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        기록될 데이터: {payload}
      </ThemedText>

      <SoundPressable
        onPress={write}
        disabled={status === 'writing'}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
          {status === 'writing' ? '태그를 대는 중...' : '빈 태그에 쓰기 시작'}
        </ThemedText>
      </SoundPressable>

      {status === 'success' && (
        <ThemedText type="smallBold" style={[styles.center, { color: station.color }]}>
          ✓ 쓰기 완료! 이제 이 태그로 스캔해보세요.
        </ThemedText>
      )}
      {status === 'error' && (
        <ThemedText type="small" style={[styles.center, styles.errorText]}>
          쓰기에 실패했어요. 태그를 다시 대고 시도해주세요.
        </ThemedText>
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
  center: {
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
  errorText: {
    color: '#EF4444',
  },
});
