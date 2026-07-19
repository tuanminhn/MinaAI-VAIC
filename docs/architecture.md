# Architecture

Tài liệu này mô tả kiến trúc của runtime hiện tại:

- Frontend: React + Vite
- Backend: FastAPI REST API
- Domain logic: service + state machine
- Persistence: PostgreSQL

AI runtime bên ngoài chưa được tích hợp vào backend hiện tại.

## Tổng quan

Frontend gọi FastAPI qua HTTP repository. Backend xác thực người dùng bằng opaque session token lưu trong cookie `HttpOnly`, sau đó điều phối luồng học sinh và giáo viên qua service layer.

Deterministic diagnostic engine hiện thực bằng:

- `DiagnosticService`
- `DiagnosticStateMachine`
- `LearningFlowService`
- `LearningStateMachine`
- `SkillGraphService`

Teacher evidence được tổng hợp từ assignment, learning session, transition timeline và attempt history trong PostgreSQL.

## Sơ đồ kiến trúc tổng thể

```mermaid
flowchart LR
    Student[Học sinh]
    Teacher[Giáo viên]
    FE[React + Vite]
    API[FastAPI API]
    Auth[Auth Service]
    Learning[Diagnostic và Learning Services]
    Content[Content và Skill Graph]
    Evidence[Teacher Analytics]
    DB[(PostgreSQL)]

    Student --> FE
    Teacher --> FE
    FE --> API
    API --> Auth
    API --> Learning
    API --> Content
    API --> Evidence
    Auth --> DB
    Learning --> DB
    Content --> DB
    Evidence --> DB
```

## Luồng User -> App -> Learning Engine hiện tại

```mermaid
sequenceDiagram
    actor Student as Học sinh
    participant FE as Frontend App
    participant API as FastAPI
    participant Engine as Learning Engine
    participant Graph as Skill Graph
    participant DB as PostgreSQL
    actor Teacher as Giáo viên

    Student->>FE: Đăng nhập và mở assignment
    FE->>API: POST /auth/login
    FE->>API: POST /student/assignments/{id}/diagnostic-sessions
    API->>Engine: Tạo hoặc resume session
    Engine->>Graph: Chọn target skill và prerequisite chain
    Engine->>DB: Lưu session, evaluation, attempts
    FE->>API: POST attempt theo từng câu
    API->>Engine: Chấm theo rule deterministic
    Engine->>Graph: Traversal prerequisite khi cần
    Engine->>DB: Cập nhật state, root cause, timeline
    FE->>API: GET result hoặc GET evidence
    API->>DB: Tổng hợp learning status và attempts
    Teacher->>FE: Xem bằng chứng học tập
```

## Luồng diagnostic

Luồng diagnostic hiện tại:

```text
Target skill
-> diagnostic questions
-> pass hoặc fail ở từng skill
-> prerequisite traversal
-> root-cause skill hoặc completed
-> remediation
-> transfer
-> result
```

Ví dụ với content package đang seed cho development:

```mermaid
flowchart TD
    A[MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION]
    B[MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR]
    C[MATH6.FRACTIONS.COMMON_DENOMINATOR]
    D[MATH6.FRACTIONS.EQUIVALENT_FRACTION]
    E[MATH6.MULTIPLES.LCM]
    F[MATH6.MULTIPLES.COMMON_MULTIPLE]

    A --> B
    B --> C
    C --> D
    C --> E
    E --> F
```

Engine không dùng LLM để xác định root cause. Root cause được chọn từ prerequisite chain và kết quả pass/fail của từng skill evaluation.

## State machine

### Diagnostic session states

```mermaid
stateDiagram-v2
    [*] --> diagnosing
    diagnosing --> diagnosing: còn câu trong skill hiện tại
    diagnosing --> gap_confirmed: tìm thấy root cause
    diagnosing --> completed: mastered_without_remediation
    gap_confirmed --> in_remediation: start remediation
    in_remediation --> transfer_ready: hoàn thành remediation
    transfer_ready --> in_remediation: transfer fail lần 1
    transfer_ready --> completed: transfer pass
    transfer_ready --> completed: transfer fail lần 2
```

### Outcomes

```mermaid
flowchart LR
    A[completed]
    A --> B[mastered_without_remediation]
    A --> C[mastered_after_remediation]
    A --> D[needs_teacher_support]
```

## Teacher evidence

Teacher evidence hiện tại gồm:

- Giáo viên chỉ xem lớp thuộc quyền của mình.
- Assignment overview theo lớp và theo bài giao.
- Danh sách học sinh với trạng thái assignment và session.
- Root cause skill theo từng learning session nếu có.
- Timeline chuyển state từ `learning_session_transitions`.
- Attempt history theo các phase:
  - diagnostic
  - remediation
  - transfer

`is_correct` chỉ xuất hiện trong teacher evidence API, không được đưa vào student diagnostic payload đang mở.

## Deployment hiện tại

```mermaid
flowchart LR
    Browser[Trình duyệt]
    Vite[Frontend dev server<br/>Vite local]
    API[Backend container<br/>FastAPI]
    DB[(PostgreSQL container)]

    Browser --> Vite
    Vite --> API
    API --> DB
```

Runtime hiện tại dùng:

- `postgres` container từ `docker-compose.yml`
- `backend` container từ `docker-compose.yml`
- frontend chạy local bằng `npm run dev`

Không có frontend container hoặc Nginx trong active runtime hiện tại.

## AI roadmap

**Trạng thái:** Định hướng phát triển

AI hiện chưa nằm trong runtime FastAPI đang chạy. Hướng phát triển dự kiến là dùng AI cho sinh candidate content hoặc explanation, trong khi engine chẩn đoán vẫn là deterministic.

```mermaid
flowchart LR
    KB[Knowledge Base]
    RAG[Retrieval]
    Gateway[Model Gateway]
    Gen[Question Candidate]
    Val[Validation]
    Bank[Approved Question Bank]
    Engine[Deterministic Diagnostic Engine]

    KB --> RAG
    RAG --> Gateway
    Gateway --> Gen
    Gen --> Val
    Val --> Bank
    Bank --> Engine
```

Nguyên tắc của roadmap này:

- AI dự kiến dùng để sinh candidate question và explanation.
- Rule engine vẫn quyết định pass/fail, traversal và root cause.
- API LLM ngoài là hướng triển khai ban đầu.
- Local model hosting là hướng nghiên cứu sau.
- Không thành phần AI nào ở trên được xem là đã triển khai trong backend hiện tại.
