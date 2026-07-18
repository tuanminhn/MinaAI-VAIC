# Mina AI Backend

Backend tối giản cho Mina AI dùng FastAPI, PostgreSQL, SQLAlchemy 2, Alembic và auth theo cookie session HttpOnly.

## Yêu cầu

- Docker Desktop hoặc Docker Engine + Docker Compose
- Python 3.11

## 1. Chuẩn bị môi trường

```bash
cd backend
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Lưu ý:

- Không commit `backend/.env`.
- `DATABASE_URL` phải trỏ tới PostgreSQL thật.
- `APP_ENV=production` sẽ chặn lệnh seed development users.

## 2. Khởi động PostgreSQL và backend bằng Docker Compose

Từ thư mục gốc repository:

```bash
docker compose build backend
docker compose up -d postgres backend
docker compose ps
docker compose logs postgres
docker compose logs backend
```

## 3. Cài dependency để chạy trên host

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
```

## 4. Chạy migration

```bash
alembic upgrade head
alembic current
alembic heads
```

Kỳ vọng:

- `current` = `20260718_0002`
- chỉ có một `head`

## 5. Tạo development users một cách explicit

```bash
python -m app.cli.seed_dev_users --reset-password
```

Quy tắc:

- Chỉ chạy khi `APP_ENV=development` hoặc `test`
- Không tự seed khi app startup
- Credentials lấy từ `backend/.env`
- Không in password ra log

## 6. Chạy backend trên host

```bash
uvicorn app.main:app --reload
```

## 7. Health check

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/ready
```

## 8. Kiểm tra auth thật

Các endpoint hiện có:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

Kiến trúc auth:

- Username + password
- Argon2 để hash password
- Opaque session token sinh bằng `secrets`
- PostgreSQL chỉ lưu `token_hash` SHA-256
- Browser nhận cookie `HttpOnly`
- Frontend khôi phục phiên bằng `/auth/me`

## 9. Chạy test

Unit và integration nhẹ:

```bash
pytest -m "not postgres"
```

PostgreSQL integration:

```bash
pytest -m "integration and postgres"
```

Toàn bộ test:

```bash
pytest
```

Lint/format:

```bash
ruff check .
ruff format --check .
```

## 10. CORS và cookie development

- `CORS_ORIGINS` lấy từ env, mặc định là `http://localhost:5173`
- `allow_credentials=true`
- Không dùng wildcard origin
- Trong development nên dùng nhất quán `localhost` hoặc `127.0.0.1`, không trộn lẫn tùy tiện
- `AUTH_COOKIE_SECURE=false` chỉ phù hợp HTTP local/LAN development

## 11. Frontend integration

Để frontend dùng backend thật:

```bash
cd frontend
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

## 12. Cleanup session cũ

```bash
python -m app.cli.cleanup_sessions
```

Lệnh này xóa session đã hết hạn hoặc đã bị revoke. Chưa có background worker trong MVP.

## 13. Reset database development

```bash
docker compose down
docker volume rm minaai-vaic_mina_postgres_data
docker compose up -d postgres backend
```

Sau đó chạy lại:

```bash
cd backend
alembic upgrade head
python -m app.cli.seed_dev_users --reset-password
```

## 14. Backup và restore foundation

Ví dụ backup:

```bash
docker compose exec postgres pg_dump -U mina_app -d mina_ai > mina_ai_backup.sql
```

Ví dụ restore:

```bash
docker compose exec -T postgres psql -U mina_app -d mina_ai < mina_ai_backup.sql
```

## 15. Lỗi thường gặp

### `alembic` báo thiếu biến môi trường

- Kiểm tra `backend/.env`
- Đảm bảo đang chạy lệnh từ thư mục `backend`

### `/api/v1/health/ready` trả `503`

- Kiểm tra `docker compose ps`
- Kiểm tra `docker compose logs postgres`
- Kiểm tra `DATABASE_URL`

### Login luôn `401`

- Chạy lại seed:

```bash
python -m app.cli.seed_dev_users --reset-password
```

- Kiểm tra frontend đang dùng `credentials: include`

## 16. Giới hạn bảo mật hiện tại

- Chưa có rate limiting
- Chưa có HTTPS termination
- Chưa có password reset
- Chưa có MFA
- Chưa có audit log đầy đủ

Các mục trên cần bổ sung trước khi rollout rộng hơn ngoài LAN nội bộ của trường.
