# Mina AI

Mina AI là nền tảng web học thích ứng dành cho học sinh THCS và giáo viên Toán trong môi trường trường học Việt Nam. Dự án được thiết kế ưu tiên chạy ổn định trong mạng LAN nội bộ, phần cứng phổ thông, dễ cài đặt bằng Docker Compose, và đủ rõ ràng để nhà trường có thể vận hành thử nghiệm mà không phụ thuộc dịch vụ cloud.

## Mục tiêu giải quyết

Mina AI tập trung vào một bài toán rất cụ thể:

- Giúp học sinh biết mình cần làm gì tiếp theo trong bài học.
- Xác định lỗ hổng kiến thức nền theo cách deterministic, không dùng AI để chấm hay suy luận runtime.
- Điều hướng học sinh qua chu trình:
  `được giao bài -> diagnostic -> remediation -> transfer -> result`
- Giúp giáo viên xem bằng chứng học tập thật:
  trạng thái phiên học, root cause chính, timeline chuyển trạng thái, và attempt evidence theo từng phase.

Phiên bản hiện tại mới triển khai một vertical slice MVP cho Toán phân số lớp 6.

## Tính năng chính hiện có

### 1. Xác thực thật bằng backend

- Đăng nhập bằng `username + password`
- Password hash bằng Argon2
- Session dùng cookie `HttpOnly`
- PostgreSQL chỉ lưu `token_hash`, không lưu raw token
- Frontend dùng `credentials: "include"` và khôi phục phiên bằng `GET /api/v1/auth/me`

### 2. Student learning loop hoàn chỉnh cho MVP

- Student home và assignments dùng backend thật
- Bắt đầu hoặc tiếp tục diagnostic session thật
- Diagnostic engine deterministic, không dùng AI
- Xác định `root cause` chính theo skill graph và luật explicit
- Remediation flow thật
- Transfer check thật
- Result page thật với 3 outcome:
  - `mastered_without_remediation`
  - `mastered_after_remediation`
  - `needs_teacher_support`

### 3. Teacher evidence và analytics tối thiểu

- Xem danh sách lớp giáo viên phụ trách
- Xem assignment theo lớp
- Xem overview theo assignment:
  - chưa bắt đầu
  - đang diagnostic
  - đang remediation
  - hoàn thành
  - cần hỗ trợ thêm
- Xem root-cause groups
- Xem danh sách học sinh theo assignment
- Xem learning evidence của từng session:
  timeline, attempts theo phase, outcome, root cause

### 4. Content package MVP

Hiện hệ thống mới seed một gói nội dung development:

- Package: `MATH6_FRACTIONS_FOUNDATION_V1`
- Môn: `math`
- Khối: `6`
- Cụm kiến thức:
  - bội chung
  - BCNN
  - phân số bằng nhau
  - quy đồng mẫu số
  - trừ hai phân số
  - phương trình phân số đơn giản

### 5. Nền tảng kỹ thuật ổn định cho phát triển tiếp

- FastAPI + PostgreSQL + Alembic
- React + Vite + TypeScript strict
- MSW cho isolated frontend tests
- Dev DB và test DB tách biệt:
  - `mina_dev`
  - `mina_test`

## Công nghệ sử dụng

### Frontend

- React
- Vite
- TypeScript
- React Router
- Tailwind CSS
- shadcn-style UI primitives
- TanStack Query
- React Hook Form
- Zod
- Lucide React
- MSW
- Vitest
- React Testing Library

### Backend

- Python 3.11
- FastAPI
- Uvicorn
- SQLAlchemy 2
- Alembic
- PostgreSQL
- Psycopg 3
- Pydantic Settings
- Ruff
- Pytest

### Hạ tầng local/development

- Docker Compose
- PostgreSQL volume cho dữ liệu local

## Cấu trúc dự án

```text
MinaAI-VAIC/
  backend/
  frontend/
  docker-compose.yml
  README.md
```

## Yêu cầu môi trường

### Bắt buộc

- Docker Desktop hoặc Docker Engine + Docker Compose
- Node.js `>= 20`
- npm `>= 10`
- Python `3.11`

### Lưu ý

- Dùng nhất quán `localhost`
- Không trộn `localhost` và `127.0.0.1` khi test cookie/CORS
- Không commit `backend/.env`

## Hướng dẫn cài đặt

### 1. Tạo file môi trường backend

Từ thư mục `backend/`:

```powershell
cd backend
Copy-Item .env.example .env
```

Sau đó kiểm tra các biến chính trong `backend/.env`:

```env
APP_ENV=development
DATABASE_URL=postgresql+psycopg://mina_app:mina_dev_password@postgres:5432/mina_dev
TEST_DATABASE_URL=postgresql+psycopg://mina_app:mina_dev_password@postgres:5432/mina_test
API_V1_PREFIX=/api/v1
CORS_ORIGINS=http://localhost:5173
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax
```

### 2. Cài dependency frontend

```powershell
cd ..\frontend
npm install
```

### 3. Cài dependency backend local

```powershell
cd ..\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -e .[dev]
```

## Hướng dẫn chạy dự án

## Cách 1: Chạy đầy đủ với Docker backend + frontend local

Đây là cách phù hợp nhất cho development hiện tại.

### Bước 1. Build và khởi động PostgreSQL + backend

Từ thư mục gốc dự án:

```powershell
docker compose build --no-cache backend
docker compose up -d --force-recreate postgres backend
docker compose ps
```

### Bước 2. Chạy migration

```powershell
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
docker compose exec backend alembic heads
```

Kỳ vọng hiện tại:

```text
20260718_0006 (head)
```

### Bước 3. Seed dữ liệu development

```powershell
docker compose exec backend python -m app.cli.seed_dev_users --reset-password
docker compose exec backend python -m app.cli.seed_dev_core
docker compose exec backend python -m app.cli.seed_dev_content
docker compose exec backend python -m app.cli.validate_content --package-code MATH6_FRACTIONS_FOUNDATION_V1
```

### Bước 4. Chạy frontend với backend thật

```powershell
cd frontend
$env:VITE_API_BASE_URL="http://localhost:8000/api/v1"
$env:VITE_ENABLE_MSW="false"
npm run dev -- --host localhost
```

### Bước 5. Mở ứng dụng

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/api/v1/health`
- Backend ready: `http://localhost:8000/api/v1/health/ready`

## Cách 2: Chạy frontend độc lập với MSW

Phù hợp khi chỉ muốn làm UI hoặc test frontend isolated.

```powershell
cd frontend
$env:VITE_ENABLE_MSW="true"
npm run dev -- --host localhost
```

Lưu ý:

- MSW chỉ dùng cho development/test
- production build không giữ `mockServiceWorker.js`

## Hướng dẫn sử dụng sản phẩm

## Tài khoản development

Tài khoản được tạo bởi lệnh seed từ `backend/.env`.

Mặc định trong luồng development hiện tại:

- Học sinh: `hs1`
- Giáo viên: `gv1`

Mật khẩu lấy theo giá trị cấu hình trong `backend/.env`.

## Luồng học sinh

1. Truy cập `http://localhost:5173/login`
2. Đăng nhập bằng tài khoản học sinh
3. Vào `/student`
4. Xem bài đang được giao
5. Bấm `Bắt đầu làm bài` hoặc `Tiếp tục`
6. Thực hiện diagnostic
7. Nếu hệ thống phát hiện lỗ hổng kiến thức:
   học sinh được chuyển sang remediation
8. Làm transfer check
9. Xem result ở cuối phiên học

Các trạng thái outcome hiện có:

- Hoàn thành ngay sau diagnostic
- Hoàn thành sau remediation
- Cần giáo viên hỗ trợ thêm

## Luồng giáo viên

1. Đăng nhập bằng tài khoản giáo viên
2. Vào `/teacher`
3. Chọn lớp phụ trách
4. Xem assignment của lớp
5. Mở overview của assignment
6. Xem:
   - số lượng học sinh theo trạng thái
   - root-cause groups
   - danh sách học sinh
7. Mở learning session evidence để xem timeline và attempts

## Lệnh hữu ích

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

### Health check

```powershell
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/ready
```

## Reset dữ liệu development

Khi cần làm sạch môi trường demo:

```powershell
docker compose exec backend python -m app.cli.reset_dev_database
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.cli.seed_dev_users --reset-password
docker compose exec backend python -m app.cli.seed_dev_core
docker compose exec backend python -m app.cli.seed_dev_content
docker compose exec backend python -m app.cli.validate_content --package-code MATH6_FRACTIONS_FOUNDATION_V1
```

Guard an toàn hiện có:

- chỉ cho phép reset khi `APP_ENV=development`
- chỉ cho phép reset `mina_dev`
- pytest PostgreSQL chỉ dùng `mina_test`

## Trạng thái hiện tại của sản phẩm

Tính đến ngày `18/07/2026`, Mina AI đã có:

- auth thật bằng cookie HttpOnly
- student home và assignments dùng backend thật
- deterministic diagnostic engine
- remediation flow thật
- transfer flow thật
- result page thật
- teacher overview, student list và evidence thật
- content package MVP cho Toán phân số lớp 6
- Docker backend chạy được với migration `0006`
- test DB tách biệt với dev DB

## Những gì chưa có

- Remediation UI nâng cao với rich math rendering
- Transfer analytics nâng cao
- Teacher dashboard charts
- Assignment authoring UI
- Admin panel
- Full curriculum ngoài vertical slice hiện tại
- AI, LLM, RAG, pgvector
- HTTPS termination/Nginx production deployment
- Rate limiting và hardening security đầy đủ cho rollout diện rộng

## Ghi chú quan trọng

- Diagnostic engine hiện tại là deterministic, không dùng AI runtime
- Student APIs không lộ answer key
- Teacher evidence API có thể trả `isCorrect` sau khi đã qua role authorization
- Content development hiện tại là nội dung MVP để thử nghiệm nội bộ, chưa phải bản phê duyệt chính thức để rollout đại trà

## Tài liệu chi tiết hơn

- Backend: [backend/README.md](/abs/path/D:/Downloads/hackathon2/MinaAI-VAIC/backend/README.md)
- Frontend: [frontend/README.md](/abs/path/D:/Downloads/hackathon2/MinaAI-VAIC/frontend/README.md)
