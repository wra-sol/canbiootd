import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { listFavourites } from '@/lib/db';
import type { Bio } from '@/lib/types';
import { t } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { BioCard } from '@/components/BioCard';
import Colors from '@/constants/Colors';

export default function SavedScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { colorScheme } = useSettings();
  const c = Colors[colorScheme];
  const [rows, setRows] = useState<Bio[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listFavourites(db));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (loading && rows.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.tint} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.list}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={
        <Text style={{ color: c.textSecondary, textAlign: 'center', marginTop: 40 }}>
          {t('saved.empty')}
        </Text>
      }
      renderItem={({ item }) => (
        <BioCard bio={item} onPress={() => router.push(`/bio/${item.id}`)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
});
