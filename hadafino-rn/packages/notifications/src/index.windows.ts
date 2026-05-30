import type { NotificationItem, NotificationsAdapter } from './types';
import { Platform, NativeModules } from 'react-native';

// Windows Toast Notifications via React Native Windows
// Uses the WinRT ToastNotification API through a native module bridge.
// The native module `RNWindowsNotifications` must be registered in the
// Windows project (see apps/desktop-windows/windows/hadafino/MainPage.cpp).

interface RNWindowsNotificationsModule {
  scheduleNotification(id: string, title: string, body: string, timeISO?: string): Promise<void>;
  cancelNotification(id: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  requestPermission(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
}

const WinNotif: RNWindowsNotificationsModule | null =
  Platform.OS === 'windows'
    ? (NativeModules.RNWindowsNotifications as RNWindowsNotificationsModule)
    : null;

export const windowsNotifications: NotificationsAdapter = {
  async requestPermission(): Promise<boolean> {
    if (!WinNotif) return false;
    return WinNotif.requestPermission();
  },

  async hasPermission(): Promise<boolean> {
    if (!WinNotif) return false;
    return WinNotif.hasPermission();
  },

  async schedule(item: NotificationItem): Promise<void> {
    if (!WinNotif) return;
    let timeISO: string | undefined;
    if (item.scheduledTime) {
      const [h, m] = item.scheduledTime.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= new Date()) target.setDate(target.getDate() + 1);
      timeISO = target.toISOString();
    }
    await WinNotif.scheduleNotification(item.id, item.title, item.body, timeISO);
  },

  async cancel(id: string): Promise<void> {
    await WinNotif?.cancelNotification(id);
  },

  async cancelAll(): Promise<void> {
    await WinNotif?.cancelAllNotifications();
  },

  async displayImmediate(title: string, body: string): Promise<void> {
    await WinNotif?.scheduleNotification(`imm_${Date.now()}`, title, body);
  },
};

export const nativeNotifications = windowsNotifications;
