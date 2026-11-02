import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

function HideSplashWhenReady() {
  const { ready } = useStore();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  return null;
}

export default function RootLayout() {
  // Dark-only by design: artwork and photos read best on a dark canvas.
  const c = Colors.dark;
  const base = DarkTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: c.accent, background: c.background, card: c.background, text: c.text, border: c.border },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <StoreProvider>
          <HideSplashWhenReady />
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShadowVisible: false, headerBackTitle: 'Back', headerTintColor: c.text, headerStyle: { backgroundColor: c.background }, contentStyle: { backgroundColor: c.background } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="peak/[id]" options={{ title: '' }} />
            <Stack.Screen name="log/new" options={{ title: 'Sign the register', presentation: 'modal' }} />
            <Stack.Screen name="log/[id]" options={{ title: '' }} />
            <Stack.Screen name="share/[id]" options={{ title: 'Summit card', presentation: 'modal' }} />
            <Stack.Screen name="claim/[token]" options={{ title: 'Claim your summit' }} />
          </Stack>
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
