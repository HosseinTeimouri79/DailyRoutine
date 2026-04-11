# مستندات فنی کامل پروژه DailyRoutine

این سند، مرجع فنی نسخه MVP پروژه DailyRoutine بر اساس معماری جدید است.

## 1) نمای کلی سیستم

DailyRoutine یک سامانه Full-stack برای مدیریت عادت‌ها و ثبت وضعیت روزانه است.

- بک‌اند: Python + SQLite + JWT
- فرانت‌اند: React (Vite) + React Router + CSS Component-based
- الگوی احراز هویت: Bearer Token (JWT) در هدر Authorization

### قابلیت‌های اصلی

- ثبت‌نام و ورود کاربر
- تعریف روتین جدید
- ثبت/به‌روزرسانی وضعیت روزانه هر روتین (done/missed)
- نمایش داشبورد هفتگی
- نمایش تقویم ماهانه
- گزارش هفتگی و ماهانه

---

## 2) ساختار پیشنهادی پروژه

```text
DailyRoutine/
├─ backend/
│  ├─ app.py
│  ├─ Dockerfile
│  ├─ requirements.txt
│  ├─ .env.example
│  ├─ database/
│  │  └─ schema.sql
│  ├─ core/
│  │  ├─ db.py
│  │  ├─ auth.py
│  │  └─ date_utils.py
│  └─ routes/
│     ├─ auth.py
│     ├─ routines.py
│     ├─ logs.py
│     └─ reports.py
├─ frontend/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ nginx.conf
│  ├─ .env.example
│  ├─ index.html
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx
│     ├─ styles.css
│     ├─ lib/
│     │  ├─ api.js
│     │  └─ date.js
│     ├─ components/
│     │  ├─ layout/
│     │  │  └─ AppShell.jsx
│     │  └─ ui/
│     │     ├─ Button.jsx
│     │     ├─ Input.jsx
│     │     └─ Card.jsx
│     └─ pages/
│        ├─ LoginPage.jsx
│        ├─ DashboardPage.jsx
│        ├─ CalendarPage.jsx
│        └─ ReportsPage.jsx
├─ docker-compose.yml
└─ README.md
```

---

## 3) پیش‌نیازها

- Python 3.10 یا بالاتر
- SQLite 3 (معمولاً همراه Python موجود است)
- Node.js 20 یا بالاتر (برای Vite)
- Docker و Docker Compose (اختیاری برای اجرای یک‌دست)

---

## 4) راه‌اندازی محلی

## 4.1) بک‌اند

1. ورود به پوشه backend
2. ساخت virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

3. نصب وابستگی‌ها:

```bash
pip install -r requirements.txt
```

4. کپی فایل env:

```bash
cp .env.example .env
```

5. اجرای سرویس:

```bash
python app.py
```

6. (اختیاری) اجرای seed برای داده نمونه:

```bash
python seed.py
```

اطلاعات کاربر نمونه:

- email: demo@routin.app
- password: 123456

## 4.2) فرانت‌اند

1. ورود به پوشه frontend
2. نصب وابستگی‌ها:

```bash
npm install
```

3. اجرای توسعه:

```bash
npm run dev
```

4. build نسخه production:

```bash
npm run build
```

دسترسی نمونه (dev): http://localhost:3000

---

## 5) متغیرهای محیطی

## 5.1) backend/.env

- PORT: پورت سرویس بک‌اند (پیش‌فرض 4000)
- JWT_SECRET: کلید امضای JWT
- JWT_EXPIRES_DAYS: مدت اعتبار توکن (پیش‌فرض 7)
- DATABASE_PATH: مسیر فایل SQLite
- CORS_ORIGIN: دامنه مجاز فرانت

نمونه:

```dotenv
PORT=4000
JWT_SECRET=super-secret-change-me
JWT_EXPIRES_DAYS=7
DATABASE_PATH=./database/dailyroutine.db
CORS_ORIGIN=http://localhost:3000
```

## 5.2) frontend (React + Vite)

مقدار API Base URL از env خوانده می‌شود:

```dotenv
VITE_API_BASE_URL=http://localhost:4000/api
```

Fallback در کد:

```js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000/api`;
```

---

## 6) معماری بک‌اند (Python)

## 6.1) نقطه ورود

فایل app.py:

- بارگذاری env
- فعال‌سازی CORS
- اتصال routeها
- مسیر سلامت سیستم: GET /api/health
- مدیریت خطای سراسری با پاسخ JSON
- ایجاد خودکار schema در startup (در صورت نبود جداول)

## 6.2) اتصال دیتابیس (SQLite)

فایل core/db.py:

- ایجاد اتصال sqlite3
- تنظیم row_factory برای خروجی دیکشنری‌مانند
- تابع query/execute برای اجرای SQL
- تابع ensure_schema برای ایجاد جدول‌ها در اولین اجرا

## 6.3) احراز هویت (JWT)

فایل core/auth.py:

- تولید JWT با exp
- اعتبارسنجی JWT با JWT_SECRET
- استخراج Bearer Token از Authorization Header
- تزریق اطلاعات کاربر در request context
- خطاها:
  - 401 Unauthorized (نبود توکن)
  - 401 Invalid token (توکن نامعتبر/منقضی)

## 6.4) مسیرهای auth

فایل routes/auth.py:

- POST /api/auth/register
  - ورودی: name, email, password
  - هش رمز با bcrypt
  - جلوگیری از ایمیل تکراری
  - خروجی: token + user
- POST /api/auth/login
  - ورودی: email, password
  - بررسی اعتبار و صدور JWT
  - خروجی: token + user

## 6.5) مسیرهای routines

فایل routes/routines.py:

- GET /api/routines
  - لیست روتین‌های کاربر احرازشده
- POST /api/routines
  - ایجاد روتین جدید
  - فیلدهای ورودی: title, color (اختیاری), icon (اختیاری)
  - title الزامی

## 6.6) مسیرهای logs

فایل routes/logs.py:

- POST /api/routine-logs
  - ورودی: routine_id, date, status
  - status فقط done یا missed
  - بررسی مالکیت روتین
  - رفتار upsert برای (routine_id, date)
- GET /api/routine-logs
  - پارامترهای اختیاری: routineId, startDate, endDate
  - فقط لاگ‌های متعلق به کاربر جاری

## 6.7) مسیرهای reports

فایل routes/reports.py:

- GET /api/reports/monthly?month=YYYY-MM
- GET /api/reports/weekly

منطق آماری مشترک:

- routines: تعداد روتین‌های فعال
- done: تعداد done در بازه
- missed: تعداد missed در بازه
- remaining: اختلاف ظرفیت و مجموع done/missed

$$
capacity = routines \times totalDays
$$

$$
remaining = \max(capacity - (done + missed), 0)
$$

## 6.8) ابزار تاریخ

فایل core/date_utils.py:

- to_iso_date: تبدیل تاریخ به YYYY-MM-DD
- get_week_range: بازه هفته جاری
- parse_month_input: تبدیل ورودی YYYY-MM

---

## 7) مدل داده (SQLite Schema)

اسکیما در database/schema.sql تعریف می‌شود.

## 7.1) جدول users

- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- name (TEXT NOT NULL)
- email (TEXT UNIQUE NOT NULL)
- password (TEXT NOT NULL)
- created_at (TEXT)

## 7.2) جدول routines

- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- user_id (INTEGER NOT NULL)
- title (TEXT NOT NULL)
- color (TEXT)
- icon (TEXT)
- created_at (TEXT)
- is_active (INTEGER DEFAULT 1)
- UNIQUE(user_id, title)
- FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE

## 7.3) جدول routine_logs

- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- routine_id (INTEGER NOT NULL)
- date (TEXT NOT NULL)
- status (TEXT CHECK(status IN ('done','missed')))
- created_at (TEXT)
- UNIQUE(routine_id, date)
- FOREIGN KEY(routine_id) REFERENCES routines(id) ON DELETE CASCADE

## 7.4) جدول routine_schedules

- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- routine_id (INTEGER NOT NULL)
- days_of_week (TEXT) ← ذخیره به صورت JSON string
- FOREIGN KEY(routine_id) REFERENCES routines(id) ON DELETE CASCADE

نکته: در نسخه MVP این جدول می‌تواند غیرفعال یا حداقلی استفاده شود.

---

## 8) قرارداد API

Base URL:

- محلی: http://localhost:4000/api

هدر عمومی برای مسیرهای محافظت‌شده:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## 8.1) Auth

### POST /auth/register

Body:

```json
{
  "name": "Hossein",
  "email": "hossein@example.com",
  "password": "123456"
}
```

Response 201:

```json
{
  "token": "...",
  "user": {
    "id": 1,
    "name": "Hossein",
    "email": "hossein@example.com"
  }
}
```

### POST /auth/login

Body:

```json
{
  "email": "hossein@example.com",
  "password": "123456"
}
```

Response 200: مشابه register

## 8.2) Routines

### GET /routines

Response 200:

```json
[
  {
    "id": 3,
    "title": "مطالعه",
    "color": "yellow",
    "icon": null,
    "is_active": 1,
    "created_at": "2026-04-04T09:00:00Z"
  }
]
```

### POST /routines

Body:

```json
{
  "title": "ورزش",
  "color": "yellow",
  "icon": null
}
```

Response 201: شیء روتین ایجادشده

## 8.3) Routine Logs

### POST /routine-logs

Body:

```json
{
  "routine_id": 3,
  "date": "2026-04-04",
  "status": "done"
}
```

رفتار: اگر برای همان routine/date رکوردی باشد، status به‌روزرسانی می‌شود.

### GET /routine-logs

Query اختیاری:

- routineId
- startDate
- endDate

نمونه:

```http
GET /routine-logs?startDate=2026-04-01&endDate=2026-04-30
```

## 8.4) Reports

### GET /reports/monthly?month=2026-04

Response:

```json
{
  "routines": 3,
  "done": 21,
  "missed": 6,
  "remaining": 63
}
```

### GET /reports/weekly

Response: همان ساختار ماهانه برای بازه هفته جاری

## 8.5) کدهای خطای رایج

- 400: ورودی نامعتبر یا ناقص
- 401: عدم احراز هویت / توکن نامعتبر
- 404: روتین یافت نشد یا متعلق به کاربر نیست
- 409: ایمیل تکراری
- 500: خطای داخلی سرور

---

## 9) معماری فرانت‌اند (React + Vite)

## 9.1) لایه صفحه‌ها

- /login → login/register
- / → dashboard
- /calendar → calendar
- /reports → reports

## 9.2) لایه API Client

فایل src/lib/api.js:

- نگهداری token در localStorage
- الصاق خودکار هدر Authorization
- مدیریت پاسخ خطا و throw کردن پیام مناسب

توابع اصلی:

- register
- login
- getRoutines
- createRoutine
- updateRoutine
- deleteRoutine
- upsertLog
- getLogs
- getMonthlyReport
- getWeeklyReport

## 9.3) مدیریت تاریخ در فرانت

فایل src/lib/date.js:

- getCurrentMonthISO
- getMonthDaysGregorian
- formatPersianDateParts
- formatPersianMonthYear

الزام تقویم:

- تقویم نمایش داده‌شده در UI باید فارسی (شمسی/Jalali) باشد.
- نمایش نام ماه‌ها و روزها باید فارسی و سازگار با RTL باشد.

## 9.4) معماری UI

- استفاده از Component-based architecture
- تقسیم به layout/ui/page components
- مدیریت state با React hooks
- مسیریابی با React Router

## 9.5) استایل

- استایل اختصاصی در src/styles.css
- طراحی کارت‌محور با دکمه/ورودی قابل‌استفاده مجدد
- پشتیبانی RTL در سطح کل برنامه

---

## 10) جریان داده (End-to-End)

1. کاربر در مسیر /login ثبت‌نام/ورود می‌کند.
2. JWT در localStorage ذخیره می‌شود.
3. صفحات /، /calendar و /reports درخواست API را با Bearer Token می‌فرستند.
4. middleware بک‌اند JWT را اعتبارسنجی کرده و user context را آماده می‌کند.
5. routeها داده مختص همان کاربر را از SQLite می‌خوانند/می‌نویسند.
6. UI با state جدید در React دوباره render می‌شود.

---

## 11) امنیت و ملاحظات

وضعیت فعلی:

- هش رمز عبور با bcrypt
- محافظت routeهای اصلی با JWT
- بررسی مالکیت روتین در ثبت لاگ

پیشنهاد نسخه Production:

- انتقال توکن از localStorage به HttpOnly Cookie
- Rate Limiting روی مسیرهای auth
- اعتبارسنجی ساختاری ورودی با Pydantic/Marshmallow
- CORS محدود به دامنه‌های مشخص
- چرخش دوره‌ای JWT secret
- ثبت لاگ امنیتی و مانیتورینگ خطا

---

## 12) استقرار (Deployment)

## 12.1) بک‌اند

- تنظیم envهای Production
- اجرای سرویس با Gunicorn/Uvicorn (بسته به فریم‌ورک انتخابی)
- قرار دادن پشت reverse proxy (Nginx)
- بکاپ منظم فایل SQLite یا مهاجرت به PostgreSQL در مقیاس بالا

## 12.2) فرانت‌اند

- build با Vite (خروجی dist)
- سرو خروجی static با Nginx (SPA fallback)
- تنظیم VITE_API_BASE_URL برای اتصال به دامنه بک‌اند

## 12.3) Docker Compose

- اجرای یک‌دست سرویس‌ها با `docker compose up --build`
- backend روی پورت 4000
- frontend روی پورت 3000
- دیتابیس SQLite با volume پایدار `dailyroutine_data`

---

## 13) محدودیت‌های فعلی MVP

- نبود pagination/فیلتر پیشرفته
- جدول routine_schedules عملیاتی کامل ندارد
- نبود تست خودکار (unit/integration/e2e)

---

## 14) پیشنهاد Roadmap فنی

1. افزودن تست‌ها (pytest برای API، Playwright برای UI)
2. جداسازی لایه Service/Repository در بک‌اند
3. افزودن migration رسمی (Alembic)
4. بهبود تقویم (Virtualized جدول، فیلتر وضعیت، UX ثبت سریع)
5. ارتقای امنیت سشن و مانیتورینگ production

---

## 15) عیب‌یابی رایج

## 15.1) خطای دیتابیس SQLite

- مسیر DATABASE_PATH را بررسی کنید.
- مجوز نوشتن فایل DB را بررسی کنید.

## 15.2) خطای 401 در مسیرهای محافظت‌شده

- وجود token در localStorage را بررسی کنید.
- اعتبار زمانی JWT را چک کنید.
- login مجدد انجام دهید.

## 15.3) خطای CORS در فرانت

- مقدار CORS_ORIGIN در بک‌اند
- مقدار API_BASE_URL در فرانت

## 15.4) خطای build فرانت (Vite)

- اجرای `npm install` و سپس `npm run build`
- بررسی مقدار `VITE_API_BASE_URL`

---

## 16) فایل‌های مرجع کلیدی (معماری جدید)

- backend/app.py
- backend/core/db.py
- backend/core/auth.py
- backend/core/date_utils.py
- backend/routes/auth.py
- backend/routes/routines.py
- backend/routes/logs.py
- backend/routes/reports.py
- backend/database/schema.sql
- frontend/Dockerfile
- frontend/nginx.conf
- frontend/src/lib/api.js
- frontend/src/lib/date.js
- frontend/src/components/layout/AppShell.jsx
- frontend/src/components/ui/Button.jsx
- frontend/src/components/ui/Input.jsx
- frontend/src/components/ui/Card.jsx
- frontend/src/pages/LoginPage.jsx
- frontend/src/pages/DashboardPage.jsx
- frontend/src/pages/CalendarPage.jsx
- frontend/src/pages/ReportsPage.jsx
- frontend/index.html
- frontend/src/App.jsx
- frontend/src/main.jsx
- docker-compose.yml

این مستند بر اساس استک جدید (Python + SQLite + JWT و React + Vite) بازنویسی شده است و باید همراه تغییرات API یا مدل داده به‌روزرسانی شود.
