import * as ExpoNotifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import type { NotificationItem, NotificationsAdapter } from './types';

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const BACKGROUND_ALARM_TASK = 'HADAFINO_ALARM_CHECK';

export function defineBackgroundAlarmTask(
  handler: () => Promise<BackgroundFetch.BackgroundFetchResult>,
): void {
  if (!TaskManager.isTaskDefined(BACKGROUND_ALARM_TASK)) {
    TaskManager.defineTask(BACKGROUND_ALARM_TASK, handler);
  }
}

export async function registerBackgroundAlarmTask(): Promise<void> {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_ALARM_TASK, {
    minimumInterval: 60,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export const nativeNotifications: NotificationsAdapter = {
  async requestPermission(): Promise<boolean> {
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async hasPermission(): Promise<boolean> {
    const { status } = await ExpoNotifications.getPermissionsAsync();
    return status === 'granted';
  },

  async schedule(item: NotificationItem): Promise<void> {
    if (!item.scheduledTime) {
      await this.displayImmediate(item.title, item.body);
      return;
    }

    const [hours, minutes] = item.scheduledTime.split(':').map(Number);

    await ExpoNotifications.scheduleNotificationAsync({
      identifier: item.id,
      content: {
        title: item.title,
        body: item.body,
        sound: 'default',
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: item.repeats ?? true,
      } as ExpoNotifications.DailyTriggerInput,
    });
  },

  async cancel(id: string): Promise<void> {
    await ExpoNotifications.cancelScheduledNotificationAsync(id);
  },

  async cancelAll(): Promise<void> {
    await ExpoNotifications.cancelAllScheduledNotificationsAsync();
  },

  async displayImmediate(title: string, body: string): Promise<void> {
    await ExpoNotifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null,
    });
  },
};
