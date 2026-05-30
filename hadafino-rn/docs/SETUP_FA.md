# راهنمای اجرا و بیلد پروژه Hadafino

این راهنما برای اجرای پروژه روی سیستم لینوکس نوشته شده.

---

## ۱. پیش‌نیازها

قبل از هر چیز مطمئن شو این ابزارها نصب هستن:

### Node.js و npm

```bash
node --version   # باید 20+ باشه
npm --version    # باید 10+ باشه
```

اگه نصب نیست:

```bash
# با nvm (توصیه‌شده)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### Expo CLI و EAS CLI

```bash
npm install -g expo-cli eas-cli
```

### Android Studio (برای اجرا روی اندروید)

از سایت [developer.android.com](https://developer.android.com/studio) دانلود کن.

بعد از نصب، متغیرهای محیطی رو به `~/.bashrc` یا `~/.zshrc` اضافه کن:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## ۲. راه‌اندازی اولیه

```bash
# کلون پروژه
git clone <آدرس-ریپو>
cd hadafino-rn

# نصب همه وابستگی‌ها (workspace)
npm install

# ساخت فایل env
cp apps/mobile/.env.example apps/mobile/.env
```

فایل `apps/mobile/.env` رو باز کن و آدرس API رو تنظیم کن:

```
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

---

## ۳. اجرا در حالت توسعه

### موبایل — اندروید

```bash
cd apps/mobile
npx expo start --android
```

> اگه امولاتور اندروید باز باشه، اپ روش اجرا می‌شه. اگه نه، از Android Studio یه امولاتور راه‌اندازی کن.

### موبایل — وب (مرورگر)

```bash
cd apps/mobile
npx expo start --web
# اپ روی http://localhost:8081 باز می‌شه
```

### دسکتاپ لینوکس (Electron)

این یه ترمینال جداگانه می‌خواد:

```bash
# ترمینال ۱ — سرور وب
cd apps/mobile
npx expo start --web --port 8081

# ترمینال ۲ — اجرای Electron
cd apps/desktop-linux
npm run dev
```

---

## ۴. بیلد برای انتشار

### وب (خروجی استاتیک)

```bash
cd apps/mobile
npx expo export --platform web --output-dir ../../web-dist
# خروجی: پوشه web-dist/ — قابل آپلود روی هر CDN
```

### اندروید — APK / AAB

برای بیلد اندروید باید حساب Expo داشته باشی:

```bash
eas login   # یه بار لازمه

cd apps/mobile
eas build --platform android --profile production
# خروجی: فایل .aab برای Play Store و .apk برای نصب مستقیم
```

برای بیلد محلی (بدون سرور EAS):

```bash
cd apps/mobile
eas build --platform android --profile production --local
# نیاز به Android Studio و Java 17 داره
```

### دسکتاپ لینوکس — AppImage / deb / rpm

```bash
# مرحله ۱: بیلد وب
cd apps/mobile
npx expo export --platform web --output-dir ../desktop-linux/web-build

# مرحله ۲: بیلد Electron
cd ../desktop-linux
npm run build
# خروجی در پوشه dist/:
#   Hadafino-*.AppImage
#   hadafino_*.deb
#   hadafino-*.rpm
```

---

## ۵. دستورات کاربردی Turborepo

از ریشه پروژه:

```bash
# بررسی تایپ‌اسکریپت همه پکیج‌ها
npx turbo run type-check

# لینت همه پکیج‌ها
npx turbo run lint

# تست همه پکیج‌ها
npx turbo run test

# پاک‌سازی کامل
npm run clean
npm install   # بعد از clean دوباره نصب کن
```

---

## ۶. مشکلات رایج

### خطای `ENOENT` یا ماژول پیدا نشد

```bash
# از ریشه پروژه
npm install
```

### پورت 8081 اشغاله

```bash
npx kill-port 8081
# یا
lsof -ti:8081 | xargs kill -9
```

### Expo cache خراب شده

```bash
cd apps/mobile
npx expo start --clear
```

### مشکل با node_modules بعد از تغییر branch

```bash
npm run clean
npm install
```

---

## ۷. ساختار مختصر پروژه

```
hadafino-rn/
├── apps/
│   ├── mobile/          ← Expo — iOS، Android، Web
│   ├── desktop-linux/   ← Electron shell
│   ├── desktop-windows/ ← React Native Windows
│   └── desktop-macos/   ← React Native macOS
└── packages/
    ├── core/            ← منطق اصلی، API، DB
    ├── theme/           ← تم‌ها
    ├── i18n/            ← ترجمه FA/EN
    ├── ui/              ← کامپوننت‌های مشترک
    └── notifications/   ← نوتیفیکیشن
```

---

برای اطلاعات بیشتر فایل‌های زیر رو ببین:
- [BUILD.md](BUILD.md) — راهنمای کامل بیلد به انگلیسی
- [ARCHITECTURE.md](ARCHITECTURE.md) — معماری پروژه
