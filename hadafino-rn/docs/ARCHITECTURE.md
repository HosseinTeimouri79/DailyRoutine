# Hadafino — Architecture

## Overview

Hadafino is a cross-platform daily routine manager built as a Turborepo monorepo. One codebase produces six platform targets.

## Platform Targets

| Platform | Technology | Output |
|---|---|---|
| Android | Expo EAS Build | APK + AAB |
| iOS | Expo EAS Build | IPA |
| Web | Expo Web (React Native Web) | Static bundle |
| Linux | Electron wrapping web bundle | AppImage, .deb, .rpm |
| Windows | React Native Windows 0.76 | MSIX |
| macOS | React Native macOS 0.76 | .app bundle |

## Monorepo Structure

```
hadafino-rn/
├── apps/
│   ├── mobile/              # Expo Router — iOS, Android, Web
│   ├── desktop-linux/       # Electron shell wrapping web bundle
│   ├── desktop-windows/     # React Native Windows
│   └── desktop-macos/       # React Native macOS
└── packages/
    ├── core/                # Business logic, API, DB, Sync
    ├── theme/               # Design tokens + ThemeProvider
    ├── i18n/                # i18next FA/EN + RTL
    ├── ui/                  # Shared React Native components
    └── notifications/       # Platform-specific notification adapters
```

## Package Dependency Graph

```
apps/mobile ──────────────────────────────────────────┐
apps/desktop-linux (wraps mobile web build)           │
apps/desktop-windows ─────────────────────────────────┤──▶ packages/core
apps/desktop-macos ────────────────────────────────────┤──▶ packages/theme
                                                       │──▶ packages/i18n
                                                       │──▶ packages/ui
                                                       └──▶ packages/notifications
```

## State Architecture

```
UI Components
    │
    ▼
Zustand Stores (authStore, settingsStore, uiStore)
    │
    ▼
TanStack Query (server state cache)
    │
    ▼
WatermelonDB Hooks (useDailyTasks, useRoutines, useNotes, …)
    │
    ├── reads → WatermelonDB (SQLite local)
    └── writes → WatermelonDB + SyncQueue
                      │
                      ▼ (when online)
                 SyncEngine → Flask API → PostgreSQL
```

## Offline-First Sync

Every mutation follows this order:
1. Write to WatermelonDB (local SQLite)
2. Enqueue to `sync_queue` table
3. Return immediately to UI (optimistic)
4. SyncEngine drains queue when online (FIFO, exponential backoff)
5. Server IDs written back to local records

Conflict resolution: last-write-wins by `updated_at` timestamp.

## Platform-Specific Code

Metro resolves extensions in this order:

```
.windows.ts  →  React Native Windows
.macos.ts    →  React Native macOS
.native.ts   →  iOS + Android
.web.ts      →  Expo Web / Electron
.ts          →  fallback
```

Used in `packages/notifications/src/`:
- `index.windows.ts` — WinRT ToastNotification via NativeModules bridge
- `index.macos.ts` — UNUserNotificationCenter via NativeModules bridge
- `index.native.ts` — expo-notifications
- `index.web.ts` — Web Notification API (also used by Electron renderer)

## Key Libraries

| Concern | Library |
|---|---|
| Navigation | Expo Router (file-based) |
| Local DB | WatermelonDB + SQLite |
| Persistence | react-native-mmkv |
| Server state | TanStack Query v5 |
| UI state | Zustand v5 + Immer |
| i18n | i18next + react-i18next |
| Animations | react-native-reanimated v3 |
| Notifications (mobile) | expo-notifications |
| Notifications (Windows) | WinRT ToastNotification (native module) |
| Notifications (macOS) | UNUserNotificationCenter (native module) |
| Linux shell | Electron v33 |
| Build (mobile) | EAS Build |
| Build (desktop) | electron-builder, MSBuild, xcodebuild |
| Monorepo | Turborepo |
