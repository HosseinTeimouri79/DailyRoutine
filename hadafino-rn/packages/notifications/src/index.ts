export type { NotificationItem, NotificationsAdapter } from './types';

// React Native module resolution order:
//   .windows.ts → React Native Windows
//   .macos.ts   → React Native macOS
//   .native.ts  → iOS + Android
//   .web.ts     → Expo Web
//   .ts         → fallback (this file — re-exports native)
//
// Metro picks the most specific extension automatically.

export { nativeNotifications } from './index.native';
