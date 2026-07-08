import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

type RunnerProgressBarProps = {
  /** 0-100. Ignored when mode='ending' (always animates to 100). */
  percent: number;
  mode: 'progress' | 'ending';
};

const TRACK_HEIGHT = 40;

/**
 * "Runner running toward a flag" progress bar — used on /map (live, mode='progress')
 * and broadcast.html's ending trigger (mode='ending' forces a 100% finish-line animation).
 * See RUN_TO_JESUS_앱_개발문서.md's ending-flow spec: same component, only `mode` differs.
 */
export function RunnerProgressBar({ percent, mode }: RunnerProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const target = mode === 'ending' ? 100 : clamped;
  const fill = useSharedValue(target);
  const [showGoal, setShowGoal] = useState(false);

  useEffect(() => {
    fill.value = withTiming(target, { duration: mode === 'ending' ? 1000 : 700 });
  }, [target, mode, fill]);

  useEffect(() => {
    if (mode !== 'ending') {
      setShowGoal(false);
      return;
    }
    const t = setTimeout(() => setShowGoal(true), 1200);
    return () => clearTimeout(t);
  }, [mode]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value}%` }));

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <View style={styles.runnerBadge}>
            <ThemedText style={styles.runnerIcon}>🏃</ThemedText>
          </View>
        </Animated.View>
        <View style={styles.flagBadge}>
          <ThemedText style={styles.flagIcon}>🏁</ThemedText>
        </View>
      </View>
      <View style={styles.labelsRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {mode === 'ending' ? '' : `${Math.round(clamped)}%`}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.goalLabel}>
          GOAL
        </ThemedText>
      </View>
      {showGoal && (
        <Animated.View entering={FadeIn.duration(600)} style={styles.goalTextWrap}>
          <ThemedText type="subtitle" style={styles.goalText}>
            GOAL!
          </ThemedText>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.one,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Colors.dark.gold,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  runnerBadge: {
    position: 'absolute',
    right: -TRACK_HEIGHT / 2 + 2,
    width: TRACK_HEIGHT - 6,
    height: TRACK_HEIGHT - 6,
    borderRadius: (TRACK_HEIGHT - 6) / 2,
    backgroundColor: Colors.dark.background,
    borderWidth: 2,
    borderColor: Colors.dark.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerIcon: {
    fontSize: 16,
  },
  flagBadge: {
    position: 'absolute',
    right: Spacing.two,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  flagIcon: {
    fontSize: 16,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  goalLabel: {
    letterSpacing: 1,
  },
  goalTextWrap: {
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  goalText: {
    color: Colors.dark.gold,
    textShadowColor: 'rgba(255,215,0,0.6)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: 2,
  },
});
