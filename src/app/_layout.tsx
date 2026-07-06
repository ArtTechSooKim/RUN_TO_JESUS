import { DarkTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { GameEndOverlay } from '@/components/game-end-overlay';
import { Colors } from '@/constants/theme';
import { useGameState } from '@/hooks/use-app-state';
import { AuthProvider } from '@/hooks/use-auth';
import { StationProgressProvider } from '@/hooks/use-station-progress';

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
  if (gameState !== 'ended' || pathname === '/superadmin') return null;
  return <GameEndOverlay />;
}

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <StationProgressProvider>
          <AnimatedSplashOverlay />
          <GlobalGameLock />
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
        </StationProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
