import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

export default function SuperAdminScreen() {
  const [gameState, setGameState] = useState<'progress' | 'ended' | null>(null);

  useEffect(() => {
    api.getAppState().then((s) => setGameState(s.game_state));
  }, []);

  async function toggle(next: 'progress' | 'ended') {
    setGameState(next);
    await api.setAppState(next);
  }

  const isActive = gameState === 'progress';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ThemedText type="small">← 뒤로</ThemedText>
        </Pressable>
        <View>
          <ThemedText type="small" style={{ color: '#F87171' }}>
            최고관리자
          </ThemedText>
          <ThemedText type="smallBold">전역 게임 상태</ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.indicator,
          { borderColor: isActive ? 'rgba(255,215,0,0.5)' : 'rgba(248,113,113,0.5)' },
          { backgroundColor: isActive ? 'rgba(255,215,0,0.1)' : 'rgba(248,113,113,0.1)' },
        ]}>
        <ThemedText style={styles.indicatorIcon}>{isActive ? '⚡' : '🔌'}</ThemedText>
        <ThemedText type="smallBold" style={{ color: isActive ? Colors.dark.gold : '#F87171' }}>
          {gameState === null ? '불러오는 중...' : isActive ? '게임 진행중' : '게임 종료'}
        </ThemedText>
      </View>

      <View style={styles.buttonGroup}>
        <Pressable
          onPress={() => toggle('progress')}
          style={({ pressed }) => [
            styles.stateButton,
            isActive && styles.stateButtonActiveGold,
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={{ color: isActive ? Colors.dark.background : Colors.dark.textSecondary }}>
            ⚡ 게임상태 (정상 운영)
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => toggle('ended')}
          style={({ pressed }) => [
            styles.stateButton,
            !isActive && gameState !== null && styles.stateButtonActiveRed,
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={{ color: !isActive && gameState !== null ? '#F87171' : Colors.dark.textSecondary }}>
            🔌 게임종료상태 (전체 잠금)
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.warningBox}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.warningText}>
          <ThemedText type="small" style={{ color: '#F87171' }}>
            ⚠ 게임종료상태
          </ThemedText>
          로 전환하면 참가자 전체 화면이 어두워지고 모든 버튼이 비활성화됩니다. 화면 중앙에 "본당으로 돌아가세요!" 메시지가 표시됩니다.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  backButton: {
    paddingVertical: Spacing.one,
  },
  indicator: {
    alignSelf: 'center',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  indicatorIcon: {
    fontSize: 36,
  },
  buttonGroup: {
    gap: Spacing.two,
  },
  stateButton: {
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stateButtonActiveGold: {
    backgroundColor: Colors.dark.gold,
    borderWidth: 0,
  },
  stateButtonActiveRed: {
    backgroundColor: 'rgba(248,113,113,0.2)',
    borderColor: 'rgba(248,113,113,0.4)',
  },
  warningBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(248,113,113,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.15)',
  },
  warningText: {
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.8,
  },
});
