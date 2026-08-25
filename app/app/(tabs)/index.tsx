import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getMeta, getTodayBio } from '@/lib/db';
import type { Bio } from '@/lib/types';
import { bioName, bioTeaser, t } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { addDays, formatDisplayDate } from '@/lib/dates';
import Colors from '@/constants/Colors';

export default function TodayScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { settings, colorScheme } = useSettings();
  const c = Colors[colorScheme];
  const [bio, setBio] = useState<Bio | null>(null);
  const [dateLabel, setDateLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const epoch = (await getMeta(db, 'epoch_date')) ?? '2026-08-25';
      const result = await getTodayBio(db);
      if (!result) {
        setBio(null);
        setError(t('today.empty'));
      } else {
        setBio(result.bio);
        const key = addDays(epoch, result.dateOffset);
        setDateLabel(
          formatDisplayDate(key, settings.uiLang === 'fr' ? 'fr-CA' : 'en-CA')
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [db, settings.uiLang]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (loading && !bio) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.tint} size="large" />
        <Text style={{ color: c.textSecondary, marginTop: 12 }}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (error || !bio) {
    return (
      <View style={[styles.center, { backgroundColor: c.background, padding: 24 }]}>
        <Text style={{ color: c.text, textAlign: 'center', fontSize: 16 }}>
          {error ?? t('today.empty')}
        </Text>
        <Pressable
          onPress={() => void load()}
          style={[styles.retry, { backgroundColor: c.tint }]}
          accessibilityRole="button"
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const name = bioName(bio, settings.bioLang);
  const teaser = bioTeaser(bio, settings.bioLang);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={c.tint} />
      }
    >
      <Text style={[styles.kicker, { color: c.tint }]}>{t('today.title')}</Text>
      <Text style={[styles.date, { color: c.textSecondary }]}>{dateLabel}</Text>

      <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.name, { color: c.text }]}>{name}</Text>
        {(bio.birth_year || bio.death_year) && (
          <Text style={[styles.years, { color: c.textSecondary }]}>
            {[bio.birth_year ?? '?', bio.death_year ?? '?'].join(' – ')}
          </Text>
        )}
        {teaser ? (
          <Text style={[styles.teaser, { color: c.textSecondary }]}>{teaser}</Text>
        ) : null}
        <Pressable
          onPress={() => router.push(`/bio/${bio.id}`)}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: c.tint, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('today.readFull')}
        >
          <Text style={styles.ctaText}>{t('today.readFull')}</Text>
        </Pressable>
      </View>

      <Text style={[styles.attrib, { color: c.textSecondary }]}>
        Dictionary of Canadian Biography · University of Toronto / Université Laval
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  kicker: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  date: { marginTop: 6, fontSize: 15 },
  hero: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
  },
  name: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  years: { marginTop: 8, fontSize: 15 },
  teaser: { marginTop: 16, fontSize: 16, lineHeight: 24 },
  cta: {
    marginTop: 22,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  attrib: { marginTop: 24, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  retry: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
