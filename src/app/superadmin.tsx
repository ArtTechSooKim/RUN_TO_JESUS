import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';

import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MASTER_STATION, QR_PREFIX, stations, type Station } from '@/constants/stations';
import { Colors, Spacing } from '@/constants/theme';
import { api, WEB_BASE_URL, type GameState } from '@/lib/api';

const TEAM_COUNT = 24;

function TeamQrTab() {
  return (
    <ScrollView contentContainerStyle={styles.teamQrScroll}>
      <View style={styles.teamQrHeader}>
        <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
          QR을 스캔하면 해당 팀 번호가 미리 채워진 로그인 화면으로 바로 들어가요. 카드를 잘라서 각 팀에게 나눠주세요.
        </ThemedText>
        {Platform.OS === 'web' && (
          <SoundPressable
            onPress={() => window.print()}
            style={({ pressed }) => [styles.printButton, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ color: Colors.dark.background }}>
              🖨 인쇄하기
            </ThemedText>
          </SoundPressable>
        )}
      </View>

      <View style={styles.teamQrGrid}>
        {Array.from({ length: TEAM_COUNT }, (_, i) => i + 1).map((team) => (
          <View key={team} style={styles.teamQrCard}>
            <ThemedText type="smallBold" style={{ color: Colors.dark.gold }}>
              {team}조
            </ThemedText>
            <QRCode value={`${WEB_BASE_URL}/login?team=${team}`} size={110} backgroundColor="#fff" />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function TagRow({ station }: { station: Station }) {
  const [showQr, setShowQr] = useState(false);

  return (
    <View
      style={[
        styles.tagRow,
        station.isHidden && { borderColor: `${station.color}55`, backgroundColor: `${station.color}12` },
      ]}>
      <View style={styles.tagRowHeader}>
        <ThemedText style={styles.tagRowEmoji}>{station.emoji}</ThemedText>
        <View style={styles.tagRowInfo}>
          <ThemedText type="smallBold" style={station.isHidden ? { color: station.color } : undefined}>
            {station.keyword}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {station.hall}
          </ThemedText>
        </View>
      </View>

      <View style={styles.tagRowActions}>
        <SoundPressable
          onPress={() => setShowQr((v) => !v)}
          style={({ pressed }) => [styles.tagRowButton, pressed && styles.pressed]}>
          <ThemedText type="small" themeColor="textSecondary">
            {showQr ? 'QR 코드 닫기' : 'QR 코드 보기'}
          </ThemedText>
        </SoundPressable>
        {!station.isQrOnly && (
          <Link href={{ pathname: '/nfc-write', params: { id: station.id } }} asChild>
            <SoundPressable style={({ pressed }) => [styles.tagRowButton, pressed && styles.pressed]}>
              <ThemedText type="small" themeColor="textSecondary">
                NFC 태그 쓰기
              </ThemedText>
            </SoundPressable>
          </Link>
        )}
      </View>

      {showQr && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.qrBox}>
          <QRCode value={`${QR_PREFIX}${station.id}`} size={140} backgroundColor="#fff" />
        </Animated.View>
      )}
    </View>
  );
}

function TagManagementTab() {
  return (
    <ScrollView contentContainerStyle={styles.tagList}>
      <ThemedText type="small" themeColor="textSecondary">
        방을 선택하면 그 방의 QR 코드를 보거나 NFC 태그를 쓸 수 있어요. 숨은글자찾기는 QR 전용이라 NFC 쓰기가 없어요.
      </ThemedText>

      <TagRow station={MASTER_STATION} />
      {stations.map((station) => (
        <TagRow key={station.id} station={station} />
      ))}
    </ScrollView>
  );
}

function ResetConfirmModal({
  title,
  description,
  onConfirm,
  onClose,
  onDone,
}: {
  title: string;
  description: string;
  onConfirm: (password: string) => Promise<unknown>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      await onConfirm(password);
      onDone();
    } catch {
      setError('비밀번호가 틀렸거나 요청이 실패했어요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.modalBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View entering={FadeInUp.duration(200)} style={styles.modalCard}>
        <ThemedText type="smallBold" style={{ color: '#F87171' }}>
          ⚠ {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
        <TextInput
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError('');
          }}
          placeholder="관리자 비밀번호"
          placeholderTextColor={Colors.dark.textSecondary}
          secureTextEntry
          autoFocus
          style={[styles.input, error && styles.inputError]}
        />
        {error !== '' && (
          <ThemedText type="small" style={styles.errorText}>
            {error}
          </ThemedText>
        )}
        <View style={styles.modalActions}>
          <SoundPressable onPress={onClose} style={({ pressed }) => [styles.modalButtonGhost, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              취소
            </ThemedText>
          </SoundPressable>
          <SoundPressable
            onPress={handleConfirm}
            disabled={loading}
            style={({ pressed }) => [styles.modalButtonDanger, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: '#fff' }}>
              {loading ? '초기화 중...' : '초기화'}
            </ThemedText>
          </SoundPressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function EndingConfirmModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      await api.startEnding();
      onDone();
    } catch {
      setError('요청이 실패했어요 (게임상태가 종료 상태인지 확인하세요)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.modalBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View entering={FadeInUp.duration(200)} style={styles.modalCard}>
        <ThemedText type="smallBold" style={{ color: Colors.dark.gold }}>
          🏁 엔딩 시작
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          본당 상영 화면(broadcast.html)의 진행률 바가 즉시 100%까지 차오르며 골인 연출이 재생됩니다. 되돌릴 수 없으니, 참가자 전원이 본당에 모이고 엔딩 영상 타이밍에 맞춰서 눌러주세요.
        </ThemedText>
        {error !== '' && (
          <ThemedText type="small" style={styles.errorText}>
            {error}
          </ThemedText>
        )}
        <View style={styles.modalActions}>
          <SoundPressable onPress={onClose} style={({ pressed }) => [styles.modalButtonGhost, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              취소
            </ThemedText>
          </SoundPressable>
          <SoundPressable
            onPress={handleConfirm}
            disabled={loading}
            style={({ pressed }) => [styles.modalButtonGold, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
              {loading ? '시작 중...' : '엔딩 시작'}
            </ThemedText>
          </SoundPressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function SuperAdminScreen() {
  const [tab, setTab] = useState<'global' | 'tags' | 'teamqr'>('global');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [usersResetModalOpen, setUsersResetModalOpen] = useState(false);
  const [usersResetDone, setUsersResetDone] = useState(false);
  const [endingModalOpen, setEndingModalOpen] = useState(false);

  useEffect(() => {
    api.getAppState().then((s) => setGameState(s.game_state));
  }, []);

  async function toggle(next: 'progress' | 'ended') {
    setGameState(next);
    await api.setAppState(next);
  }

  const isActive = gameState === 'progress';
  const isEnding = gameState === 'ending';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <SoundPressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ThemedText type="small">← 뒤로</ThemedText>
        </SoundPressable>
        <View>
          <ThemedText type="small" style={{ color: '#F87171' }}>
            최고관리자
          </ThemedText>
          <ThemedText type="smallBold">전역 게임 상태</ThemedText>
        </View>
      </View>

      <View style={styles.tabRowOuter}>
        <SoundPressable
          onPress={() => setTab('global')}
          style={[styles.tabButton, tab === 'global' && styles.tabButtonActive]}>
          <ThemedText type="smallBold" style={{ color: tab === 'global' ? Colors.dark.gold : Colors.dark.textSecondary }}>
            ⚡ 전역 상태
          </ThemedText>
        </SoundPressable>
        <SoundPressable
          onPress={() => setTab('tags')}
          style={[styles.tabButton, tab === 'tags' && styles.tabButtonActive]}>
          <ThemedText type="smallBold" style={{ color: tab === 'tags' ? Colors.dark.gold : Colors.dark.textSecondary }}>
            🏷 태그 관리
          </ThemedText>
        </SoundPressable>
        <SoundPressable
          onPress={() => setTab('teamqr')}
          style={[styles.tabButton, tab === 'teamqr' && styles.tabButtonActive]}>
          <ThemedText type="smallBold" style={{ color: tab === 'teamqr' ? Colors.dark.gold : Colors.dark.textSecondary }}>
            🎫 팀 QR
          </ThemedText>
        </SoundPressable>
      </View>

      {tab === 'tags' ? (
        <TagManagementTab />
      ) : tab === 'teamqr' ? (
        <TeamQrTab />
      ) : (
        <>
      <View
        style={[
          styles.indicator,
          { borderColor: isActive ? 'rgba(255,215,0,0.5)' : 'rgba(248,113,113,0.5)' },
          { backgroundColor: isActive ? 'rgba(255,215,0,0.1)' : 'rgba(248,113,113,0.1)' },
        ]}>
        <ThemedText style={styles.indicatorIcon}>{isEnding ? '🏁' : isActive ? '⚡' : '🔌'}</ThemedText>
        <ThemedText type="smallBold" style={{ color: isActive ? Colors.dark.gold : '#F87171' }}>
          {gameState === null ? '불러오는 중...' : isEnding ? '엔딩 진행중' : isActive ? '게임 진행중' : '게임 종료'}
        </ThemedText>
      </View>

      <View style={styles.buttonGroup}>
        <SoundPressable
          onPress={() => toggle('progress')}
          style={({ pressed }) => [
            styles.stateButton,
            isActive && styles.stateButtonActiveGold,
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={{ color: isActive ? Colors.dark.background : Colors.dark.textSecondary }}>
            ⚡ 게임상태 (정상 운영)
          </ThemedText>
        </SoundPressable>

        <SoundPressable
          onPress={() => toggle('ended')}
          style={({ pressed }) => [
            styles.stateButton,
            !isActive && gameState !== null && styles.stateButtonActiveRed,
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={{ color: !isActive && gameState !== null ? '#F87171' : Colors.dark.textSecondary }}>
            🔌 게임종료상태 (전체 잠금)
          </ThemedText>
        </SoundPressable>
      </View>

      <View style={styles.warningBox}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.warningText}>
          <ThemedText type="small" style={{ color: '#F87171' }}>
            ⚠ 게임종료상태
          </ThemedText>
          로 전환하면 참가자 전체 화면이 어두워지고 모든 버튼이 비활성화됩니다. 화면 중앙에 "본당으로 돌아가세요!" 메시지가 표시됩니다.
        </ThemedText>
      </View>

      <SoundPressable
        onPress={() => setEndingModalOpen(true)}
        disabled={gameState !== 'ended'}
        style={({ pressed }) => [
          styles.endingButton,
          gameState !== 'ended' && styles.endingButtonDisabled,
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold" style={{ color: gameState === 'ended' ? Colors.dark.gold : Colors.dark.textSecondary }}>
          🏁 엔딩 시작 (본당 골인 연출){isEnding ? ' — 이미 시작됨' : ''}
        </ThemedText>
      </SoundPressable>
      <ThemedText type="small" themeColor="textSecondary" style={styles.endingHint}>
        게임종료상태일 때만 누를 수 있어요. 본당 상영 화면의 진행률 바를 100%까지 골인시킵니다.
      </ThemedText>

      <SoundPressable
        onPress={() => {
          setResetDone(false);
          setResetModalOpen(true);
        }}
        style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={{ color: '#F87171' }}>
          🗑 모든 팀 진행도 리셋 (테스트용)
        </ThemedText>
      </SoundPressable>
      {resetDone && (
        <ThemedText type="small" style={{ color: Colors.dark.gold, textAlign: 'center' }}>
          ✓ 모든 팀의 진행도가 초기화됐어요
        </ThemedText>
      )}

      <SoundPressable
        onPress={() => {
          setUsersResetDone(false);
          setUsersResetModalOpen(true);
        }}
        style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={{ color: '#F87171' }}>
          🗑 모든 유저 계정 초기화 (테스트용)
        </ThemedText>
      </SoundPressable>
      {usersResetDone && (
        <ThemedText type="small" style={{ color: Colors.dark.gold, textAlign: 'center' }}>
          ✓ 모든 테스트 계정이 초기화됐어요
        </ThemedText>
      )}

      {resetModalOpen && (
        <ResetConfirmModal
          title="모든 팀 진행도 리셋"
          description="24개 팀 전체의 수집한 글자 조각과 진행중인 세션이 전부 삭제됩니다. 로그인 정보와 스테이션 설정은 유지돼요. 되돌릴 수 없으니 테스트 라운드 사이에만 사용하세요."
          onConfirm={(password) => api.resetAllProgress(password)}
          onClose={() => setResetModalOpen(false)}
          onDone={() => {
            setResetModalOpen(false);
            setResetDone(true);
          }}
        />
      )}

      {usersResetModalOpen && (
        <ResetConfirmModal
          title="모든 유저 계정 초기화"
          description="지금까지 로그인한 모든 참가자 계정이 삭제됩니다(최고관리자/본당은 계정이 따로 없어 영향 없어요). 팀 진행도는 그대로 남아요 — 같이 지우려면 위 '진행도 리셋'도 함께 눌러주세요. 되돌릴 수 없어요."
          onConfirm={(password) => api.resetAllUsers(password)}
          onClose={() => setUsersResetModalOpen(false)}
          onDone={() => {
            setUsersResetModalOpen(false);
            setUsersResetDone(true);
          }}
        />
      )}

      {endingModalOpen && (
        <EndingConfirmModal
          onClose={() => setEndingModalOpen(false)}
          onDone={() => {
            setEndingModalOpen(false);
            setGameState('ending');
          }}
        />
      )}
        </>
      )}
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
  tabRowOuter: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  tagList: {
    gap: Spacing.two,
    paddingBottom: Spacing.five,
  },
  tagRow: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  tagRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  tagRowEmoji: {
    fontSize: 24,
  },
  tagRowInfo: {
    flex: 1,
    gap: 2,
  },
  tagRowActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tagRowButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qrBox: {
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#fff',
  },
  teamQrScroll: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  teamQrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  printButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: Colors.dark.gold,
  },
  teamQrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  teamQrCard: {
    width: 132,
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
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
    lineHeight: 42,
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
  endingButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  endingButtonDisabled: {
    opacity: 0.4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  endingHint: {
    marginTop: -Spacing.three,
    textAlign: 'center',
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
  resetButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
  },
  pressed: {
    opacity: 0.8,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.six,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: Colors.dark.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#F87171',
  },
  errorText: {
    color: '#F87171',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  modalButtonGhost: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalButtonDanger: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#DC2626',
  },
  modalButtonGold: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: Colors.dark.gold,
  },
});
