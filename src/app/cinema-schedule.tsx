import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SoundPressable } from '@/components/sound-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

type Showtime = {
  time: string;
  title: string;
  emoji: string;
  full?: boolean;
};

// 2026-07-20 진장 확정 상영표 — 믿음의 경주/가타카/브루스 올마이티가 20분씩
// 두 바퀴 돌고, 마지막에 놓친 사람들을 위한 30분 전편 상영으로 마무리.
const SCHEDULE: Showtime[] = [
  { time: '14:00 ~ 14:20', title: '믿음의 경주', emoji: '🏃' },
  { time: '14:20 ~ 14:40', title: '가타카', emoji: '🎞️' },
  { time: '14:40 ~ 15:00', title: '브루스 올마이티', emoji: '✨' },
  { time: '15:00 ~ 15:20', title: '믿음의 경주', emoji: '🏃' },
  { time: '15:20 ~ 15:40', title: '가타카', emoji: '🎞️' },
  { time: '15:40 ~ 16:00', title: '브루스 올마이티', emoji: '✨' },
  { time: '16:00 ~ 16:30', title: '전편 상영', emoji: '🎬', full: true },
];

export default function CinemaScheduleScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <SoundPressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ThemedText type="small">← 돌아가기</ThemedText>
        </SoundPressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <ThemedText type="small" style={styles.eyebrow}>
            🎬 NOW SHOWING
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            여호수아홀 상영시간표
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            상영시간과 내용을 확인해 주세요
          </ThemedText>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <ThemedText type="small" style={styles.tableHeaderText}>
              🕐 상영시간
            </ThemedText>
            <ThemedText type="small" style={styles.tableHeaderText}>
              🎬 상영내용
            </ThemedText>
          </View>
          {SCHEDULE.map((row, index) => (
            <View
              key={`${row.time}-${row.title}`}
              style={[styles.tableRow, index === SCHEDULE.length - 1 && styles.tableRowLast]}>
              <ThemedText type="small" themeColor="textSecondary">
                {row.time}
              </ThemedText>
              <View style={styles.showRow}>
                <ThemedText style={styles.showEmoji}>{row.emoji}</ThemedText>
                <ThemedText type="smallBold">{row.title}</ThemedText>
                {row.full && (
                  <View style={styles.fullBadge}>
                    <ThemedText type="small" style={styles.fullBadgeText}>
                      FULL
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <ThemedText type="smallBold" style={{ color: Colors.dark.gold }}>
            ℹ️ 관람 안내
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            · 상영시간 5분 이후 입장 시 프로그램 설명을 못 들을 수 있습니다.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            · 상영시간 10분 이후 입장이 제한됩니다.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
  },
  backButton: {
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingTop: 0,
    paddingBottom: Spacing.six,
  },
  titleBlock: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  eyebrow: {
    color: Colors.dark.gold,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  title: {
    textAlign: 'center',
  },
  table: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  tableHeaderText: {
    color: Colors.dark.gold,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(17,24,39,0.7)',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  showRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  showEmoji: {
    fontSize: 15,
  },
  fullBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.five,
    backgroundColor: 'rgba(255,215,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  fullBadgeText: {
    color: Colors.dark.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  noticeCard: {
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
