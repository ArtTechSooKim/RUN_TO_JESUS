import { DarkTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { GameEndOverlay } from '@/components/game-end-overlay';
import { Colors } from '@/constants/theme';
import { useGameState } from '@/hooks/use-app-state';
import { AuthProvider } from '@/hooks/use-auth';
import { SoundEffectsProvider, useSoundEffects } from '@/hooks/use-sound-effects';
import { StationProgressProvider } from '@/hooks/use-station-progress';

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

function GlobalGameLock() {
  const gameState = useGameState();
  const pathname = usePathname();
  // 'ending' keeps the same lock UX as 'ended' — it's just the finish-line
  // animation trigger for broadcast.html, not a participant-facing state.
  if (gameState === 'progress' || pathname === '/superadmin') return null;
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

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <StationProgressProvider>
          <SoundEffectsProvider>
            <AnimatedSplashOverlay />
            <GlobalGameLock />
            <AmbientSoundController />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen
                name="login"
                options={{ headerShown: true, title: '', animation: 'fade' }}
              />
              <Stack.Screen
                name="map"
                options={{ headerShown: true, title: '탐험 지도', animation: 'fade' }}
              />
              <Stack.Screen
                name="floormap"
                options={{ headerShown: true, title: '공간 지도', animation: 'slide_from_bottom' }}
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
                name="scan"
                options={{ headerShown: true, title: 'QR 스캔', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="nfc-scan"
                options={{ headerShown: true, title: '', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="nfc-write"
                options={{ headerShown: true, title: '태그 쓰기 (테스트용)', animation: 'slide_from_bottom' }}
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
