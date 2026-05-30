import type { NotificationItem, NotificationsAdapter } from './types';
import { Platform, NativeModules } from 'react-native';

// macOS User Notifications via React Native macOS
// Uses the UNUserNotificationCenter API through a native module bridge.
// The native module `RNMacOSNotifications` must be registered in the
// macOS project (see apps/desktop-macos/macos/hadafino/AppDelegate.swift).

interface RNMacOSNotificationsModule {
  requestPermission(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
  scheduleNotification(id: string, title: string, body: string, triggerDate?: string): Promise<void>;
  cancelNotification(id: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
}

const MacNotif: RNMacOSNotificationsModule | null =
  Platform.OS === 'macos'
    ? (NativeModules.RNMacOSNotifications as RNMacOSNotificationsModule)
    : null;

export const macosNotifications: NotificationsAdapter = {
  async requestPermission(): Promise<boolean> {
    if (!MacNotif) return false;
    return MacNotif.requestPermission();
  },

  async hasPermission(): Promise<boolean> {
    if (!MacNotif) return false;
    return MacNotif.hasPermission();
  },

  async schedule(item: NotificationItem): Promise<void> {
    if (!MacNotif) return;
    let triggerDate: string | undefined;
    if (item.scheduledTime) {
      const [h, m] = item.scheduledTime.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= new Date()) target.setDate(target.getDate() + 1);
      triggerDate = target.toISOString();
    }
    await MacNotif.scheduleNotification(item.id, item.title, item.body, triggerDate);
  },

  async cancel(id: string): Promise<void> {
    await MacNotif?.cancelNotification(id);
  },

  async cancelAll(): Promise<void> {
    await MacNotif?.cancelAllNotifications();
  },

  async displayImmediate(title: string, body: string): Promise<void> {
    await MacNotif?.scheduleNotification(`imm_${Date.now()}`, title, body);
  },
};

export const nativeNotifications = macosNotifications;
