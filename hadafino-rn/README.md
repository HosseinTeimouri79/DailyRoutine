# Hadafino — Cross-Platform Daily Routine Manager

یک کدبیس، شش پلتفرم.

## پلتفرم‌های پشتیبانی‌شده

| پلتفرم | تکنولوژی | خروجی |
|---|---|---|
| Android | Expo EAS Build | APK + AAB |
| iOS | Expo EAS Build | IPA |
| Web | Expo Web | Static bundle |
| Linux | Electron + Web bundle | AppImage, .deb, .rpm |
| Windows | React Native Windows 0.76 | MSIX |
| macOS | React Native macOS 0.76 | .app |

## ساختار

```
hadafino-rn/
├── apps/
│   ├── mobile/           # Expo Router — iOS + Android + Web
│   ├── desktop-linux/    # Electron shell
│   ├── desktop-windows/  # React Native Windows
│   └── desktop-macos/    # React Native macOS
└── packages/
    ├── core/             # API, DB, Sync, Types
    ├── theme/            # ThemeProvider + 6 تم
    ├── i18n/             # FA/EN + RTL
    ├── ui/               # کامپوننت‌های مشترک
    └── notifications/    # Adapter برای هر پلتفرم
```

## راه‌اندازی سریع

```bash
npm install
cp apps/mobile/.env.example apps/mobile/.env
# EXPO_PUBLIC_API_URL=http://localhost:4000/api را تنظیم کنید
```

## اجرا

```bash
# Mobile / Web
cd apps/mobile && npx expo start

# Linux Desktop
cd apps/desktop-linux && npm run dev

# Windows Desktop (نیاز به Visual Studio 2022)
cd apps/desktop-windows && npx react-native run-windows

# macOS Desktop (نیاز به Xcode 16+)
cd apps/desktop-macos && npx react-native run-macos
```

## Build

```bash
# Android + iOS
cd apps/mobile && eas build --platform all --profile production

# Web
cd apps/mobile && npx expo export --platform web

# Linux
cd apps/desktop-linux && npm run build
# → dist/*.AppImage, dist/*.deb, dist/*.rpm

# Windows
cd apps/desktop-windows && npx react-native run-windows --release
# → windows/AppPackages/**/*.msix

# macOS
cd apps/desktop-macos && npx react-native run-macos --configuration Release
# → macos/build/Release/hadafino.app
```

## داکیومنت‌ها

- [معماری](docs/ARCHITECTURE.md)
- [ساختار فایل‌ها](docs/FILE_STRUCTURE.md)
- [راهنمای Build](docs/BUILD.md)

## CI/CD

Push یک tag برای trigger کردن build همه پلتفرم‌ها:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

GitHub Release با artifacts لینوکس، ویندوز و مک‌اواس ساخته می‌شود.
