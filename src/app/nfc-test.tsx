import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import NfcManager, { NfcTech, Ndef, type TagEvent } from 'react-native-nfc-manager';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

function decodeNdefText(tag: TagEvent) {
  const record = tag.ndefMessage?.[0];
  if (!record) return null;
  try {
    return Ndef.text.decodePayload(new Uint8Array(record.payload));
  } catch {
    return null;
  }
}

export default function NfcTestScreen() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [state, setState] = useState<ScanState>('idle');
  const [tag, setTag] = useState<TagEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    NfcManager.start();
    NfcManager.isSupported().then(setSupported);
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  async function startScan() {
    setState('scanning');
    setErrorMessage('');
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tagInfo = await NfcManager.getTag();
      setTag(tagInfo);
      setState('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setState('error');
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <ThemedText type="subtitle">NFC 태그 테스트</ThemedText>

      {supported === false && (
        <ThemedText type="small">
          이 기기는 NFC를 지원하지 않아요. ({Platform.OS})
        </ThemedText>
      )}
      {supported === null && <ThemedText type="small">NFC 지원 여부 확인 중...</ThemedText>}

      <Pressable
        onPress={startScan}
        disabled={state === 'scanning' || supported === false}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <ThemedText type="link">
          {state === 'scanning' ? '태그를 폰에 대주세요...' : '스캔 시작'}
        </ThemedText>
      </Pressable>

      {state === 'success' && tag && (
        <ThemedView type="backgroundElement" style={styles.resultBox}>
          <ThemedText type="smallBold">UID</ThemedText>
          <ThemedText type="code">{tag.id}</ThemedText>

          <ThemedText type="smallBold">기술 유형 (techTypes)</ThemedText>
          <ThemedText type="code">{tag.techTypes?.join(', ') ?? '-'}</ThemedText>

          <ThemedText type="smallBold">NDEF 텍스트</ThemedText>
          <ThemedText type="code">{decodeNdefText(tag) ?? '(NDEF 없음 / 텍스트 레코드 아님)'}</ThemedText>
        </ThemedView>
      )}

      {state === 'error' && (
        <ThemedView type="backgroundElement" style={styles.resultBox}>
          <ThemedText type="smallBold">에러</ThemedText>
          <ThemedText type="small">{errorMessage}</ThemedText>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  resultBox: {
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
});
