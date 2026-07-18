# Mina AI

Mina AI là web app học thích ứng cho học sinh THCS và giáo viên Toán, tối ưu cho môi trường trường học, mạng LAN nội bộ và thiết bị cấu hình phổ thông.

## Thành phần hiện có

- `frontend/`: React + Vite + TypeScript
- `backend/`: FastAPI + PostgreSQL + Alembic
- `docker-compose.yml`: PostgreSQL + backend container cho development

## Quick start

### 1. Backend

```bash
docker compose build backend
docker compose up -d postgres backend

cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
alembic upgrade head
python -m app.cli.seed_dev_users --reset-password
```

### 2. Frontend với backend thật

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENABLE_MSW=false
npm run dev
```

PowerShell:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8000/api/v1"
$env:VITE_ENABLE_MSW="false"
npm run dev
```

## Development mode với MSW

Nếu chỉ muốn phát triển frontend độc lập:

```bash
cd frontend
VITE_ENABLE_MSW=true
npm run dev
```

## Health check

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/ready
```

## Test commands

### Frontend

```bash
cd frontend
npm run typecheck
npm run lint
npm run test:run
npm run build
```

### Backend

```bash
cd backend
ruff check .
ruff format --check .
pytest -m "not postgres"
pytest -m "integration and postgres"
pytest
```

## Auth hiện tại

- Backend xác thực username/password với Argon2
- Session dùng cookie `HttpOnly`
- PostgreSQL chỉ lưu `token_hash`, không lưu raw token
- Frontend gọi `/api/v1/auth/me` để khôi phục phiên
- Frontend không lưu token trong `localStorage`

## Lưu ý development

- Không commit `backend/.env`
- Không commit `frontend/dist` hoặc `frontend/node_modules`
- Trong development, tránh trộn `localhost` và `127.0.0.1` khi test cookie/CORS
- Trước rollout rộng hơn cần bổ sung HTTPS, rate limiting và các hardening security khác
