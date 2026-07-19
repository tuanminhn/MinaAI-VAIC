# Mina AI

Mina AI là nền tảng hỗ trợ phát hiện kiến thức nền cần củng cố thông qua bài kiểm tra thích ứng theo cây kỹ năng.

## Bài toán

Trong quá trình học, học sinh có thể làm sai một kiến thức hiện tại vì còn thiếu một kỹ năng nền ở bước trước. Giáo viên thường nhìn thấy kết quả sai, nhưng khó lần theo toàn bộ chuỗi prerequisite để xác định chính xác phần cần củng cố.

Mina AI lưu lại bằng chứng học tập theo từng pha, truy ngược skill graph trong content package hiện tại và trả về root-cause skill để giáo viên có cơ sở theo dõi.

## Luồng sản phẩm hiện tại

```text
Học sinh đăng nhập
-> xem bài được giao
-> bắt đầu hoặc tiếp tục diagnostic session
-> làm diagnostic
-> hệ thống truy ngược prerequisite
-> xác định kỹ năng cần củng cố hoặc kết luận đã đạt
-> học remediation
-> làm transfer check
-> xem kết quả
-> giáo viên xem bằng chứng và timeline
```

## Tính năng đã triển khai

### Học sinh

- Đăng nhập bằng session cookie.
- Xem bài được giao.
- Bắt đầu hoặc tiếp tục diagnostic session.
- Làm câu hỏi diagnostic.
- Thực hiện remediation.
- Làm transfer check.
- Xem kết quả.

### Giáo viên

- Xem lớp phụ trách.
- Xem assignment theo lớp.
- Xem trạng thái học sinh theo assignment.
- Xem root-cause skill theo learning session.
- Xem timeline chuyển trạng thái và attempt evidence.

### Nền tảng

- PostgreSQL.
- Alembic migrations.
- Content package.
- Skill prerequisite graph.
- Deterministic diagnostic engine.
- Docker cho backend và PostgreSQL.
- Backend và frontend test suites.

## Phạm vi hiện tại

- Content hiện tập trung vào một vertical slice Toán phân số lớp 6.
- Chưa phải toàn bộ chương trình học.
- Knowledge Base đa lớp chưa được tích hợp vào runtime hiện tại.
- AI gateway và AI observability chưa thuộc active runtime.
- Frontend hiện chạy qua Vite.
- Frontend chưa được đóng gói trong Docker hoặc Nginx.

## Công nghệ

### Backend

- Python
- FastAPI
- SQLAlchemy 2
- Alembic
- PostgreSQL
- Pydantic
- Argon2
- Pytest
- Ruff

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zod
- Vitest
- Testing Library
- MSW cho test

### Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16

## Cấu trúc repository

```text
backend/
frontend/
docs/
docker-compose.yml
```

Một prototype cũ có thể còn tồn tại trong repository để tham khảo. Prototype này không thuộc runtime FastAPI/Vite hiện tại.

## Hướng dẫn chạy

### Yêu cầu

- Docker
- Docker Compose
- Python `>=3.11,<3.13`
- Node.js `>=20.12.0`
- npm `>=10`

### Environment

Sao chép file mẫu cho backend:

```powershell
cd backend
Copy-Item .env.example .env
```

`backend/.env` chứa cấu hình development, bao gồm `DATABASE_URL`, `TEST_DATABASE_URL`, `CORS_ORIGINS` và credential development.

### Backend và PostgreSQL

Từ thư mục gốc của repository:

```powershell
docker compose up -d postgres backend
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.cli.seed_dev_users --reset-password
docker compose exec backend python -m app.cli.seed_dev_core
docker compose exec backend python -m app.cli.seed_dev_content
docker compose exec backend python -m app.cli.validate_content
```

URL backend mặc định:

```text
http://localhost:8000/api/v1
```

Health check:

```powershell
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/ready
```

### Frontend

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL="http://localhost:8000/api/v1"
$env:VITE_ENABLE_MSW="false"
npm run dev
```

URL frontend mặc định:

```text
http://localhost:5173
```

Nếu muốn chạy frontend với mock trong development:

```powershell
cd frontend
$env:VITE_ENABLE_MSW="true"
npm run dev
```

### Tài khoản development

Credential development được lấy từ `backend/.env`. Không lưu credential thật trong tài liệu hoặc source code.

## Test và build

### Backend

```powershell
cd backend
.\.venv\Scripts\ruff check .
.\.venv\Scripts\ruff format --check .
.\.venv\Scripts\pytest
```

### Frontend

```powershell
cd frontend
npm run typecheck
npm run lint
npm run test:run
npm run build
```

## Trạng thái dự án

| Module | Trạng thái |
| --- | --- |
| Authentication | Đã triển khai |
| Student learning flow | Đã triển khai |
| Deterministic diagnosis | Đã triển khai |
| Remediation và transfer | Đã triển khai |
| Teacher evidence | Đã triển khai |
| Teacher groups | Định hướng phát triển |
| Teacher interventions | Định hướng phát triển |
| Student detail page phía giáo viên | Đang hoàn thiện |
| Knowledge Base đa lớp | Định hướng phát triển |
| AI question generation | Định hướng phát triển |
| AI observability | Định hướng phát triển |
| LAN frontend deployment | Đang hoàn thiện |

## Tài liệu chính

- [Tổng quan mã nguồn](docs/source-code.md)
- [Kiến trúc hệ thống](docs/architecture.md)
- [AI Logs và hook dự kiến](docs/ai-logs.md)
