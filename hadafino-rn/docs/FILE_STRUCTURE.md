# Hadafino — File Structure

```
hadafino-rn/
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint + type-check + tests on every PR
│       └── build.yml           # Release builds for all 6 platforms
│
├── apps/
│   │
│   ├── mobile/                 # Expo Router app (iOS + Android + Web)
│   │   ├── app/
│   │   │   ├── _layout.tsx     # Root layout: providers + auth guard + Snackbar
│   │   │   ├── (auth)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   └── (main)/
│   │   │       ├── _layout.tsx         # Bottom tab navigator
│   │   │       ├── index.tsx           # Daily Tasks screen
│   │   │       ├── calendar.tsx        # Monthly Calendar screen
│   │   │       ├── settings.tsx        # Settings screen
│   │   │       ├── routines/index.tsx  # Weekly Routines screen
│   │   │       ├── notes/index.tsx     # Notes screen
│   │   │       └── important-days/index.tsx
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── tasks/TaskFormModal.tsx
│   │   │   │   ├── routines/RoutineFormModal.tsx
│   │   │   │   ├── notes/NoteFormModal.tsx
│   │   │   │   └── important-days/ImportantDayFormModal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDailyTasks.ts    # WatermelonDB + TanStack Query
│   │   │   │   ├── useRoutines.ts
│   │   │   │   ├── useNotes.ts
│   │   │   │   └── useImportantDays.ts
│   │   │   ├── providers/
│   │   │   │   └── AppProviders.tsx    # QueryClient + ThemeProvider + bootstrap
│   │   │   └── store/
│   │   │       ├── authStore.ts        # Zustand: token + user
│   │   │       ├── settingsStore.ts    # Zustand: theme + language + calendarType
│   │   │       └── uiStore.ts          # Zustand: selectedDate + snackbar
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   ├── eas.json
│   │   ├── metro.config.js
│   │   └── package.json
│   │
│   ├── desktop-linux/          # Electron shell (wraps web bundle)
│   │   ├── electron/
│   │   │   ├── main.js         # BrowserWindow + Tray + auto-updater
│   │   │   └── preload.js      # contextBridge: notifications + update IPC
│   │   └── package.json        # electron-builder config (AppImage/deb/rpm)
│   │
│   ├── desktop-windows/        # React Native Windows 0.76
│   │   ├── windows/
│   │   │   └── hadafino/
│   │   │       ├── MainPage.h  # WinRT ToastNotification native module
│   │   │       └── MainPage.cpp
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── navigation/RootNavigator.tsx
│   │   │   ├── screens/
│   │   │   └── store/          # authStore + settingsStore (MMKV-backed)
│   │   ├── index.js
│   │   ├── metro.config.js
│   │   └── package.json
│   │
│   └── desktop-macos/          # React Native macOS 0.76
│       ├── macos/
│       │   └── hadafino/
│       │       ├── AppDelegate.swift
│       │       └── Info.plist
│       ├── src/
│       │   ├── App.tsx
│       │   ├── navigation/RootNavigator.tsx
│       │   ├── screens/
│       │   └── store/          # authStore + settingsStore (MMKV-backed)
│       ├── index.js
│       ├── metro.config.js
│       └── package.json
│
├── packages/
│   │
│   ├── core/                   # Platform-agnostic business logic
│   │   └── src/
│   │       ├── api/client.ts           # Axios REST client + JWT interceptor
│   │       ├── auth/AuthService.ts     # login / register / logout
│   │       ├── date/index.ts           # Jalali/Gregorian utils
│   │       ├── recurrence/index.ts     # Routine scheduling logic
│   │       ├── storage/index.ts        # Pluggable storage adapter
│   │       ├── sync/
│   │       │   ├── SyncEngine.ts       # Push/pull cycle + auto-sync
│   │       │   ├── SyncQueue.ts        # Enqueue / drain pending ops
│   │       │   ├── ConflictResolver.ts # Last-write-wins strategy
│   │       │   └── SyncMetadataStore.ts
│   │       ├── db/
│   │       │   ├── database.ts         # WatermelonDB init
│   │       │   ├── schema.ts           # SQLite schema (all tables)
│   │       │   └── models/             # WatermelonDB Model classes
│   │       │       ├── DailyTask.ts
│   │       │       ├── Routine.ts
│   │       │       ├── RoutineLog.ts
│   │       │       ├── Note.ts
│   │       │       ├── ImportantDay.ts
│   │       │       ├── SyncQueueItem.ts
│   │       │       └── SyncMetadata.ts
│   │       └── types/index.ts          # Shared TypeScript interfaces
│   │
│   ├── theme/
│   │   └── src/
│   │       ├── tokens/index.ts         # ThemeTokens interface + spacing/radius/typography
│   │       ├── themes/
│   │       │   ├── colors.ts           # 6 color palettes
│   │       │   └── index.ts            # THEMES map + ThemeName + THEME_OPTIONS
│   │       ├── ThemeProvider.tsx       # React context + useTheme hook
│   │       └── index.ts
│   │
│   ├── i18n/
│   │   └── src/
│   │       ├── translations/
│   │       │   ├── fa.ts               # Full Persian translations
│   │       │   └── en.ts               # Full English translations
│   │       ├── i18n.ts                 # initI18n + changeLanguage + configureRTL
│   │       └── index.ts
│   │
│   ├── ui/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Button/             # variant: primary|secondary|danger|ghost
│   │       │   ├── Card/               # title + subtitle + headerRight
│   │       │   ├── Checkbox/           # accessible toggle
│   │       │   ├── ConfirmModal/       # destructive confirm dialog
│   │       │   ├── Dropdown/           # generic typed select
│   │       │   ├── IconButton/         # icon-only pressable
│   │       │   ├── Input/              # label + error + adornments
│   │       │   ├── Modal/              # bottom sheet with Reanimated
│   │       │   ├── ProgressRing/       # animated SVG ring
│   │       │   ├── Snackbar/           # auto-dismiss toast
│   │       │   └── TimePicker/         # 12h/24h spinner modal
│   │       └── index.ts
│   │
│   └── notifications/
│       └── src/
│           ├── types.ts                # NotificationItem + NotificationsAdapter
│           ├── index.windows.ts        # WinRT ToastNotification (NativeModules)
│           ├── index.macos.ts          # UNUserNotificationCenter (NativeModules)
│           ├── index.native.ts         # expo-notifications (iOS + Android)
│           ├── index.web.ts            # Web Notification API (+ Electron renderer)
│           └── index.ts               # fallback re-export
│
├── docs/
│   ├── ARCHITECTURE.md         # معماری کلی، state flow، sync strategy
│   ├── BUILD.md                # راهنمای build برای همه پلتفرم‌ها
│   └── FILE_STRUCTURE.md       # این فایل
│
├── package.json                # Turborepo workspace root
├── turbo.json                  # pipeline: build, type-check, lint, test
├── tsconfig.base.json          # shared TypeScript config
├── .gitignore
├── .prettierrc
└── README.md
```
