import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useSettings } from '@/lib/settings';
import { t } from '@/lib/i18n';
import type { AppSettings, BioLang } from '@/lib/types';
import Colors from '@/constants/Colors';

export default function SettingsScreen() {
  const { settings, update, colorScheme } = useSettings();
  const c = Colors[colorScheme];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.content}
    >
      <Section title={t('settings.language')} color={c.text}>
        <Segment
          options={[
            { key: 'en', label: t('settings.english') },
            { key: 'fr', label: t('settings.french') },
          ]}
          value={settings.bioLang}
          onChange={(bioLang) => void update({ bioLang: bioLang as BioLang })}
          colors={c}
        />
      </Section>

      <Section title={t('settings.uiLanguage')} color={c.text}>
        <Segment
          options={[
            { key: 'en', label: t('settings.english') },
            { key: 'fr', label: t('settings.french') },
          ]}
          value={settings.uiLang}
          onChange={(uiLang) => void update({ uiLang: uiLang as BioLang })}
          colors={c}
        />
      </Section>

      <Section title={t('settings.appearance')} color={c.text}>
        <Segment
          options={[
            { key: 'system', label: t('settings.themeSystem') },
            { key: 'light', label: t('settings.themeLight') },
            { key: 'dark', label: t('settings.themeDark') },
          ]}
          value={settings.theme}
          onChange={(theme) =>
            void update({ theme: theme as AppSettings['theme'] })
          }
          colors={c}
        />
      </Section>

      <Section title={t('settings.fontSize')} color={c.text}>
        <Segment
          options={[
            { key: '0.9', label: 'A−' },
            { key: '1', label: 'A' },
            { key: '1.15', label: 'A+' },
            { key: '1.3', label: 'A++' },
          ]}
          value={String(settings.fontScale)}
          onChange={(v) => void update({ fontScale: Number(v) })}
          colors={c}
        />
      </Section>

      <Section title={t('settings.notifications')} color={c.text}>
        <View
          style={[
            styles.row,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text style={{ color: c.text, flex: 1, fontSize: 16 }}>
            {t('settings.notifyOn')}
          </Text>
          <Switch
            value={settings.notifyEnabled}
            onValueChange={(notifyEnabled) => void update({ notifyEnabled })}
            trackColor={{ true: c.tint }}
          />
        </View>
        {settings.notifyEnabled ? (
          <View style={styles.timeRow}>
            {[
              { h: 7, m: 0, label: '7:00' },
              { h: 8, m: 0, label: '8:00' },
              { h: 9, m: 0, label: '9:00' },
              { h: 12, m: 0, label: '12:00' },
              { h: 18, m: 0, label: '18:00' },
            ].map((opt) => {
              const active =
                settings.notifyHour === opt.h && settings.notifyMinute === opt.m;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() =>
                    void update({ notifyHour: opt.h, notifyMinute: opt.m })
                  }
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? c.tint : c.card,
                      borderColor: c.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#fff' : c.text, fontWeight: '600' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Section>

      <Section title={t('settings.about')} color={c.text}>
        <View
          style={[
            styles.about,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text style={{ color: c.textSecondary, lineHeight: 22, fontSize: 14 }}>
            {t('settings.aboutBody')}
          </Text>
          <LinkRow
            label={t('settings.terms')}
            href="https://www.biographi.ca/en/notices.html"
            color={c.link}
          />
          <LinkRow
            label={t('settings.website')}
            href="https://www.biographi.ca/en/"
            color={c.link}
          />
          <LinkRow
            label={t('settings.donate')}
            href="https://donate.utoronto.ca/dcb/"
            color={c.link}
          />
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

function Segment({
  options,
  value,
  onChange,
  colors,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.segBtn,
              {
                backgroundColor: active ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={{
                color: active ? '#fff' : colors.text,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LinkRow({
  label,
  href,
  color,
}: {
  label: string;
  href: string;
  color: string;
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(href)}
      style={{ minHeight: 44, justifyContent: 'center', marginTop: 8 }}
      accessibilityRole="link"
    >
      <Text style={{ color, fontWeight: '600', fontSize: 15 }}>{label} →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  segment: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  about: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
});
