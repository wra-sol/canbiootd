import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Bio } from '@/lib/types';
import { bioName, bioTeaser } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import Colors from '@/constants/Colors';

type Props = {
  bio: Bio;
  subtitle?: string;
  onPress: () => void;
};

export function BioCard({ bio, subtitle, onPress }: Props) {
  const { settings, colorScheme } = useSettings();
  const c = Colors[colorScheme];
  const name = bioName(bio, settings.bioLang);
  const teaser = bioTeaser(bio, settings.bioLang);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      {subtitle ? (
        <Text style={[styles.sub, { color: c.tint }]}>{subtitle}</Text>
      ) : null}
      <Text style={[styles.name, { color: c.text }]} numberOfLines={2}>
        {name}
      </Text>
      {teaser ? (
        <Text style={[styles.teaser, { color: c.textSecondary }]} numberOfLines={3}>
          {teaser}
        </Text>
      ) : null}
      <View style={styles.metaRow}>
        {bio.birth_year || bio.death_year ? (
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            {[bio.birth_year ?? '?', bio.death_year ?? '?'].join(' – ')}
          </Text>
        ) : null}
        {bio.volume != null ? (
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            vol. {bio.volume}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    minHeight: 88,
  },
  sub: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  teaser: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  meta: {
    fontSize: 12,
  },
});
