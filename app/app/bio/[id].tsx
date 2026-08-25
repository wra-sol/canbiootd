import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getBioById } from '@/lib/db';
import type { Bio } from '@/lib/types';
import { bioName, t } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { BioReader } from '@/components/BioReader';
import Colors from '@/constants/Colors';

export default function BioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { settings, colorScheme } = useSettings();
  const c = Colors[colorScheme];
  const [bio, setBio] = useState<Bio | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await getBioById(db, Number(id));
        if (!cancelled) {
          if (!row) setError(t('common.error'));
          else setBio(row);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('common.error'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, id]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={{ color: c.text }}>{error}</Text>
      </View>
    );
  }

  if (!bio) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.tint} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: bioName(bio, settings.bioLang) }} />
      <BioReader bio={bio} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
