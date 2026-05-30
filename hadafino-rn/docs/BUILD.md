# Hadafino — Build Guide

## Prerequisites

| Tool | Version | Required for |
|---|---|---|
| Node.js | 20+ | All |
| npm | 10+ | All |
| Expo CLI | latest | Mobile + Web |
| EAS CLI | latest | Mobile builds |
| Xcode | 16+ | iOS + macOS |
| Android Studio | latest | Android |
| Visual Studio 2022 | 17.x | Windows (with "Desktop development with C++" + "Universal Windows Platform") |
| Electron | bundled | Linux |

---

## 1. Setup

```bash
git clone <repo>
cd hadafino-rn
npm install          # installs all workspace packages
cp apps/mobile/.env.example apps/mobile/.env
# edit .env: set EXPO_PUBLIC_API_URL
```

---

## 2. Development

### Mobile (iOS / Android / Web)

```bash
cd apps/mobile
npx expo start           # opens Expo Go / dev client
npx expo start --ios     # iOS simulator
npx expo start --android # Android emulator
npx expo start --web     # browser at http://localhost:8081
```

### Linux Desktop (Electron)

```bash
# Terminal 1 — start web dev server
cd apps/mobile && npx expo start --web --port 8081

# Terminal 2 — start Electron
cd apps/desktop-linux && npm run dev
```

### Windows Desktop

```bash
cd apps/desktop-windows
npx react-native start          # Metro bundler
npx react-native run-windows    # opens Windows app
```

> Requires Visual Studio 2022 with "Universal Windows Platform development" workload.

### macOS Desktop

```bash
cd apps/desktop-macos
npx react-native start          # Metro bundler
npx react-native run-macos      # opens macOS app
```

> Requires Xcode 16+ and CocoaPods (`sudo gem install cocoapods`).

---

## 3. Production Builds

### Android

```bash
cd apps/mobile
eas build --platform android --profile production
# Output: .aab (Play Store) + .apk (sideload)
```

### iOS

```bash
cd apps/mobile
eas build --platform ios --profile production
# Output: .ipa
```

### Web

```bash
cd apps/mobile
npx expo export --platform web --output-dir ../../web-dist
# Output: web-dist/ (static files, deploy to any CDN)
```

### Linux Desktop

```bash
# Step 1: build web bundle
cd apps/mobile
npx expo export --platform web --output-dir ../desktop-linux/web-build

# Step 2: build Electron packages
cd ../desktop-linux
npm run build
# Output: dist/Hadafino-*.AppImage, dist/hadafino_*.deb, dist/hadafino-*.rpm
```

### Windows Desktop

```bash
cd apps/desktop-windows
npx react-native run-windows --release --no-launch
# Output: windows/AppPackages/**/*.msix
```

To sign the MSIX for distribution, configure a code signing certificate in `windows/hadafino/Package.appxmanifest`.

### macOS Desktop

```bash
cd apps/desktop-macos
npx react-native run-macos --configuration Release
# Output: macos/build/Release/hadafino.app

# To create a distributable DMG:
cd macos && xcodebuild -workspace hadafino.xcworkspace \
  -scheme hadafino -configuration Release \
  -archivePath build/hadafino.xcarchive archive
```

---

## 4. CI/CD (GitHub Actions)

### Automatic (on tag push)

```bash
git tag v1.0.0
git push origin v1.0.0
# Triggers: Android (EAS), iOS (EAS), Web, Linux, Windows, macOS builds
# Creates GitHub Release with Linux + Windows + macOS artifacts attached
```

### Manual (workflow_dispatch)

Go to **Actions → Build & Release → Run workflow**, select platform.

### Required Secrets

| Secret | Used by |
|---|---|
| `EXPO_TOKEN` | EAS Build (Android + iOS) |
| `API_URL` | Web + Linux builds |
| `GITHUB_TOKEN` | Auto-provided by GitHub |
| `APPLE_ID` | macOS notarization (optional) |
| `WINDOWS_CERT_PASSWORD` | Windows code signing (optional) |

---

## 5. Environment Variables

| Variable | App | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | mobile | Flask backend URL |
| `HADAFINO_API_URL` | windows, macos | Flask backend URL (process.env) |

---

## 6. Turborepo Commands

```bash
# Run all type checks
npx turbo run type-check

# Run all linters
npx turbo run lint

# Run all tests
npx turbo run test

# Build all packages
npx turbo run build
```
