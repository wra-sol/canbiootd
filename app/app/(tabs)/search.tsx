import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { searchBios } from '@/lib/db';
import type { Bio } from '@/lib/types';
import { t } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { BioCard } from '@/components/BioCard';
import Colors from '@/constants/Colors';

export default function SearchScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { colorScheme } = useSettings();
  const c = Colors[colorScheme];
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Bio[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = useCallback(
    async (text: string) => {
      setQ(text);
      if (text.trim().length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const rows = await searchBios(db, text);
        setResults(rows);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <TextInput
        value={q}
        onChangeText={(text) => void run(text)}
        placeholder={t('search.placeholder')}
        placeholderTextColor={c.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: c.card,
            borderColor: c.border,
            color: c.text,
          },
        ]}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        returnKeyType="search"
        accessibilityLabel={t('search.placeholder')}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={c.tint} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text
              style={{
                color: c.textSecondary,
                textAlign: 'center',
                marginTop: 32,
              }}
            >
              {searched ? t('search.noResults') : t('search.empty')}
            </Text>
          }
          renderItem={({ item }) => (
            <BioCard
              bio={item}
              onPress={() => router.push(`/bio/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  input: {
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    fontSize: 16,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
});
