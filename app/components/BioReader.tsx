import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import RenderHTML from 'react-native-render-html';
import * as Linking from 'expo-linking';
import type { Bio } from '@/lib/types';
import {
  bioBiblio,
  bioHtml,
  bioName,
  bioUrl,
  t,
} from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { isFavourite, toggleFavourite } from '@/lib/db';
import Colors from '@/constants/Colors';

type Props = {
  bio: Bio;
  dateLabel?: string;
};

export function BioReader({ bio, dateLabel }: Props) {
  const db = useSQLiteContext();
  const { settings, colorScheme } = useSettings();
  const c = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const [fav, setFav] = useState(false);
  const [ready, setReady] = useState(false);

  const lang = settings.bioLang;
  const name = bioName(bio, lang);
  const html = bioHtml(bio, lang);
  const biblio = bioBiblio(bio, lang);
  const url = bioUrl(bio, lang);
  const baseFont = 17 * settings.fontScale;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const v = await isFavourite(db, bio.id);
      if (!cancelled) {
        setFav(v);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, bio.id]);

  const onToggleFav = useCallback(async () => {
    const next = await toggleFavourite(db, bio.id);
    setFav(next);
  }, [db, bio.id]);

  const onShare = useCallback(async () => {
    await Share.share({
      message: `${name}\n\n${url}\n\n— Dictionary of Canadian Biography`,
      url,
      title: name,
    });
  }, [name, url]);

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.tint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.content}
    >
      {dateLabel ? (
        <Text style={[styles.date, { color: c.tint }]}>{dateLabel}</Text>
      ) : null}
      <Text style={[styles.title, { color: c.text, fontSize: 28 * settings.fontScale }]}>
        {name}
      </Text>
      {(bio.birth_text || bio.death_text) && (
        <Text style={[styles.dates, { color: c.textSecondary }]}>
          {[bio.birth_text && `b. ${bio.birth_text}`, bio.death_text && `d. ${bio.death_text}`]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      )}
      {bio.author ? (
        <Text style={[styles.meta, { color: c.textSecondary }]}>
          {t('reader.author')}: {bio.author}
          {bio.volume != null ? ` · ${t('reader.volume')} ${bio.volume}` : ''}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <ActionBtn
          label={fav ? t('reader.saved') : t('reader.save')}
          onPress={onToggleFav}
          color={c.tint}
          border={c.border}
          bg={c.card}
        />
        <ActionBtn
          label={t('reader.share')}
          onPress={onShare}
          color={c.tint}
          border={c.border}
          bg={c.card}
        />
      </View>

      <RenderHTML
        contentWidth={width - 40}
        source={{ html }}
        baseStyle={{
          color: c.text,
          fontSize: baseFont,
          lineHeight: baseFont * 1.55,
        }}
        tagsStyles={{
          p: { marginBottom: 14 },
          a: { color: c.link },
          em: { fontStyle: 'italic' },
          i: { fontStyle: 'italic' },
          strong: { fontWeight: '700' },
          b: { fontWeight: '700' },
        }}
        defaultTextProps={{ selectable: true }}
      />

      {biblio ? (
        <View style={[styles.biblio, { borderColor: c.border }]}>
          <Text style={[styles.biblioTitle, { color: c.text }]}>
            {t('reader.bibliography')}
          </Text>
          <RenderHTML
            contentWidth={width - 40}
            source={{ html: biblio }}
            baseStyle={{
              color: c.textSecondary,
              fontSize: baseFont * 0.9,
              lineHeight: baseFont * 1.4,
            }}
            tagsStyles={{ p: { marginBottom: 8 }, a: { color: c.link } }}
            defaultTextProps={{ selectable: true }}
          />
        </View>
      ) : null}

      <View style={[styles.source, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.sourceTitle, { color: c.text }]}>{t('reader.source')}</Text>
        <Text style={[styles.sourceBody, { color: c.textSecondary }]} selectable>
          {bio.citation ||
            `${name}. Dictionary of Canadian Biography. University of Toronto / Université Laval.`}
        </Text>
        <Pressable
          onPress={() => Linking.openURL(url)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 10 })}
          accessibilityRole="link"
        >
          <Text style={{ color: c.link, fontWeight: '600', fontSize: 16, minHeight: 44, textAlignVertical: 'center' }}>
            {t('reader.readOnDcb')} →
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ActionBtn({
  label,
  onPress,
  color,
  border,
  bg,
}: {
  label: string;
  onPress: () => void;
  color: string;
  border: string;
  bg: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: border, backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
      ]}
      accessibilityRole="button"
    >
      <Text style={{ color, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 48 },
  date: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  title: { fontWeight: '800', lineHeight: 34 },
  dates: { marginTop: 8, fontSize: 14, lineHeight: 20 },
  meta: { marginTop: 6, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  btn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biblio: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  biblioTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  source: {
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sourceTitle: { fontWeight: '700', fontSize: 14, marginBottom: 6 },
  sourceBody: { fontSize: 13, lineHeight: 19 },
});
