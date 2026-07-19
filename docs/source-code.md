# Source Code

Tài liệu này mô tả cấu trúc mã nguồn đang được dùng trong runtime chính của Mina AI:

- `backend/`: FastAPI + PostgreSQL + Alembic
- `frontend/`: React + Vite + TypeScript

Prototype root dùng Next.js/Bun không thuộc runtime hiện tại.

## Repository map

```text
backend/
  app/
    api/
    cli/
    core/
    db/
    repositories/
    schemas/
    services/
    tests/
  alembic/
  Dockerfile
  README.md
  pyproject.toml

frontend/
  public/
  src/
    app/
    components/
    contracts/
    features/
    hooks/
    lib/
    mocks/
    repositories/
    routes/
    styles/
    test/
  package.json
  vite.config.ts
  vitest.config.ts
  eslint.config.js

docs/
docker-compose.yml
```

## Backend modules

### `app/api`

Chứa HTTP routes cho các domain:

- `v1/auth.py`
- `v1/student.py`
- `v1/diagnostic.py`
- `v1/teacher.py`
- `v1/content.py`
- `v1/health.py`

`app/api/dependencies` chứa dependency cho database session và role enforcement.

### `app/services`

Chứa business rules và state machine:

- `auth_service.py`
- `student_service.py`
- `diagnostic_service.py`
- `diagnostic_state_machine.py`
- `learning_flow_service.py`
- `learning_state_machine.py`
- `teacher_analytics_service.py`
- `teacher_class_service.py`
- `content_service.py`
- `skill_graph_service.py`

Quy ước hiện tại:

- Auth xử lý ở `auth_service`.
- Diagnostic traversal xử lý ở `diagnostic_service` + `diagnostic_state_machine`.
- Remediation và transfer xử lý ở `learning_flow_service` + `learning_state_machine`.
- Tổng hợp dữ liệu giáo viên xử lý ở `teacher_analytics_service`.

### `app/repositories`

Truy cập dữ liệu và khóa bản ghi:

- `assignment_repository.py`
- `auth_session_repository.py`
- `classroom_repository.py`
- `content_repository.py`
- `diagnostic_repository.py`
- `school_repository.py`
- `teacher_repository.py`
- `user_repository.py`

Business logic không đặt ở repository.

### `app/schemas`

Schema request/response bằng Pydantic:

- `auth.py`
- `student.py`
- `diagnostic.py`
- `teacher.py`
- `content.py`
- `health.py`
- `common.py`

### `app/db`

- `models/`: SQLAlchemy models
- `session.py`: engine, session scope và readiness check
- `base.py`: metadata dùng cho models

### `app/cli`

Utility cho development và validation:

- `seed_dev_users.py`
- `seed_dev_core.py`
- `seed_dev_content.py`
- `validate_content.py`
- `reset_dev_database.py`
- `cleanup_sessions.py`

### `app/tests`

Integration test và safety test cho PostgreSQL runtime:

- auth
- content
- diagnostic
- learning flow
- teacher evidence
- migrations
- config và database safety

## Frontend modules

### `src/app`

- `App.tsx`: root app
- `router/router.tsx`: route map
- `providers/`: React Query, auth context, test providers
- `error-boundary/`: error boundary cho app

### `src/features/auth`

- Login form
- Auth context
- Protected routes
- Teacher shell và student shell

### `src/features/student`

- `student-home-view.tsx`
- `student-assignments-view.tsx`
- hook lấy dữ liệu trang học sinh
- schema validate response học sinh

### `src/features/diagnostic`

- `diagnostic-player-view.tsx`
- `remediation-player-view.tsx`
- `transfer-player-view.tsx`
- `diagnostic-result-view.tsx`
- hook submit attempt và lấy session/result
- helper trình bày progress, feedback và result

Frontend không tự chấm câu trả lời. Frontend chỉ hiển thị câu hỏi hiện tại và gửi attempt lên backend.

### `src/features/teacher`

- `teacher-dashboard-view.tsx`
- `teacher-class-view.tsx`
- `teacher-assignment-view.tsx`
- `teacher-session-view.tsx`
- hooks lấy dữ liệu class, assignment, learning session

`teacher-student-page`, `teacher-groups-page` và `teacher-interventions-page` hiện chưa là flow hoàn chỉnh.

### `src/repositories`

Repository layer tách HTTP và mock:

- `http-auth-repository.ts`
- `http-student-repository.ts`
- `http-diagnostic-repository.ts`
- `http-teacher-repository.ts`
- `health-repository.ts`

### `src/contracts` và `src/features/*/schemas`

- Contract TypeScript mô tả shape dữ liệu
- Zod schema dùng để parse response backend

### `src/mocks`

MSW handlers cho test và development mock:

- `handlers/auth.ts`
- `handlers/diagnostic.ts`
- `handlers/student.ts`
- `handlers/teacher.ts`
- `handlers/health.ts`

## File cấu hình

### Repository root

- `docker-compose.yml`: chạy `postgres` và `backend`

### Backend

- `backend/.env.example`: mẫu biến môi trường development
- `backend/alembic.ini`: cấu hình Alembic
- `backend/pyproject.toml`: dependency, pytest và ruff config
- `backend/Dockerfile`: build image backend

### Frontend

- `frontend/package.json`: scripts và dependencies
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/tsconfig.node.json`
- `frontend/vite.config.ts`
- `frontend/vitest.config.ts`
- `frontend/eslint.config.js`

Không lưu secret thật trong tài liệu hoặc repository.

## Database và migration

Chuỗi migration hiện tại:

| Revision | Mục đích | Main tables |
| --- | --- | --- |
| `20260717_0001` | Metadata hệ thống ban đầu | `system_metadata` |
| `20260718_0002` | Authentication và session | `users`, `auth_sessions` |
| `20260718_0003` | School, classroom, assignment core | `schools`, `classrooms`, `classroom_memberships`, `assignments`, `assignment_recipients` |
| `20260718_0004` | Curriculum content và prerequisite graph | `content_packages`, `skills`, `skill_prerequisites`, `misconceptions`, `question_items`, `question_options`, `remediation_units`, `assignment_content_targets` |
| `20260718_0005` | Diagnostic runtime | `diagnostic_sessions`, `diagnostic_skill_evaluations`, `diagnostic_attempts` |
| `20260718_0006` | Remediation, transfer và timeline | `remediation_runs`, `remediation_attempts`, `transfer_checks`, `transfer_attempts`, `learning_session_transitions` |

## API ownership

| Domain | Backend route file | Service | Frontend consumer |
| --- | --- | --- | --- |
| Auth | `backend/app/api/v1/auth.py` | `AuthService` | `frontend/src/repositories/http-auth-repository.ts` |
| Student | `backend/app/api/v1/student.py` | `StudentService`, `DiagnosticService` | `frontend/src/repositories/http-student-repository.ts` |
| Diagnostic | `backend/app/api/v1/diagnostic.py` | `DiagnosticService` | `frontend/src/repositories/http-diagnostic-repository.ts` |
| Remediation | `backend/app/api/v1/diagnostic.py` | `LearningFlowService` | `frontend/src/repositories/http-diagnostic-repository.ts` |
| Transfer | `backend/app/api/v1/diagnostic.py` | `LearningFlowService` | `frontend/src/repositories/http-diagnostic-repository.ts` |
| Result | `backend/app/api/v1/diagnostic.py` | `LearningFlowService` | `frontend/src/repositories/http-diagnostic-repository.ts` |
| Teacher | `backend/app/api/v1/teacher.py` | `TeacherClassService`, `TeacherAnalyticsService` | `frontend/src/repositories/http-teacher-repository.ts` |
| Content | `backend/app/api/v1/content.py` | `ContentService` | Chưa có consumer UI hoàn chỉnh trong runtime hiện tại |
| Health | `backend/app/api/v1/health.py` | readiness check trong `db/session.py` | `frontend/src/repositories/health-repository.ts` |

## Quy tắc khi cùng phát triển

- Không sửa migration cũ đã merge.
- Tạo revision mới cho mọi schema change.
- Không dùng `create_all()`.
- Business logic đặt trong service hoặc state machine.
- Frontend không tự chấm.
- Không commit `.env`.
- Test PostgreSQL dùng `mina_test`.
- Development runtime dùng `mina_dev`.
- Cập nhật docs khi thay đổi kiến trúc hoặc API.
- Không khôi phục Next.js prototype thành runtime nếu chưa có quyết định kiến trúc rõ ràng.
