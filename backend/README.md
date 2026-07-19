# Mina AI Backend

Tài liệu chi tiết cho runtime chính nằm ở [README gốc](../README.md), [docs/source-code.md](../docs/source-code.md) và [docs/architecture.md](../docs/architecture.md).

## Mục đích

`backend/` là REST API của Mina AI, dùng FastAPI, SQLAlchemy 2, Alembic và PostgreSQL. Backend chịu trách nhiệm:

- Authentication bằng opaque session và cookie `HttpOnly`.
- Trả dữ liệu cho luồng học sinh và giáo viên.
- Điều khiển deterministic diagnostic engine.
- Điều phối remediation, transfer check và teacher evidence.
- Seed và validate content package development.

## Chạy nhanh

```powershell
cd backend
Copy-Item .env.example .env
cd ..
docker compose up -d postgres backend
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.cli.seed_dev_users --reset-password
docker compose exec backend python -m app.cli.seed_dev_core
docker compose exec backend python -m app.cli.seed_dev_content
docker compose exec backend python -m app.cli.validate_content
```

API mặc định:

```text
http://localhost:8000/api/v1
```

## Kiểm tra nhanh

```powershell
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/ready
```

## Test và lint

```powershell
cd backend
.\.venv\Scripts\ruff check .
.\.venv\Scripts\ruff format --check .
.\.venv\Scripts\pytest
```

## Lưu ý

- Không commit `backend/.env`.
- Test PostgreSQL dùng `mina_test`.
- Development runtime dùng `mina_dev`.
- Không sửa migration cũ đã merge; tạo revision mới khi schema thay đổi.
