import { Overpass_400Regular, Overpass_600SemiBold, Overpass_700Bold, Overpass_800ExtraBold, Overpass_900Black } from '@expo-google-fonts/overpass';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

function HideSplashWhenReady({ fontsReady }: { fontsReady: boolean }) {
  const { ready } = useStore();
  useEffect(() => {
    if (ready && fontsReady) SplashScreen.hideAsync();
  }, [ready, fontsReady]);
  return null;
}

export default function RootLayout() {
  // One appearance: a light topo sheet.
  const c = Colors.dark;
  const base = DefaultTheme;
  const [fontsLoaded, fontError] = useFonts({ Overpass_400Regular, Overpass_600SemiBold, Overpass_700Bold, Overpass_800ExtraBold, Overpass_900Black });
  const fontsReady = fontsLoaded || !!fontError;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: c.accent, background: c.background, card: c.background, text: c.text, border: c.border },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <StoreProvider>
          <HideSplashWhenReady fontsReady={fontsReady} />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShadowVisible: false, headerBackTitle: 'Back', headerTintColor: c.text, headerStyle: { backgroundColor: c.background }, headerTitleStyle: { fontFamily: 'Overpass_700Bold' }, contentStyle: { backgroundColor: c.background } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="peak/[id]" options={{ title: '' }} />
            <Stack.Screen name="log/new" options={{ title: 'Sign the register', presentation: 'modal' }} />
            <Stack.Screen name="ascent/[id]" options={{ title: '' }} />
            <Stack.Screen name="user/[id]" options={{ title: '' }} />
            <Stack.Screen name="plan/new" options={{ title: 'Plan a climb', presentation: 'modal' }} />
            <Stack.Screen name="plan/[id]" options={{ title: '' }} />
            <Stack.Screen name="scan" options={{ title: 'Find old summits' }} />
            <Stack.Screen name="share/[id]" options={{ title: 'Summit card', presentation: 'modal' }} />
            <Stack.Screen name="claim/[token]" options={{ title: 'Claim your summit' }} />
            <Stack.Screen name="signed/[id]" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
          </Stack>
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
