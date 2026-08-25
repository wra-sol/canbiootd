import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, useColorScheme as useSystemScheme } from 'react-native';
import { DEFAULT_SETTINGS, type AppSettings, type BioLang } from './types';
import { setUiLocale } from './i18n';
import { scheduleDailyReminder } from './notifications';

const KEY = 'canbiootd.settings.v1';

type Ctx = {
  settings: AppSettings;
  ready: boolean;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  colorScheme: 'light' | 'dark';
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemScheme() ?? 'light';
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
          setSettings(parsed);
          setUiLocale(parsed.uiLang as BioLang);
        } else {
          setUiLocale(DEFAULT_SETTINGS.uiLang);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void AsyncStorage.setItem(KEY, JSON.stringify(next));
      if (patch.uiLang) setUiLocale(patch.uiLang);
      if (
        patch.notifyEnabled !== undefined ||
        patch.notifyHour !== undefined ||
        patch.notifyMinute !== undefined
      ) {
        void scheduleDailyReminder(next);
      }
      return next;
    });
  }, []);

  const colorScheme: 'light' | 'dark' =
    settings.theme === 'system'
      ? system === 'dark'
        ? 'dark'
        : 'light'
      : settings.theme;

  const value = useMemo(
    () => ({ settings, ready, update, colorScheme }),
    [settings, ready, update, colorScheme]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings outside provider');
  return ctx;
}

// silence unused Appearance import side-effect if tree-shaken
void Appearance;
