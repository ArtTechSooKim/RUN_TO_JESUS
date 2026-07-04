import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
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

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <StationProgressProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="map"
            options={{ headerShown: true, title: '탐험 지도', animation: 'fade' }}
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
        </Stack>
      </StationProgressProvider>
    </ThemeProvider>
  );
}
