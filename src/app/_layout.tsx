import { DarkTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { FragmentRevealOverlay } from '@/components/fragment-reveal-overlay';
import { GameEndOverlay } from '@/components/game-end-overlay';
import { Colors } from '@/constants/theme';
import { useGameState } from '@/hooks/use-app-state';
import { AuthProvider } from '@/hooks/use-auth';
import { SoundEffectsProvider, useSoundEffects } from '@/hooks/use-sound-effects';
import { StationProgressProvider, useStationProgress } from '@/hooks/use-station-progress';

const AMBIENT_ROUTES = new Set(['/', '/login']);

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.backgroundElement,
    text: Colors.dark.text,
    border: Colors.dark.backgroundSelected,
    primary: Colors.dark.gold,
  },
};

// Always reachable regardless of game_state — /superadmin is the control
// screen itself, /login must stay open or a locked-out admin (or anyone
// who logs out while the game is ended/ending) has no way back in at all,
// /nfc-write is driven from 최고관리자's 태그 관리 tab, and /admin (station
// management, reached via the name="관리자"+team="관리자" login bypass) is
// exactly what station leads need to prep before doors open — game_state is
// 'ended' at that point.
const LOCK_EXEMPT_ROUTES = new Set(['/superadmin', '/login', '/nfc-write', '/admin']);

function GlobalGameLock() {
  const gameState = useGameState();
  const pathname = usePathname();
  // 'ending' keeps the same lock UX as 'ended' — it's just the finish-line
  // animation trigger for broadcast.html, not a participant-facing state.
  if (gameState === 'progress' || LOCK_EXEMPT_ROUTES.has(pathname)) return null;
  return <GameEndOverlay />;
}

/** Ambient bed plays only on the intro/login screens — see 기능정리 UX notes. */
function AmbientSoundController() {
  const pathname = usePathname();
  const { startAmbient, stopAmbient } = useSoundEffects();

  useEffect(() => {
    if (AMBIENT_ROUTES.has(pathname)) startAmbient();
    else stopAmbient();
  }, [pathname, startAmbient, stopAmbient]);

  return null;
}

/** Global "믿음의 조각 획득" celebration — fires for every device on the team, not just whoever scanned. */
function FragmentRevealController() {
  const { newlyCollected, skipReveal } = useStationProgress();
  return <FragmentRevealOverlay letterIndex={newlyCollected} onDone={skipReveal} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <StationProgressProvider>
          <SoundEffectsProvider>
            <AnimatedSplashOverlay />
            <GlobalGameLock />
            <AmbientSoundController />
            <FragmentRevealController />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen
                name="login"
                options={{ headerShown: true, title: '', animation: 'fade' }}
              />
              <Stack.Screen
                name="map"
                options={{ headerShown: true, title: '레이스 코스', animation: 'fade' }}
              />
              <Stack.Screen
                name="floormap"
                options={{ headerShown: true, title: '레이스 존 지도', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="station/[id]"
                options={{ headerShown: true, title: '', animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="collection"
                options={{ headerShown: true, title: '수집 현황', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="cinema-schedule"
                options={{ headerShown: false, animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="scan"
                options={{ headerShown: true, title: 'QR 스캔', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="nfc-scan"
                options={{ headerShown: true, title: '', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="nfc-write"
                options={{ headerShown: true, title: 'NFC 태그 쓰기', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="settings"
                options={{ headerShown: true, title: '설정', animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="admin"
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="superadmin"
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />
            </Stack>
          </SoundEffectsProvider>
        </StationProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
