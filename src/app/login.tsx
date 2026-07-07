import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { SoundPressable } from '@/components/sound-pressable';
import { StarField } from '@/components/star-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [teamNumber, setTeamNumber] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ team?: string; name?: string }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate() {
    const e: { team?: string; name?: string } = {};
    const n = Number(teamNumber);
    if (!teamNumber) e.team = '팀 번호를 입력해주세요';
    else if (!Number.isInteger(n) || n < 1 || n > 24) e.team = '1~24 사이의 팀 번호를 입력해주세요 (최고관리자는 100)';
    if (!name.trim()) e.name = '이름을 입력해주세요';
    else if (name.trim().length > 10) e.name = '10자 이내로 입력해주세요';
    return e;
  }

  async function handleSubmit() {
    // Super admin bypass (name="김수"/team=100) skips the 1~24 range check entirely.
    const isSuperAdminAttempt = name.trim() === '김수' && teamNumber === '100';
    const e = isSuperAdminAttempt ? {} : validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      const result = await login(name, Number(teamNumber));
      if (result === 'superadmin') {
        router.replace('/superadmin');
      } else {
        router.replace('/map');
      }
    } catch {
      setServerError('로그인에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <StarField count={40} />
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            2026 청년연합수련회
          </ThemedText>
          <ThemedText style={styles.title}>RUN TO JESUS</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            팀 번호와 이름을 입력해주세요
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              팀 번호 (1 – 24)
            </ThemedText>
            <TextInput
              value={teamNumber}
              onChangeText={(v) => {
                setTeamNumber(v);
                setErrors((prev) => ({ ...prev, team: undefined }));
              }}
              keyboardType="number-pad"
              placeholder="예: 7"
              placeholderTextColor={Colors.dark.textSecondary}
              maxLength={3}
              style={[styles.input, errors.team && styles.inputError]}
            />
            {errors.team && (
              <ThemedText type="small" style={styles.errorText}>
                {errors.team}
              </ThemedText>
            )}
          </View>

          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              이름 / 닉네임
            </ThemedText>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="예: 김믿음"
              placeholderTextColor={Colors.dark.textSecondary}
              maxLength={10}
              style={[styles.input, errors.name && styles.inputError]}
            />
            {errors.name && (
              <ThemedText type="small" style={styles.errorText}>
                {errors.name}
              </ThemedText>
            )}
          </View>
        </View>

        {serverError !== '' && (
          <ThemedText type="small" style={styles.errorText}>
            {serverError}
          </ThemedText>
        )}

        <SoundPressable
          sound="twinkle"
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [styles.button, pressed && styles.pressed, loading && styles.buttonLoading]}>
          <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
            {loading ? '입장 중...' : '입장하기 →'}
          </ThemedText>
        </SoundPressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
          앱을 다시 열면 자동으로 로그인됩니다
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.five,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.dark.gold,
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: Colors.dark.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#F87171',
  },
  errorText: {
    color: '#F87171',
  },
  button: {
    backgroundColor: Colors.dark.gold,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  buttonLoading: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
  footnote: {
    textAlign: 'center',
  },
});
