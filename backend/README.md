# Mina AI Backend

Backend foundation cho Mina AI dùng FastAPI, PostgreSQL, SQLAlchemy 2, Alembic, session cookie HttpOnly và content package MVP cho Toán phân số lớp 6.

## Yêu cầu

- Docker Desktop hoặc Docker Engine + Docker Compose
- Python 3.11

## Biến môi trường

Tạo file `backend/.env` từ `backend/.env.example`.

```powershell
cd backend
Copy-Item .env.example .env
```

Biến chính:

- `DATABASE_URL`: database development runtime, mặc định là `mina_dev`
- `TEST_DATABASE_URL`: database dành riêng cho pytest PostgreSQL, mặc định là `mina_test`
- `CORS_ORIGINS`: origin frontend development
- `DEV_STUDENT_*`, `DEV_TEACHER_*`: dữ liệu seed development

Lưu ý:

- Không commit `backend/.env`.
- `backend/.env` trong Docker Compose dùng host `postgres`.
- Nếu chạy backend trực tiếp trên host thay vì trong container, đổi host DB sang `localhost`.

## Khởi động PostgreSQL và backend

Từ thư mục gốc repository:

```powershell
docker compose build backend
docker compose up -d postgres backend
docker compose ps
docker compose logs postgres
docker compose logs backend
```

PostgreSQL dùng một service nhưng có hai database:

- `mina_dev`
- `mina_test`

## Migration

Chạy trong container backend:

```powershell
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
docker compose exec backend alembic heads
```

Kỳ vọng:

- `current` = `20260718_0007`
- chỉ có một `head`

## Seed development

Tạo development users:

```powershell
docker compose exec backend python -m app.cli.seed_dev_users --reset-password
```

Tạo dữ liệu core cho demo:

```powershell
docker compose exec backend python -m app.cli.seed_dev_core
```

Tạo content package phân số:

```powershell
docker compose exec backend python -m app.cli.seed_dev_content
docker compose exec backend python -m app.cli.validate_content
```

Quy tắc:

- Chỉ chạy khi `APP_ENV=development` hoặc `test`
- Không tự seed khi app startup
- Không in password ra log

## Reset development database

Lệnh reset explicit:

```powershell
docker compose exec backend python -m app.cli.reset_dev_database
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.cli.seed_dev_users --reset-password
docker compose exec backend python -m app.cli.seed_dev_core
docker compose exec backend python -m app.cli.seed_dev_content
docker compose exec backend python -m app.cli.validate_content
```

Guard an toàn:

- Chỉ chạy khi `APP_ENV=development`
- Chỉ chấp nhận database tên `mina_dev`
- Từ chối nếu `TEST_DATABASE_URL` trỏ cùng database development

## Pytest và test database

Pytest PostgreSQL luôn dùng `mina_test`.

Guard bắt buộc:

- `TEST_DATABASE_URL` phải tồn tại
- `TEST_DATABASE_URL` phải khác `DATABASE_URL`
- tên database test phải chứa `test`

Nếu sai, pytest sẽ fail với thông báo:

```text
Refusing to run PostgreSQL tests against the development database.
```

Chạy test:

```powershell
cd backend
.\.venv\Scripts\pytest
```

Lint:

```powershell
.\.venv\Scripts\ruff check .
.\.venv\Scripts\ruff format --check .
```

## Content package MVP

BE-004 chỉ seed một vertical slice:

- Package: `MATH6_FRACTIONS_FOUNDATION_V1`
- Tiêu đề: `Nền tảng phân số lớp 6`
- Môn: `math`
- Khối: `6`

Skill codes:

- `MATH6.MULTIPLES.COMMON_MULTIPLE`
- `MATH6.MULTIPLES.LCM`
- `MATH6.FRACTIONS.EQUIVALENT_FRACTION`
- `MATH6.FRACTIONS.COMMON_DENOMINATOR`
- `MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR`
- `MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR`
- `MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION`

Direction của prerequisite:

- `skill_id` cần `prerequisite_skill_id`

Package này chỉ là nội dung development để phục vụ deterministic diagnostic slice sau này. Đây không phải bản nội dung đã được phê duyệt chính thức. Giáo viên cần review trước khi rollout thật.

## Internal content APIs

Các endpoint đọc nội dung hiện có:

- `GET /api/v1/content/packages/{packageCode}`
- `GET /api/v1/content/packages/{packageCode}/skills`
- `GET /api/v1/content/skills/{skillCode}`

Các endpoint này hiện giới hạn cho teacher/internal verification.

Không endpoint nào trả `isCorrect` ra JSON.

## Auth hiện tại

- Username + password
- Argon2 để hash password
- Opaque session token
- PostgreSQL chỉ lưu `token_hash`
- Browser nhận cookie `HttpOnly`
- Frontend khôi phục phiên bằng `GET /api/v1/auth/me`

## Health check

```powershell
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/ready
```

## Frontend integration

Để frontend dùng backend thật:

```powershell
cd frontend
$env:VITE_API_BASE_URL="http://localhost:8000/api/v1"
$env:VITE_ENABLE_MSW="false"
npm run dev -- --host localhost
```

## CORS và cookie development

- `CORS_ORIGINS` lấy từ env
- `allow_credentials=true`
- Không dùng wildcard origin
- Dùng nhất quán `localhost`, không trộn với `127.0.0.1`
- `AUTH_COOKIE_SECURE=false` chỉ phù hợp development HTTP/LAN

## Cách thêm question mới an toàn

- Chỉ thêm qua seed data hoặc migration/seed script có kiểm soát
- Mỗi câu phải có ít nhất 2 options
- Mỗi câu phải có đúng 1 option `is_correct=true`
- Không chỉnh đáp án trực tiếp trên production DB
- Sau khi sửa dữ liệu, luôn chạy:

```powershell
docker compose exec backend python -m app.cli.validate_content
```

## Version package trong tương lai

- Tạo package code mới khi thay đổi lớn về cấu trúc hoặc nội dung
- Giữ `code` skill ổn định nếu muốn backend diagnostic tái sử dụng
- Không ghi đè tùy tiện content đang dùng cho rollout thật

## Backup và restore

Ví dụ backup development DB:

```powershell
docker compose exec postgres pg_dump -U mina_app -d mina_dev > mina_dev_backup.sql
```

Ví dụ restore development DB:

```powershell
docker compose exec -T postgres psql -U mina_app -d mina_dev < mina_dev_backup.sql
```

## Lỗi thường gặp

### `/api/v1/health/ready` trả `503`

- Kiểm tra `docker compose ps`
- Kiểm tra `docker compose logs postgres`
- Kiểm tra `DATABASE_URL`

### Login luôn `401`

- Chạy lại:

```powershell
docker compose exec backend python -m app.cli.seed_dev_users --reset-password
```

- Kiểm tra frontend đang dùng `credentials: include`

### Validation content fail

- Kiểm tra graph prerequisite có cycle không
- Kiểm tra mỗi question có đúng một đáp án đúng
- Kiểm tra assignment target đã được seed từ `seed_dev_core`

## Giới hạn hiện tại

- Chưa có diagnostic session
- Chưa có engine chấm attempt runtime
- Chưa có remediation UI
- Chưa có transfer UI
- Chưa có teacher analytics
- Chưa có rate limiting
- Chưa có HTTPS termination
- Chưa có password reset
- Chưa có MFA
- Chưa có audit log đầy đủ

Các mục này cần bổ sung ở các work package sau.
