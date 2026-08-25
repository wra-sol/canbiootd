import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { AppSettings } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleDailyReminder(settings: AppSettings) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.notifyEnabled) return;

  const ok = await ensurePermission();
  if (!ok) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Daily biography',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'CanBIO-OTD',
      body:
        settings.uiLang === 'fr'
          ? 'La biographie du jour est prête.'
          : "Today's Canadian biography is ready.",
      ...(Platform.OS === 'android' ? { channelId: 'daily' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.notifyHour,
      minute: settings.notifyMinute,
    },
  });
}
