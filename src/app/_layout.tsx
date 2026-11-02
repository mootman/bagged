import { Fraunces_400Regular_Italic, Fraunces_600SemiBold, Fraunces_800ExtraBold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
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
  // Dark-only by design: artwork and photos read best on a dark canvas.
  const c = Colors.dark;
  const base = DarkTheme;
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Fraunces_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });
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
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShadowVisible: false, headerBackTitle: 'Back', headerTintColor: c.text, headerStyle: { backgroundColor: c.background }, headerTitleStyle: { fontFamily: 'Fraunces_600SemiBold' }, contentStyle: { backgroundColor: c.background } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="peak/[id]" options={{ title: '' }} />
            <Stack.Screen name="log/new" options={{ title: 'Sign the register', presentation: 'modal' }} />
            <Stack.Screen name="log/[id]" options={{ title: '' }} />
            <Stack.Screen name="share/[id]" options={{ title: 'Summit card', presentation: 'modal' }} />
            <Stack.Screen name="claim/[token]" options={{ title: 'Claim your summit' }} />
            <Stack.Screen name="signed/[id]" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
          </Stack>
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
