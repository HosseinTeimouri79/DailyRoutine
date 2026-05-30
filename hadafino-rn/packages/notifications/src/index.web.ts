import type { NotificationItem, NotificationsAdapter } from './types';

export const webNotifications: NotificationsAdapter = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  async hasPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted';
  },

  async schedule(item: NotificationItem): Promise<void> {
    if (!item.scheduledTime) {
      await this.displayImmediate(item.title, item.body);
      return;
    }

    const [hours, minutes] = item.scheduledTime.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();

    setTimeout(() => {
      void this.displayImmediate(item.title, item.body);
    }, delay);
  },

  async cancel(_id: string): Promise<void> {
    // Browser API doesn't support cancelling scheduled notifications natively
  },

  async cancelAll(): Promise<void> {
    // Browser API limitation
  },

  async displayImmediate(title: string, body: string): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log(`[Notification] ${title}: ${body}`);
      return;
    }

    new Notification(title, { body, icon: '/icon.png' });
  },
};

export const nativeNotifications = webNotifications;
