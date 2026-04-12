# Hadafino

اپلیکیشن مدیریت روتین روزانه با بک‌اند Flask و فرانت‌اند React (Vite).

## پیش‌نیازها

- Python 3.12+
- Node.js 20+
- Docker + Docker Compose (اختیاری)

## اجرای لوکال

### 1) Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 app.py
```

- API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend dev server: `http://localhost:3000`

## اجرای Docker

از ریشه پروژه:

```bash
docker compose up --build
```

برای Pull اولیه ایمیج‌ها (اختیاری ولی پیشنهادی):

```bash
sudo docker pull python:3.12-slim
sudo docker pull node:20-alpine
sudo docker pull nginx:1.27-alpine
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

برای تغییر API در build فرانت (اختیاری):

```bash
VITE_API_BASE_URL=http://localhost:4000/api docker compose up --build
```

برای توقف سرویس‌ها:

```bash
docker compose down
```
