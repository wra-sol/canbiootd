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
import { getArchivePage, getMeta } from '@/lib/db';
import type { Bio } from '@/lib/types';
import { t } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { addDays, daysSinceEpoch, formatDisplayDate } from '@/lib/dates';
import { BioCard } from '@/components/BioCard';
import Colors from '@/constants/Colors';

type Row = { offset: number; bio: Bio };

export default function ArchiveScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { settings, colorScheme } = useSettings();
  const c = Colors[colorScheme];
  const [rows, setRows] = useState<Row[]>([]);
  const [epoch, setEpoch] = useState('2026-08-25');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ep = (await getMeta(db, 'epoch_date')) ?? '2026-08-25';
      setEpoch(ep);
      const today = daysSinceEpoch(ep);
      // last 60 days including today
      const from = today;
      const to = Math.max(0, today - 59);
      const page = await getArchivePage(db, from, to);
      setRows(page);
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
      keyExtractor={(item) => String(item.offset)}
      ListEmptyComponent={
        <Text style={{ color: c.textSecondary, textAlign: 'center', marginTop: 40 }}>
          {t('archive.empty')}
        </Text>
      }
      renderItem={({ item }) => {
        const key = addDays(epoch, item.offset);
        const label = formatDisplayDate(
          key,
          settings.uiLang === 'fr' ? 'fr-CA' : 'en-CA'
        );
        return (
          <BioCard
            bio={item.bio}
            subtitle={label}
            onPress={() => router.push(`/bio/${item.bio.id}`)}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
});
