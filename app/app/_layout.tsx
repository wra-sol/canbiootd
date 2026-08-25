import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import 'react-native-reanimated';

import { SettingsProvider, useSettings } from '@/lib/settings';
import Colors from '@/constants/Colors';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SettingsProvider>
      <RootNav />
    </SettingsProvider>
  );
}

function RootNav() {
  const { colorScheme, ready } = useSettings();
  const c = Colors[colorScheme];

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator color={c.tint} />
      </View>
    );
  }

  const theme =
    colorScheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: c.tint,
            background: c.background,
            card: c.card,
            text: c.text,
            border: c.border,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: c.tint,
            background: c.background,
            card: c.card,
            text: c.text,
            border: c.border,
          },
        };

  return (
    <ThemeProvider value={theme}>
      <Suspense
        fallback={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
            <ActivityIndicator color={c.tint} />
          </View>
        }
      >
        <SQLiteProvider
          databaseName="bios.sqlite"
          assetSource={{ assetId: require('../assets/bios.sqlite') }}
          useSuspense
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="bio/[id]"
              options={{ title: '', headerBackTitle: 'Back' }}
            />
          </Stack>
        </SQLiteProvider>
      </Suspense>
    </ThemeProvider>
  );
}
