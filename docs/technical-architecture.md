# Kiến trúc kỹ thuật Task 2

## Trạng thái và phạm vi

Tài liệu này là nguồn triển khai hiện hành cho hackathon prototype. Phạm vi dữ liệu chỉ gồm Kết nối tri thức, Toán lớp 6–7. Kiến trúc FastAPI còn xuất hiện trong PRD là định hướng cũ và không áp dụng cho prototype này.

Task 2 đã hoàn tất ở mức source code, database và kiểm thử end-to-end. Ngày 2026-07-18, `bun run db:setup` đã migrate và seed thành công 11 skills, 13 edges và 8 questions vào database cấu hình bởi `DATABASE_URL`.

## Stack

- Next.js App Router + React + TypeScript cho UI và Route Handlers.
- PostgreSQL, kết nối bằng `pg` và biến môi trường server-only `DATABASE_URL`.
- SQL migration thuần trong `db/migrations`; seed importer đọc dataset đã duyệt từ `knowledge-graph/output`.
- Diagnostic engine TypeScript thuần, deterministic, không gọi LLM.
- Vitest cho rule engine; TypeScript, ESLint và Next production build là quality gates.

## Thành phần

```text
Student app / Teacher dashboard
            ↓ JSON
Next.js Route Handlers
            ↓
Repository + transaction boundary
       ↙                 ↘
PostgreSQL          Diagnostic engine
                         ↓
       approved knowledge graph + attempts
```

## Database

Migration `db/migrations/001_initial.sql` tạo các nhóm bảng:

- Nội dung: `content_datasets`, `skills`, `knowledge_edges`, `misconceptions`, `questions`, `remediation_paths`.
- Lớp học: `classrooms`, `students`, `assignments`, `assignment_questions`.
- Sự kiện và kết quả: `attempts`, `diagnostic_results`, `remediation_assignments`, `demo_scenarios`.
- Vận hành: `schema_migrations`.

`attempts.event_id` là UUID unique để request retry không tạo attempt trùng. Các thao tác ghi diagnosis/remediation được đặt trong transaction.

## Diagnostic engine

Input gồm attempts, questions, misconceptions, skills và approved knowledge edges. Engine:

1. đối chiếu đáp án;
2. ánh xạ distractor sang misconception;
3. gom evidence theo skill;
4. duyệt prerequisite graph để ưu tiên nguyên nhân nền;
5. trả `diagnosed`, `mastered`, `insufficient_evidence` hoặc `outside_mvp_scope` cùng confidence và evidence.

Sau remediation, transfer endpoint cập nhật kết quả và trạng thái quay lại bài chính. Các ngưỡng trong prototype là rule có thể kiểm thử, không phải dự đoán ML.

## API contract

Tất cả endpoint trả JSON; lỗi có dạng `{ "error": "..." }`.

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET | `/api/health` | Kiểm tra app/database |
| GET | `/api/demo` | Payload lớp, học sinh, assignment và câu hỏi demo |
| POST | `/api/demo/reset` | Xóa attempt/kết quả demo và trả về trạng thái đầu |
| POST | `/api/demo/run` | Chạy ba kịch bản seed qua engine |
| POST | `/api/attempts` | Ghi attempt idempotent và tính diagnosis |
| GET | `/api/teacher/dashboard` | Tổng quan và danh sách ưu tiên của lớp demo |
| POST | `/api/remediation` | Giao remediation path cho học sinh |
| POST | `/api/transfer` | Ghi transfer result và cập nhật gap status |

Ví dụ ghi attempt:

```json
{
  "eventId": "4e18636a-f5fd-4adb-a2cc-d10f9d59a469",
  "studentId": "STUDENT_DEMO_MINH",
  "assignmentId": "ASSIGNMENT_DEMO_RATIONAL",
  "questionId": "Q.DIAG.G6.COMMON_DENOM.001",
  "optionId": "B"
}
```

Response gồm trạng thái idempotency, attempt đã lưu và diagnosis mới nhất. ID thực tế được trả từ `/api/demo`; frontend không nên tự suy đoán ID.

## Chạy và kiểm tra

```bash
bun install
bun run db:setup
bun run dev
```

`db:setup` chạy migration rồi seed. Seed từ dataset approved và từ chối dữ liệu pending/không hợp lệ.

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

## Giới hạn prototype

- Chưa có authentication/authorization production.
- Offline-after-download, sync queue và teacher override/audit đầy đủ chưa thuộc Task 2.
- Khi đổi `DATABASE_URL`, phải khởi động lại Next.js để connection pool nhận cấu hình mới.
- Dataset có vòng rà soát Toán học do AI hỗ trợ theo ủy quyền; trước khi dùng trong lớp thật vẫn cần giáo viên Toán chịu trách nhiệm nội dung xác nhận.
