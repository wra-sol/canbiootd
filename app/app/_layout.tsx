import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import 'react-native-reanimated';

import { SettingsProvider, useSettings } from '@/lib/settings';
import { ensureDatabase } from '@/lib/db-setup';
import { t } from '@/lib/i18n';
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
  const [dbState, setDbState] = useState<'pending' | 'ready' | 'error'>('pending');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureDatabase((f) => {
          if (!cancelled) setProgress(f);
        });
        if (!cancelled) setDbState('ready');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('common.error'));
          setDbState('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || dbState === 'pending') {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.tint} size="large" />
        <Text style={[styles.status, { color: c.textSecondary }]}>
          {t('common.preparing')}
          {dbState === 'pending' && progress > 0
            ? ` ${Math.round(progress * 100)}%`
            : ''}
        </Text>
      </View>
    );
  }

  if (dbState === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: c.background, padding: 24 }]}>
        <Text style={{ color: c.text, textAlign: 'center', fontSize: 16 }}>
          {error ?? t('common.error')}
        </Text>
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
      <SQLiteProvider databaseName="bios.sqlite">
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="bio/[id]"
            options={{ title: '', headerBackTitle: 'Back' }}
          />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  status: { marginTop: 14, fontSize: 14 },
});
