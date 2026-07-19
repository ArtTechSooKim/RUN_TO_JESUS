import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';

import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

function EditModal({
  title,
  initialValue,
  placeholder,
  keyboardType,
  warning,
  onSave,
  onClose,
}: {
  title: string;
  initialValue: string;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  /** Consequence note shown under the input — for edits that aren't purely cosmetic (e.g. changing team). */
  warning?: string;
  onSave: (value: string) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('값을 입력해주세요');
      return;
    }
    if (keyboardType === 'number-pad') {
      const n = Number(trimmed);
      if (!Number.isInteger(n) || n < 1 || n > 24) {
        setError('1~24 사이의 팀 번호를 입력해주세요');
        return;
      }
    } else if (trimmed.length > 10) {
      setError('10자 이내로 입력해주세요');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(trimmed);
    } catch {
      setError('저장에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.modalBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View entering={FadeInUp.duration(200)} style={styles.modalCard}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <TextInput
          value={value}
          onChangeText={(v) => {
            setValue(v);
            setError('');
          }}
          placeholder={placeholder}
          placeholderTextColor={Colors.dark.textSecondary}
          keyboardType={keyboardType}
          autoFocus
          style={[styles.input, error && styles.inputError]}
        />
        {warning && (
          <ThemedText type="small" themeColor="textSecondary">
            {warning}
          </ThemedText>
        )}
        {error !== '' && (
          <ThemedText type="small" style={styles.errorText}>
            {error}
          </ThemedText>
        )}
        <View style={styles.modalActions}>
          <SoundPressable onPress={onClose} disabled={saving} style={({ pressed }) => [styles.modalButtonGhost, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              취소
            </ThemedText>
          </SoundPressable>
          <SoundPressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [styles.modalButtonGold, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
              {saving ? '저장 중...' : '저장'}
            </ThemedText>
          </SoundPressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const { user, updateUser, logout } = useAuth();
  const [editModal, setEditModal] = useState<'name' | 'team' | null>(null);

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>로그인이 필요해요.</ThemedText>
      </ThemedView>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarEmoji}>🏃</ThemedText>
        </View>
        <View>
          <ThemedText type="smallBold">{user.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user.team_id}조
          </ThemedText>
        </View>
      </View>

      <View style={styles.rowGroup}>
        <SoundPressable
          onPress={() => setEditModal('name')}
          style={({ pressed }) => [styles.row, styles.rowBorder, pressed && styles.pressed]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rowLabel}>
            이름
          </ThemedText>
          <ThemedText type="small">{user.name}</ThemedText>
        </SoundPressable>
        <SoundPressable onPress={() => setEditModal('team')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rowLabel}>
            팀 번호
          </ThemedText>
          <ThemedText type="small">{user.team_id}조</ThemedText>
        </SoundPressable>
      </View>

      <SoundPressable onPress={handleLogout} style={({ pressed }) => [styles.row, styles.logoutRow, pressed && styles.pressed]}>
        <ThemedText type="small" style={styles.logoutText}>
          앱 종료 / 로그아웃
        </ThemedText>
      </SoundPressable>

      {editModal === 'name' && (
        <EditModal
          title="이름 변경"
          initialValue={user.name}
          placeholder="새 이름 입력"
          onSave={async (v) => {
            await updateUser({ name: v });
            setEditModal(null);
          }}
          onClose={() => setEditModal(null)}
        />
      )}
      {editModal === 'team' && (
        <EditModal
          title="팀 번호 변경"
          initialValue={String(user.team_id)}
          placeholder="1 ~ 24"
          keyboardType="number-pad"
          warning="팀을 바꾸면 지금까지 모은 조각도 새 팀 기준으로 표시돼요."
          onSave={async (v) => {
            await updateUser({ team_id: Number(v) });
            setEditModal(null);
          }}
          onClose={() => setEditModal(null)}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: 'rgba(255,215,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  rowGroup: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    backgroundColor: 'rgba(17,24,39,0.7)',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowLabel: {
    flex: 1,
  },
  logoutRow: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    backgroundColor: 'rgba(248,113,113,0.06)',
    borderColor: 'rgba(248,113,113,0.2)',
  },
  logoutText: {
    color: '#F87171',
  },
  pressed: {
    opacity: 0.7,
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
    borderColor: 'rgba(255,215,0,0.2)',
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
  modalButtonGold: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: Colors.dark.gold,
  },
});
