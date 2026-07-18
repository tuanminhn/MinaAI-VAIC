# MINA AI TECHNICAL HANDOFF FOR DB & AI

## 0. Purpose

Tài liệu này dùng để bàn giao kỹ thuật codebase Mina AI cho team tiếp tục phát triển, với trọng tâm là:

- hiểu chính xác hệ thống hiện đang có gì trong source
- phân biệt phần production-like với phần demo/mock/placeholder
- chuẩn bị cho giai đoạn mở rộng database đầy đủ hơn
- chuẩn bị tích hợp AI thật mà không phá các luồng deterministic hiện tại

Tài liệu này chỉ dựa trên source code và cấu hình đang có trong repository tại thời điểm kiểm tra. Không có phần nào được đánh dấu `DONE` nếu không thấy evidence trong repo.

## 1. Current System Overview

- **Backend framework**: FastAPI, `DONE`
  Evidence: `backend/app/main.py`, `backend/app/api/v1/*`
- **Frontend framework**: React + Vite + TypeScript, `DONE`
  Evidence: `frontend/package.json`, `frontend/src/app/router/router.tsx`
- **Database hiện tại**: PostgreSQL + SQLAlchemy 2 + Alembic, `DONE`
  Evidence: `backend/pyproject.toml`, `backend/alembic/versions/*`, `backend/app/db/models/*`
- **Auth hiện tại**: username/password + Argon2 + opaque session cookie HttpOnly, `DONE`
  Evidence: `backend/app/api/v1/auth.py`, `backend/app/core/security.py`, `backend/app/services/auth_service.py`
- **Student flow hiện tại**: login -> home -> assignments -> diagnostic -> remediation -> transfer -> result, `DONE`
  Evidence:
  `backend/app/api/v1/student.py`,
  `backend/app/api/v1/diagnostic.py`,
  `frontend/src/routes/student-*.tsx`
- **Teacher flow hiện tại**: login -> classes -> class detail -> assignment overview -> learning evidence, `DONE`
  Evidence:
  `backend/app/api/v1/teacher.py`,
  `frontend/src/routes/teacher-dashboard-page.tsx`,
  `frontend/src/routes/teacher-class-page.tsx`,
  `frontend/src/routes/teacher-assignment-page.tsx`,
  `frontend/src/routes/teacher-session-page.tsx`
- **Teacher groups / interventions / student detail đầy đủ**: `DEMO/MOCK`
  Evidence:
  `frontend/src/routes/teacher-groups-page.tsx`,
  `frontend/src/routes/teacher-interventions-page.tsx`,
  `frontend/src/routes/teacher-student-page.tsx`
  đều đang là `RoutePage` placeholder
- **Diagnostic/remediation/transfer flow hiện tại**: deterministic, backend quyết định state machine, `DONE`
  Evidence:
  `backend/app/services/diagnostic_state_machine.py`,
  `backend/app/services/learning_state_machine.py`,
  `backend/app/services/diagnostic_service.py`,
  `backend/app/services/learning_flow_service.py`
- **AI gateway / fallback / provider / trace observability**: `PLANNED`
  Evidence:
  không tìm thấy provider abstraction, AI routes, trace tables, prompt registry, RAG tables hoặc SDK AI trong repo
- **Learning timeline trace**: `DONE`, nhưng **không phải AI trace**
  Evidence:
  `backend/app/db/models/learning_session_transition.py`

## 2. Status Legend

| Status | Meaning |
| --- | --- |
| DONE | Đã có code và được nối vào luồng chính |
| PARTIAL | Có một phần code nhưng chưa hoàn chỉnh |
| DEMO/MOCK | Chỉ là dữ liệu mẫu, UI giả hoặc hardcoded |
| PLANNED | Chưa có code, chỉ là kế hoạch |
| BLOCKED | Chưa thể làm vì phụ thuộc phần khác |
| UNKNOWN | Chưa xác minh được từ repo |

## 3. Repository Structure

```text
backend/
frontend/
docs/
promax/
docker-compose.yml
README.md
prd.md
```

### Main directories

- `backend/`
  FastAPI application, database models, Alembic migrations, repositories, services, CLI seed/reset/validate commands, backend tests.
- `frontend/`
  React application, route pages, repositories, auth shell, student flow UI, teacher flow UI, MSW handlers, frontend tests.
- `docs/`
  Documentation currently present in repo. Tại thời điểm scan chỉ thấy `brand-guidelines.md`; chưa có technical handoff cho AI/DB trước file này.
- `promax/`
  Skill/reference assets phục vụ design/research. Không phải runtime app code.
- `docker-compose.yml`
  Runtime local/development cho PostgreSQL và backend container.
- `README.md`
  Root project overview.

## 4. Backend Technical Stack

| Area | Technology | Status | Evidence/File |
| --- | --- | --- | --- |
| Language | Python 3.11 | DONE | `backend/pyproject.toml` |
| Framework | FastAPI | DONE | `backend/pyproject.toml`, `backend/app/main.py` |
| ASGI server | Uvicorn | DONE | `backend/pyproject.toml`, `backend/Dockerfile` |
| ORM | SQLAlchemy 2 | DONE | `backend/pyproject.toml`, `backend/app/db/models/*` |
| Migration tool | Alembic | DONE | `backend/pyproject.toml`, `backend/alembic/*` |
| Database driver | Psycopg 3 | DONE | `backend/pyproject.toml` |
| Auth/session | Opaque session cookie HttpOnly | DONE | `backend/app/api/v1/auth.py`, `backend/app/services/auth_service.py` |
| Password hashing | `pwdlib[argon2]` | DONE | `backend/pyproject.toml`, `backend/app/core/security.py` |
| Testing framework | Pytest | DONE | `backend/pyproject.toml`, `backend/app/tests/*` |
| HTTP test client | HTTPX / TestClient | DONE | `backend/pyproject.toml`, `backend/app/tests/*` |
| Linting | Ruff | DONE | `backend/pyproject.toml` |
| Logging | custom request logging middleware | DONE | `backend/app/core/logging.py`, `backend/app/main.py` |
| Environment config | Pydantic Settings | DONE | `backend/pyproject.toml`, `backend/app/core/config.py` |
| Docker | Dockerfile + Compose | DONE | `backend/Dockerfile`, `docker-compose.yml` |
| AI SDK | None found | PLANNED | no evidence in `backend/pyproject.toml` or `backend/app` |
| Observability platform | OpenTelemetry / LangSmith / Sentry | PLANNED | no evidence in repo |
| Retry framework | `tenacity` or equivalent | PLANNED | no evidence in repo |

## 5. Frontend Technical Stack

| Area | Technology | Status | Evidence/File |
| --- | --- | --- | --- |
| Framework | React 18 | DONE | `frontend/package.json` |
| Bundler | Vite 6 | DONE | `frontend/package.json`, `frontend/vite.config.ts` |
| Language | TypeScript | DONE | `frontend/package.json`, `frontend/tsconfig.json` |
| Router | React Router v6 | DONE | `frontend/package.json`, `frontend/src/app/router/router.tsx` |
| API client | custom `fetch` wrapper | DONE | `frontend/src/lib/api/http-client.ts` |
| Data fetching | TanStack Query | DONE | `frontend/package.json`, `frontend/src/lib/query/query-client.ts` |
| Validation | Zod | DONE | `frontend/package.json`, `frontend/src/features/*/schemas/*` |
| Form handling | React Hook Form | DONE | `frontend/package.json`, `frontend/src/features/auth/components/login-form.tsx` |
| UI library | Tailwind CSS + Radix primitives + shadcn-style components | DONE | `frontend/package.json`, `frontend/src/components/ui/*`, `frontend/src/styles/*` |
| Icons | Lucide React | DONE | `frontend/package.json` |
| Toast | Sonner | DONE | `frontend/package.json`, `frontend/src/components/common/app-toast.tsx` |
| State management | React Context + TanStack Query; no Zustand/Redux | DONE | `frontend/src/features/auth/hooks/auth-provider.tsx` |
| Auth handling | cookie session + `/auth/me` restore | DONE | `frontend/src/repositories/http-auth-repository.ts`, `frontend/src/features/auth/hooks/*` |
| Mocking | MSW | DONE | `frontend/package.json`, `frontend/src/mocks/*` |
| Student pages | home/assignments/diagnostic/remediation/transfer/result | DONE | `frontend/src/routes/student-*.tsx` |
| Teacher pages | dashboard/class/assignment/session | DONE | `frontend/src/routes/teacher-*.tsx` |
| Teacher groups/interventions/student detail | placeholder only | DEMO/MOCK | `frontend/src/routes/teacher-groups-page.tsx`, `teacher-interventions-page.tsx`, `teacher-student-page.tsx` |
| AI / trace pages | none found | PLANNED | no dedicated AI route/component found |

## 6. Environment Variables

### 6.1 Backend env

| Variable | Used By | Required? | Current Purpose | Status |
| --- | --- | --- | --- | --- |
| `APP_NAME` | Backend | Yes | App display name | DONE |
| `APP_ENV` | Backend | Yes | Environment mode, guards for seed/reset | DONE |
| `API_V1_PREFIX` | Backend | Yes | API prefix, currently `/api/v1` | DONE |
| `DATABASE_URL` | Backend | Yes | Runtime DB connection, currently `mina_dev` | DONE |
| `TEST_DATABASE_URL` | Backend tests | Yes for postgres tests | Separate DB for pytest, currently `mina_test` | DONE |
| `LOG_LEVEL` | Backend | No, default exists | Logging level | DONE |
| `CORS_ORIGINS` | Backend | Yes | Allowed frontend origins | DONE |
| `AUTH_COOKIE_NAME` | Backend | No, default exists | Session cookie name | DONE |
| `AUTH_SESSION_TTL_MINUTES` | Backend | No, default exists | Session expiry | DONE |
| `AUTH_COOKIE_SECURE` | Backend | No, default exists | Cookie secure flag | DONE |
| `AUTH_COOKIE_SAMESITE` | Backend | No, default exists | Cookie SameSite policy | DONE |
| `DEV_STUDENT_USERNAME` | Backend seed | Required for seed workflow | Development student account seed | DONE |
| `DEV_STUDENT_PASSWORD` | Backend seed | Required for seed workflow | Development student password seed | DONE |
| `DEV_STUDENT_DISPLAY_NAME` | Backend seed | Required for seed workflow | Development student display name | DONE |
| `DEV_TEACHER_USERNAME` | Backend seed | Required for seed workflow | Development teacher account seed | DONE |
| `DEV_TEACHER_PASSWORD` | Backend seed | Required for seed workflow | Development teacher password seed | DONE |
| `DEV_TEACHER_DISPLAY_NAME` | Backend seed | Required for seed workflow | Development teacher display name | DONE |

Evidence:
- `backend/.env.example`
- `backend/app/core/config.py`

### 6.2 Frontend env

| Variable | Used By | Required? | Current Purpose | Status |
| --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend | No, default exists | API base URL, fallback `/api/v1` | DONE |
| `VITE_ENABLE_MSW` | Frontend | No | Enable browser MSW in development | DONE |

Evidence:
- `frontend/.env.example`
- `frontend/src/lib/api/config.ts`
- `frontend/src/mocks/browser.ts`

### 6.3 Planned AI env

| Variable | Used By | Required? | Current Purpose | Status |
| --- | --- | --- | --- | --- |
| `AI_PROVIDER_PRIMARY` | Backend AI | Planned | Primary AI provider selection | PLANNED |
| `AI_PROVIDER_FALLBACK` | Backend AI | Planned | Fallback provider selection | PLANNED |
| `FPT_API_KEY` | Backend AI | Planned | FPT provider auth | PLANNED |
| `FPT_API_BASE_URL` | Backend AI | Planned | FPT provider endpoint base | PLANNED |
| `OPENROUTER_API_KEY` | Backend AI | Planned | OpenRouter auth | PLANNED |
| `OPENROUTER_MODEL` | Backend AI | Planned | Fallback model | PLANNED |
| `AI_TRACE_ENABLED` | Backend AI | Planned | Enable trace persistence | PLANNED |
| `AI_MAX_TOKENS` | Backend AI | Planned | Provider call budget per request | PLANNED |
| `AI_TIMEOUT_SECONDS` | Backend AI | Planned | Request timeout | PLANNED |
| `AI_DAILY_BUDGET_VND` | Backend AI | Planned | Soft budget guard | PLANNED |

## 7. Database Current State

| Table/Model | Purpose | Status | Evidence/File | Notes |
| --- | --- | --- | --- | --- |
| `system_metadata` | Hạ tầng baseline table | DONE | `backend/app/db/models/system_metadata.py` | Introduced in migration `0001` |
| `users` | Auth user records | DONE | `backend/app/db/models/user.py` | Roles currently `student` and `teacher` |
| `auth_sessions` | Opaque session persistence | DONE | `backend/app/db/models/auth_session.py` | Stores `token_hash`, not raw token |
| `schools` | School entity | DONE | `backend/app/db/models/school.py` | No detailed address fields |
| `classrooms` | Classroom entity | DONE | `backend/app/db/models/classroom.py` | Includes `grade`, `academic_year` |
| `classroom_memberships` | Link user to classroom | DONE | `backend/app/db/models/classroom_membership.py` | Teacher/student membership roles |
| `assignments` | Assignment metadata | DONE | `backend/app/db/models/assignment.py` | No question/content JSON |
| `assignment_recipients` | Assignment per student | DONE | `backend/app/db/models/assignment_recipient.py` | Tracks progress/status |
| `content_packages` | Content package metadata | DONE | `backend/app/db/models/content_package.py` | Current dev package for fractions |
| `skills` | Skill graph nodes | DONE | `backend/app/db/models/skill.py` | Stable skill codes seeded |
| `skill_prerequisites` | Directed prerequisite edges | DONE | `backend/app/db/models/skill_prerequisite.py` | Deterministic graph traversal uses this |
| `misconceptions` | Misconception metadata | DONE | `backend/app/db/models/misconception.py` | Used in content metadata, not runtime AI |
| `question_items` | Question metadata | DONE | `backend/app/db/models/question_item.py` | `diagnostic`, `remediation`, `transfer` purposes |
| `question_options` | Options and correctness | DONE | `backend/app/db/models/question_option.py` | `is_correct` backend-only |
| `remediation_units` | Remediation content | DONE | `backend/app/db/models/remediation_unit.py` | Plain text content |
| `assignment_content_targets` | Link assignment to target skills/package | DONE | `backend/app/db/models/assignment_content_target.py` | Diagnostic target seed uses this |
| `diagnostic_sessions` | Student learning session root | DONE | `backend/app/db/models/diagnostic_session.py` | Contains state and outcome |
| `diagnostic_skill_evaluations` | Per-skill diagnostic evaluation | DONE | `backend/app/db/models/diagnostic_skill_evaluation.py` | Deterministic traversal state |
| `diagnostic_attempts` | Diagnostic attempts | DONE | `backend/app/db/models/diagnostic_attempt.py` | Idempotent by `client_attempt_id` |
| `remediation_runs` | Remediation cycles | DONE | `backend/app/db/models/remediation_run.py` | Max 2 cycles enforced in service/state |
| `remediation_attempts` | Remediation practice attempts | DONE | `backend/app/db/models/remediation_attempt.py` | Separate from diagnostic attempts |
| `transfer_checks` | Transfer cycles | DONE | `backend/app/db/models/transfer_check.py` | Separate from remediation |
| `transfer_attempts` | Transfer attempts | DONE | `backend/app/db/models/transfer_attempt.py` | Correctness stored backend-side |
| `learning_session_transitions` | Learning flow timeline/audit | DONE | `backend/app/db/models/learning_session_transition.py` | This is learning-flow evidence, not AI trace |
| AI trace tables | AI call trace, provider metadata, token/cost | PLANNED | no evidence in `backend/app/db/models` | Not present |
| RAG tables | documents/chunks/embeddings | PLANNED | no evidence in `backend/app/db/models` | Not present |
| AI safety review tables | output review/guardrail persistence | PLANNED | no evidence in repo | Not present |

## 8. Database Gaps For AI Phase

### 8.1 `ai_trace_runs`

| Planned Table | Why Needed | Depends On | Priority |
| --- | --- | --- | --- |
| `ai_trace_runs` | Lưu mỗi lần gọi AI: provider, model, latency, token, cost, fallback, status, context user/session | `users`, `diagnostic_sessions`, possibly `assignments` | High |

### 8.2 `ai_prompt_templates`

| Planned Table | Why Needed | Depends On | Priority |
| --- | --- | --- | --- |
| `ai_prompt_templates` | Version hóa prompt theo use case và structured output schema | none, but may reference content/skill families later | High |

### 8.3 `ai_provider_events`

| Planned Table | Why Needed | Depends On | Priority |
| --- | --- | --- | --- |
| `ai_provider_events` | Lưu request/response metadata cấp provider mà không cần raw PII | `ai_trace_runs` | Medium |

### 8.4 `rag_documents`

| Planned Table | Why Needed | Depends On | Priority |
| --- | --- | --- | --- |
| `rag_documents` | Metadata của tài liệu knowledge base | schools/content governance process | Medium |

### 8.5 `rag_chunks`

| Planned Table | Why Needed | Depends On | Priority |
| --- | --- | --- | --- |
| `rag_chunks` | Lưu chunk text, vector, source, grade, topic, skill link | `rag_documents`, `skills`, possible `pgvector` | Medium |

### 8.6 `ai_safety_reviews`

| Planned Table | Why Needed | Depends On | Priority |
| --- | --- | --- | --- |
| `ai_safety_reviews` | Lưu kết quả validate output, blocked reason, fallback template used | `ai_trace_runs` | High |

## 9. API Inventory

### 9.1 Auth APIs

| Method | Path | Purpose | Auth Role | Status | Frontend Used? | Evidence/File |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | Login + set session cookie | Public | DONE | Yes | `backend/app/api/v1/auth.py`, `frontend/src/repositories/http-auth-repository.ts` |
| GET | `/api/v1/auth/me` | Restore current user from cookie | Authenticated | DONE | Yes | same |
| POST | `/api/v1/auth/logout` | Revoke session and clear cookie | Authenticated | DONE | Yes | same |

### 9.2 Student APIs

| Method | Path | Purpose | Auth Role | Status | Frontend Used? | Evidence/File |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/student/home` | Student home payload | Student | DONE | Yes | `backend/app/api/v1/student.py`, `frontend/src/repositories/http-student-repository.ts` |
| GET | `/api/v1/student/assignments` | Student assignment list | Student | DONE | Yes | same |
| POST | `/api/v1/student/assignments/{assignment_id}/diagnostic-sessions` | Start or resume diagnostic session | Student | DONE | Yes | same |

### 9.3 Diagnostic / Learning Flow APIs

| Method | Path | Purpose | Auth Role | Status | Frontend Used? | Evidence/File |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/diagnostic-sessions/{session_id}` | Get diagnostic session state/current question | Student | DONE | Yes | `backend/app/api/v1/diagnostic.py`, `frontend/src/repositories/http-diagnostic-repository.ts` |
| POST | `/api/v1/diagnostic-sessions/{session_id}/attempts` | Submit diagnostic attempt | Student | DONE | Yes | same |
| POST | `/api/v1/diagnostic-sessions/{session_id}/remediation-runs` | Start/resume remediation | Student | DONE | Yes | same |
| GET | `/api/v1/diagnostic-sessions/{session_id}/remediation` | Get remediation unit + current practice question | Student | DONE | Yes | same |
| POST | `/api/v1/diagnostic-sessions/{session_id}/remediation/attempts` | Submit remediation attempt | Student | DONE | Yes | same |
| POST | `/api/v1/diagnostic-sessions/{session_id}/transfer-checks` | Start/resume transfer check | Student | DONE | Yes | same |
| GET | `/api/v1/diagnostic-sessions/{session_id}/transfer` | Get transfer question state | Student | DONE | Yes | same |
| POST | `/api/v1/diagnostic-sessions/{session_id}/transfer/attempts` | Submit transfer attempt | Student | DONE | Yes | same |
| GET | `/api/v1/diagnostic-sessions/{session_id}/result` | Get result payload | Student | DONE | Yes | same |

### 9.4 Teacher APIs

| Method | Path | Purpose | Auth Role | Status | Frontend Used? | Evidence/File |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/teacher/classes` | List teacher classes | Teacher | DONE | Yes | `backend/app/api/v1/teacher.py`, `frontend/src/repositories/http-teacher-repository.ts` |
| GET | `/api/v1/teacher/classes/{class_id}` | Class detail | Teacher | DONE | Yes | same |
| GET | `/api/v1/teacher/classes/{class_id}/students` | Class roster | Teacher | DONE | Yes | same |
| GET | `/api/v1/teacher/classes/{class_id}/assignments` | Assignment list for class | Teacher | DONE | Yes | same |
| GET | `/api/v1/teacher/assignments/{assignment_id}/overview` | Overview counts and root-cause groups | Teacher | DONE | Yes | same |
| GET | `/api/v1/teacher/assignments/{assignment_id}/students` | Assignment student table | Teacher | DONE | Yes | same |
| GET | `/api/v1/teacher/learning-sessions/{session_id}` | Learning evidence timeline + attempts | Teacher | DONE | Yes | same |

### 9.5 Content APIs

| Method | Path | Purpose | Auth Role | Status | Frontend Used? | Evidence/File |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/content/packages/{package_code}` | Content package summary | Teacher | DONE | No | `backend/app/api/v1/content.py` |
| GET | `/api/v1/content/packages/{package_code}/skills` | Skills in package | Teacher | DONE | No | same |
| GET | `/api/v1/content/skills/{skill_code}` | Skill detail with metadata | Teacher | DONE | No | same |

### 9.6 Health APIs

| Method | Path | Purpose | Auth Role | Status | Frontend Used? | Evidence/File |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | Process health | Public | DONE | PARTIAL | `backend/app/api/v1/health.py`, `frontend/src/repositories/health-repository.ts` |
| GET | `/api/v1/health/ready` | DB readiness | Public | DONE | No direct UI use found | same |

### 9.7 AI APIs

No AI route was found in `backend/app/api/v1`.

Planned AI contracts:

| Method | Path | Purpose | Auth Role | Status | Frontend Used? | Evidence/File |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/ai/student-hint` | Context-aware hint | Student | PLANNED | No | none |
| POST | `/api/v1/ai/explain-root-cause` | Explain deterministic root cause in safe language | Student/Teacher | PLANNED | No | none |
| POST | `/api/v1/ai/teacher-summary` | Summarize evidence for teacher | Teacher | PLANNED | No | none |
| POST | `/api/v1/ai/remediation-nudge` | Generate supportive remediation nudge | Student | PLANNED | No | none |
| GET | `/api/v1/ai/traces` | List AI traces | Teacher/Admin | PLANNED | No | none |
| GET | `/api/v1/ai/traces/{trace_id}` | AI trace detail | Teacher/Admin | PLANNED | No | none |
| GET | `/api/v1/ai/usage/summary` | Usage/cost summary | Teacher/Admin | PLANNED | No | none |

## 10. Frontend Page Inventory

| Route/Page | Purpose | API Used | Status | Notes |
| --- | --- | --- | --- | --- |
| `/login` | Login UI | `/auth/login`, `/auth/me`, `/auth/logout` | DONE | Real auth flow |
| `/student` | Student home | `/student/home` | DONE | Real backend |
| `/student/assignments` | Student assignments list | `/student/assignments`, start diagnostic | DONE | Real backend |
| `/student/diagnostic/:sessionId` | Diagnostic player | `/diagnostic-sessions/{id}`, `/attempts` | DONE | Real backend |
| `/student/remediation/:sessionId` | Remediation player | `/remediation-runs`, `/remediation`, remediation attempts | DONE | Real backend |
| `/student/transfer/:sessionId` | Transfer player | `/transfer-checks`, `/transfer`, transfer attempts | DONE | Real backend |
| `/student/result/:sessionId` | Result page | `/result` | DONE | Real backend |
| `/teacher` | Teacher dashboard | `/teacher/classes` | DONE | Real backend |
| `/teacher/classes/:classId` | Teacher class detail | `/teacher/classes/{id}`, `/students`, `/assignments` | DONE | Real backend |
| `/teacher/assignments/:assignmentId` | Teacher assignment overview | `/teacher/assignments/{id}/overview`, `/students` | DONE | Real backend |
| `/teacher/sessions/:sessionId` | Teacher learning evidence | `/teacher/learning-sessions/{id}` | DONE | Real backend |
| `/teacher/students/:studentId` | Student detail page | None real | DEMO/MOCK | Placeholder `RoutePage` only |
| `/teacher/groups` | Support groups page | None real | DEMO/MOCK | Placeholder only |
| `/teacher/interventions` | Interventions page | None real | DEMO/MOCK | Placeholder only |
| `/403` | Forbidden page | none | DONE | Static page |
| `/404` | Not found page | none | DONE | Static page |
| `/dev/design-system` | Dev-only design preview | none | DONE | Development only |
| AI trace/log pages | Teacher/admin AI trace UI | none | PLANNED | No route found |

## 11. Dependency Inventory

### 11.1 Backend Dependencies Already Installed

| Package | Purpose | Status | Evidence |
| --- | --- | --- | --- |
| `fastapi` | Web framework | DONE | `backend/pyproject.toml` |
| `uvicorn[standard]` | ASGI server | DONE | same |
| `sqlalchemy` | ORM | DONE | same |
| `alembic` | Migrations | DONE | same |
| `psycopg[binary]` | PostgreSQL driver | DONE | same |
| `pydantic-settings` | Env/config | DONE | same |
| `pwdlib[argon2]` | Password hashing | DONE | same |
| `httpx` | API/integration testing | DONE | same |
| `pytest` | Test framework | DONE | same |
| `ruff` | Lint/format | DONE | same |

### 11.2 Frontend Dependencies Already Installed

| Package | Purpose | Status | Evidence |
| --- | --- | --- | --- |
| `react` | UI framework | DONE | `frontend/package.json` |
| `react-dom` | DOM renderer | DONE | same |
| `react-router-dom` | Routing | DONE | same |
| `@tanstack/react-query` | Server state/query | DONE | same |
| `react-hook-form` | Forms | DONE | same |
| `@hookform/resolvers` | Form resolver bridge | DONE | same |
| `zod` | Schema validation | DONE | same |
| `lucide-react` | Icons | DONE | same |
| `clsx` | Conditional classes | DONE | same |
| `tailwind-merge` | Tailwind merge helper | DONE | same |
| `class-variance-authority` | Variant composition | DONE | same |
| `sonner` | Toasts | DONE | same |
| `@radix-ui/react-label` | Accessible label primitive | DONE | same |
| `@radix-ui/react-separator` | Separator primitive | DONE | same |
| `@radix-ui/react-slot` | Slot primitive | DONE | same |
| `@radix-ui/react-tooltip` | Tooltip primitive | DONE | same |
| `vite` | Bundler | DONE | same |
| `@vitejs/plugin-react` | Vite React plugin | DONE | same |
| `typescript` | Type system | DONE | same |
| `tailwindcss` | Styling | DONE | same |
| `@tailwindcss/vite` | Tailwind Vite integration | DONE | same |
| `msw` | Mock Service Worker | DONE | same |
| `vitest` | Test runner | DONE | same |
| `@testing-library/react` | Component testing | DONE | same |
| `@testing-library/user-event` | User interaction testing | DONE | same |
| `@testing-library/jest-dom` | DOM assertions | DONE | same |
| `vitest-axe` | Accessibility tests | DONE | same |
| `jsdom` | DOM environment for tests | DONE | same |
| `eslint` + plugins | Linting | DONE | same |
| `prettier` | Formatting checks | DONE | same |

### 11.3 Planned Dependencies For AI/DB Phase

| Package | Purpose | Status | Evidence |
| --- | --- | --- | --- |
| Provider SDK or plain HTTP adapter for FPT AI | Primary AI provider integration | PLANNED | not in manifests |
| Provider SDK or plain HTTP adapter for OpenRouter | Fallback AI provider integration | PLANNED | not in manifests |
| `tenacity` or retry utility | Bounded retry policy | PLANNED | not in manifests |
| `pgvector` extension | Vector storage for RAG | PLANNED | no DB/model evidence |
| Tokenizer package such as `tiktoken` or equivalent | Token estimation/tracking | PLANNED | not in manifests |
| Structured output validation helpers | AI output schema enforcement | PLANNED | not in manifests |
| OpenTelemetry | Standard tracing/metrics if needed later | PLANNED | not in manifests |
| Frontend table/log viewer enhancements | AI trace dashboard | PLANNED | not in package.json |
| Frontend chart library | Usage/cost summary UI if needed later | PLANNED | not in package.json |

## 12. AI Current State

| AI Component | Current Status | Evidence/File | Risk |
| --- | --- | --- | --- |
| AI gateway | PLANNED | no file found in `backend/app` | Team có thể nhầm learning flow service với AI orchestration, nhưng hiện không có |
| Provider abstraction | PLANNED | no provider interface found | Chưa có chỗ chuẩn để gắn FPT/OpenRouter |
| FPT provider | PLANNED | no evidence | Chưa có call thật |
| OpenRouter fallback | PLANNED | no evidence | Chưa có fallback thật |
| Prompt templates | PLANNED | no table/file registry found | Chưa version hóa prompt |
| Structured output parser | PLANNED | no AI parser found | Chưa có guard cho LLM output |
| Guardrail | PLANNED | no evidence | Chưa có policy enforcement |
| Trace logging | PLANNED | no AI trace table or service found | Dễ nhầm `learning_session_transitions` là AI trace, nhưng không phải |
| Cost tracking | PLANNED | no evidence | Chưa kiểm soát chi phí |
| Latency tracking | PLANNED | no evidence | Chưa đo provider latency |
| Token tracking | PLANNED | no evidence | Chưa có token accounting |
| Teacher-facing AI summary | PLANNED | no evidence | Teacher evidence hiện là deterministic data, không có AI summary |
| Student hint | PLANNED | no evidence | Chưa có AI hint route/UI |
| RAG | PLANNED | no evidence | Không có document/chunk/vector tables |
| Embedding | PLANNED | no evidence | Không có embedding pipeline |
| LangSmith | PLANNED | no evidence | Chưa tích hợp |
| LangGraph | PLANNED | no evidence | Chưa tích hợp |

**Important note**:
Trace UI hiện có **không chứng minh AI thật**. Repo hiện chỉ có learning evidence/timeline cho deterministic learning flow. Cần đối soát bằng provider request thật và trace record thật khi làm AI phase.

## 13. AI Design Rule

LLM **không được quyết định**:

- đáp án đúng/sai
- root cause cuối cùng
- learning path chính
- pass/fail transfer
- mastery status
- teacher intervention priority

LLM chỉ được hỗ trợ:

- giải thích
- hint
- tóm tắt
- diễn giải evidence
- gợi ý bước học tiếp
- tạo nội dung nháp có kiểm duyệt

## 14. Planned AI API Contracts

### 14.1 Student Hint

```http
POST /api/v1/ai/student-hint
```

Purpose:
- cung cấp hint ngắn, không lộ đáp án

Auth role:
- `student`

Request:

```json
{
  "session_id": "string",
  "question_id": "string",
  "student_answer": "string",
  "locked_skill_id": "string",
  "locked_misconception_id": "string",
  "attempt_number": 1
}
```

Response:

```json
{
  "hint": "string",
  "hint_level": 1,
  "must_not_reveal_answer": true,
  "trace_id": "string",
  "fallback_used": false
}
```

Database tables needed:
- `ai_trace_runs`
- `ai_prompt_templates`
- optional `ai_safety_reviews`

Fallback behavior:
- FPT -> OpenRouter -> deterministic template

Risk notes:
- must not reveal correct option
- must not alter backend grading/state

### 14.2 Root Cause Explanation

```http
POST /api/v1/ai/explain-root-cause
```

- Purpose: diễn giải root cause deterministic bằng ngôn ngữ thân thiện
- Auth role: `student` or `teacher`
- Input: `session_id`, locked `root_cause_skill_id`
- Output: explanation text, trace metadata
- Database tables needed: `ai_trace_runs`, `ai_prompt_templates`
- Fallback behavior: template explanation
- Risk notes: AI không được đổi root cause

### 14.3 Teacher Summary

```http
POST /api/v1/ai/teacher-summary
```

- Purpose: tóm tắt evidence cho giáo viên
- Auth role: `teacher`
- Input: `session_id` hoặc `assignment_id + student_id`
- Output: short summary + recommended next step + trace id
- Database tables needed: `ai_trace_runs`, `ai_prompt_templates`, optional `ai_safety_reviews`
- Fallback behavior: deterministic summary template
- Risk notes: không được gán can thiệp ưu tiên cuối cùng cho AI

### 14.4 AI Usage Summary

```http
GET /api/v1/ai/usage/summary
```

- Purpose: tổng hợp usage/cost/latency theo provider và thời gian
- Auth role: `teacher/admin`
- Input: date range filters
- Output: aggregate stats
- Database tables needed: `ai_trace_runs`, `ai_provider_events`
- Fallback behavior: none
- Risk notes: cần giới hạn lộ thông tin nhạy cảm

## 15. AI Provider Strategy

Proposed strategy:

```text
Primary: FPT AI API
Fallback: OpenRouter
Final fallback: deterministic/template response
```

Rules:

- timeout ngắn
- retry giới hạn
- không retry nếu structured output validation fail
- fallback phải được log
- mọi request AI phải có `trace_id`
- không expose raw provider error cho học sinh
- không lưu API key trong frontend

Current repo status:
- toàn bộ chiến lược trên là `PLANNED`

## 16. Observability & Trace Plan

| Field | Purpose |
| --- | --- |
| `trace_id` | ID theo dõi |
| `user_id` | ai gọi |
| `role` | student/teacher |
| `session_id` | learning session |
| `provider` | fpt/openrouter/template |
| `model` | model name |
| `prompt_version` | version prompt |
| `latency_ms` | độ trễ |
| `input_tokens` | token vào |
| `output_tokens` | token ra |
| `estimated_cost` | chi phí |
| `fallback_used` | có fallback không |
| `fallback_reason` | lý do fallback |
| `status` | success/error/blocked |
| `error_code` | mã lỗi nếu có |
| `created_at` | thời điểm |

Current repo status:
- `PLANNED`
- no AI trace persistence found

## 17. Security & Privacy Notes

- Không đưa API key AI ra frontend
- Không log full student personal data nếu không cần
- Không lưu raw prompt có thông tin nhạy cảm nếu chưa có policy rõ
- Session hiện tại phải là `HttpOnly`
  Evidence: `backend/app/api/v1/auth.py`
- Teacher hiện chỉ xem dữ liệu lớp của mình
  Evidence: `backend/app/services/teacher_class_service.py`, `teacher_analytics_service.py`
- Student hiện chỉ xem session của mình
  Evidence: `backend/app/api/dependencies/auth.py`, student/diagnostic services
- AI output tương lai không được override deterministic learning result

## 18. Testing Status

| Test Area | Existing Tests | Status | Missing Tests |
| --- | --- | --- | --- |
| Backend config/runtime | `test_config.py`, `test_app.py`, `test_readiness_postgres.py` | DONE | More Docker-only smoke tests if needed |
| Backend auth | `test_auth_postgres.py`, `test_security.py` | DONE | AI-aware auth rate limiting tests not present |
| Backend migrations | `test_migrations_postgres.py` | DONE | AI migration tests not present |
| Backend DB safety | `test_database_safety.py` | DONE | none critical for current scope |
| Backend content | `test_content_postgres.py` | DONE | no AI content tests |
| Backend diagnostic | `test_diagnostic_postgres.py` | DONE | no AI hint/AI explanation tests |
| Backend learning flow | `test_learning_flow_postgres.py` | DONE | no AI-assisted remediation tests |
| Backend teacher evidence | `test_teacher_evidence_postgres.py` | DONE | no AI teacher-summary tests |
| Frontend auth | `src/test/auth.spec.tsx` | DONE | browser E2E not found |
| Frontend student | `src/test/student.spec.tsx` | DONE | no real provider AI UI tests |
| Frontend diagnostic | `src/test/diagnostic.spec.tsx` | DONE | no AI hint UI tests |
| Frontend remediation/result | `src/test/learning-flow.spec.tsx` | DONE | no AI explanation/result summary tests |
| Frontend teacher | `src/test/teacher.spec.tsx` | DONE | no AI summary dashboard tests |
| Frontend infra | `src/test/infrastructure.spec.ts` | DONE | no AI trace build inspection tests |
| E2E browser automation | no Playwright/Cypress found | UNKNOWN | end-to-end browser automation missing |
| AI tests | none found | PLANNED | provider success/timeout/invalid JSON/fallback/trace persistence/no-answer-leakage |

Planned AI tests:

- provider success
- provider timeout
- provider invalid JSON
- fallback to OpenRouter
- fallback to template
- cost tracking
- trace persistence
- no answer leakage in hint
- teacher role guard
- student role guard

## 19. Recommended Implementation Roadmap

### Phase 1 DB Hardening

- Chuẩn hóa schema AI trace
- Bổ sung `ai_trace_runs`
- Bổ sung `ai_prompt_templates`
- Bổ sung `ai_provider_events`
- Bổ sung `ai_safety_reviews`
- Viết migration và tests

### Phase 2 AI Gateway Real Provider

- Implement provider interface
- Implement FPT provider
- Implement OpenRouter fallback
- Implement timeout/retry
- Implement structured output validation
- Implement deterministic template fallback

### Phase 3 AI Trace & Cost Dashboard

- Persist trace thật
- API list traces
- API trace detail
- API usage summary
- Teacher/admin dashboard xem latency, cost, provider, fallback

### Phase 4 Student AI UX

- Hint theo context
- Explain root cause
- Không lộ đáp án
- UI loading/error/fallback rõ ràng

### Phase 5 Teacher AI UX

- AI summary cho từng học sinh
- AI class insight
- Gợi ý can thiệp
- Teacher approval trước khi áp dụng

### Phase 6 RAG

- Knowledge document ingestion
- Chunking
- Embedding
- `pgvector`
- Retrieval
- Citation/source display
- RAG evaluation

## 20. Team Task Breakdown

### Backend DB Owner

- migration
- schema
- repository
- seed
- tests

### Backend AI Owner

- provider adapter
- prompt registry
- fallback
- validation
- trace

### Frontend Student Owner

- student hint UI
- explain UI
- remediation UI integration for AI assistance

### Frontend Teacher Owner

- trace dashboard
- usage/cost dashboard
- AI summary panel

### QA Owner

- test plan
- fixture data
- acceptance checklist

### Tech Lead

- review contracts
- enforce AI boundary
- check production readiness

## 21. Risks & Warnings

- Dễ nhầm learning evidence/timeline hiện tại là AI trace thật
- LLM có thể giải sai nếu cho quyền quyết định learning path
- RAG chưa có evaluation sẽ dễ trả lời bịa
- Token/cost nếu không log từ đầu sẽ khó kiểm soát
- Provider outage phải có fallback
- Hardcoded dev/demo credentials trong local `.env` không được coi là production
- Seed data development không được dùng làm dữ liệu thật
- Student APIs hiện đúng là deterministic; nếu AI phase làm sai boundary sẽ phá tính kiểm chứng của diagnostic engine

## 22. Definition of Done For AI Phase

AI phase chỉ được coi là done khi:

- có provider call thật
- có fallback thật
- có trace lưu DB
- có cost/latency/token
- có structured output validation
- có guardrail cơ bản
- có test timeout/failure
- frontend gọi API AI thật
- teacher/admin xem được trace thật
- không có API key ở frontend
- không để AI quyết định root cause hoặc điểm số

## 23. Open Questions For Team

- FPT API dùng endpoint/model nào?
- Có dùng OpenRouter fallback ngay không?
- Có cần LangSmith không hay tự lưu trace DB trước?
- Có dùng LangGraph không hay service orchestration thường?
- Có dùng `pgvector` trong PostgreSQL không?
- Knowledge base ban đầu lấy từ đâu?
- Có cần admin dashboard riêng cho cost không?
- Chính sách lưu raw prompt/response là gì?
- Có cần ẩn thông tin học sinh khỏi AI provider không?

## 24. Final Summary

Hệ thống hiện tại đã có nền tảng tốt cho phase DB + AI:

- auth thật bằng cookie HttpOnly
- PostgreSQL thật với Alembic
- student flow deterministic chạy end-to-end
- teacher evidence và analytics tối thiểu chạy thật
- content package MVP và skill graph thật

Những phần nên giữ:

- deterministic diagnostic/remediation/transfer state machine
- backend quyết định correctness, root cause, outcome
- frontend chỉ là client hiển thị + submit
- dev/test DB separation

Những phần **không được tin là production AI**:

- mọi route placeholder của teacher groups/interventions/student detail
- toàn bộ MSW fixtures
- toàn bộ dev seed data
- bất kỳ ý tưởng AI nào hiện mới nằm trong README/PRD, vì repo chưa có provider call thật

Việc tiếp theo nên làm:

1. chốt AI provider strategy
2. thêm AI trace schema
3. thêm AI gateway/provider abstraction thật
4. thêm AI API contract + tests
5. thêm teacher/admin trace observability UI
