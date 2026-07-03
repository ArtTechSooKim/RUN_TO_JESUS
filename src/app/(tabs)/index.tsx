import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            2026 청년연합수련회
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            RUN TO{'\n'}JESUS
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            믿음의 경주에 오신 것을 환영합니다.{'\n'}바통을 이어받아 함께 달려가십시오.
          </ThemedText>
        </ThemedView>

        <Link href="/map" asChild>
          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView style={styles.ctaButton}>
              <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
                탐험 시작하기
              </ThemedText>
            </ThemedView>
          </Pressable>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  title: {
    textAlign: 'center',
    color: Colors.dark.gold,
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: 2,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
});
