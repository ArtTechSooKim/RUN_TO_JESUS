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
          <Stack.Screen name="map" options={{ headerShown: true, title: '탐험 지도' }} />
          <Stack.Screen name="station/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="collection" options={{ headerShown: true, title: '수집 현황' }} />
          <Stack.Screen name="scan" options={{ headerShown: true, title: 'QR 스캔' }} />
        </Stack>
      </StationProgressProvider>
    </ThemeProvider>
  );
}
