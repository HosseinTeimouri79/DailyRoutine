export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  scheduledTime?: string; // HH:mm
  repeats?: boolean;
}

export interface NotificationsAdapter {
  requestPermission(): Promise<boolean>;
  schedule(item: NotificationItem): Promise<void>;
  cancel(id: string): Promise<void>;
  cancelAll(): Promise<void>;
  hasPermission(): Promise<boolean>;
  displayImmediate(title: string, body: string): Promise<void>;
}
