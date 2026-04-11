# DailyRoutine

شروع اولیه پروژه مطابق `Document.md` پیاده‌سازی شده است.

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 app.py
```

API روی `http://localhost:4000` در دسترس است.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

فرانت روی `http://localhost:3000` در دسترس است.

## Docker (اجرای یک‌دست)

```bash
docker compose up --build
```

- فرانت‌اند: `http://localhost:3000`
- بک‌اند: `http://localhost:4000`

برای تغییر API در build فرانت (اختیاری):

```bash
VITE_API_BASE_URL=http://localhost:4000/api docker compose up --build
```
