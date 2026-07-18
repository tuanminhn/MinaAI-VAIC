# Kiến trúc kỹ thuật Task 2

## Trạng thái và phạm vi

Tài liệu này là nguồn triển khai hiện hành cho hackathon prototype. Phạm vi dữ liệu gồm ontology Toán lớp 6–9 theo GDPT 2018 và diagnostic tổng hợp cho học sinh lớp 9. Kiến trúc FastAPI còn xuất hiện trong PRD là định hướng cũ và không áp dụng cho prototype này.

Task 2 đã hoàn tất ở mức source code, database và kiểm thử end-to-end. Knowledge catalog hiện gồm 156 skills và 175 edges phủ yêu cầu cần đạt Toán 6–9; 43 canonical node lớp 6 có mapping tới SGK Kết nối tri thức Tập 1. Lát cắt đánh giá hiện gồm 21 misconceptions, 28 questions và 3 remediation paths, trong đó 12 câu diagnostic được giao cho học sinh lớp 9. Catalog rộng hơn question bank: một skill có mặt trong lộ trình không mặc nhiên được coi là đã có đủ bằng chứng chẩn đoán. `bun run db:setup` migrate rồi seed nội dung đã duyệt vào database cấu hình bởi `DATABASE_URL`.

## Stack

- Next.js App Router + React + TypeScript cho UI và Route Handlers.
- PostgreSQL, kết nối bằng `pg` và biến môi trường server-only `DATABASE_URL`.
- SQL migration thuần trong `db/migrations`; seed importer đọc dataset đã duyệt từ `knowledge-graph/output`.
- Diagnostic engine TypeScript thuần, deterministic, không gọi LLM.
- Lớp AI hỗ trợ mặc định gọi FPT AI Inference qua endpoint tương thích OpenAI với model `DeepSeek-V4-Flash`; provider lỗi hoặc chưa cấu hình key sẽ dùng fallback deterministic.
- Vitest cho rule engine; TypeScript, ESLint và Next production build là quality gates.

## Thành phần

```text
Student app / Teacher dashboard
            ↓ JSON
Next.js Route Handlers
            ↓
Repository + transaction boundary
       ↙          ↓             ↘
PostgreSQL    Diagnostic engine   AI support layer
                  ↓                   ↓
       approved knowledge graph + attempts
```

Trong lúc làm diagnostic, trang học sinh không hiển thị đúng/sai hoặc hint để tránh làm nhiễu bằng chứng. Sau khi đã nộp đủ và server khóa kết quả, trang hiển thị từng câu đúng/sai; câu sai có AI Answer Explanation dựa trên lời giải và misconception đã duyệt. Dashboard có AI Class Summary từ số liệu tổng hợp và AI Re-teach Plan cho nhóm theo nguyên nhân gốc; cả hai là bản nháp bắt buộc giáo viên xem trước. Socratic Hint được dành cho luồng remediation/luyện tập, chưa đưa vào question runner diagnostic.

Các trang công khai gồm trang chủ (`/`), trang giới thiệu luồng sản phẩm (`/how-it-works`), bản đồ kho tri thức (`/knowledge-base`), trải nghiệm học sinh (`/student`) và dashboard giáo viên (`/teacher`). Bản đồ kho tri thức đọc trực tiếp catalog đã duyệt, trong đó micro-skill chi tiết tham chiếu các trang yêu cầu cần đạt lớp 6–9 của Chương trình GDPT 2018 môn Toán. Chế độ mặc định là lộ trình Dagre trái sang phải và chỉ hiển thị bốn nhóm chủ đề; người dùng chủ động mở micro-skill, hoặc chọn một skill để focus vào tối đa hai tầng tiên quyết và một tầng học tiếp. Hai chế độ bổ sung là cây phân cấp có collapse/expand và bản đồ đầy đủ cho quản trị chuyên sâu. Bộ lọc hỗ trợ tên/mã, khối, chủ đề, trạng thái duyệt và loại quan hệ; panel bên phải giữ provenance cùng quan hệ trực tiếp. Trang giới thiệu trình bày vòng lặp diagnostic → root-cause evidence → quyết định của giáo viên → remediation và transfer test. Trong trải nghiệm học sinh, học sinh làm đủ câu hỏi rồi nộp cho giáo viên; giao diện chỉ xác nhận nộp thành công, còn diagnosis, evidence và hành động đề xuất được hiển thị trên dashboard giáo viên.

## Database

Migration `db/migrations/001_initial.sql` tạo các nhóm bảng; `003_expand_math_grades.sql` mở constraint nội dung và lớp học từ khối 6–7 sang 6–9, còn `004_expand_edge_relationships.sql` đồng bộ các loại quan hệ đồ thị với validator:

- Nội dung: `content_datasets`, `skills`, `knowledge_edges`, `misconceptions`, `questions`, `remediation_paths`.
- Lớp học: `classrooms`, `students`, `assignments`, `assignment_questions`.
- Sự kiện và kết quả: `attempts`, `diagnostic_results`, `remediation_assignments`, `demo_scenarios`.
- Vận hành: `schema_migrations`.

`attempts.event_id` là UUID unique để request retry không tạo attempt trùng. Các thao tác ghi diagnosis/remediation được đặt trong transaction.

Học sinh vào lớp demo bằng họ tên và số báo danh nhập tự do, không cần khớp danh sách lớp. `students.student_number` là định danh hiển thị, unique trong từng lớp; gửi lại cùng số báo danh sẽ nhận lại hồ sơ đã có và cập nhật tên thay vì tạo trùng.

## Diagnostic engine

Input gồm attempts, questions, misconceptions, skills và approved knowledge edges. Engine:

1. đối chiếu đáp án;
2. ánh xạ distractor sang misconception;
3. gom evidence theo skill;
4. duyệt prerequisite graph để ưu tiên nguyên nhân nền (gồm phân số tương đương, quy đồng và số đối);
5. trả `diagnosed`, `mastered`, `insufficient_evidence` hoặc `outside_mvp_scope` cùng confidence và evidence.

Sau remediation, transfer endpoint cập nhật kết quả và trạng thái quay lại bài chính. Các ngưỡng trong prototype là rule có thể kiểm thử, không phải dự đoán ML.

## API contract

Tất cả endpoint trả JSON; lỗi có dạng `{ "error": "..." }`.

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET | `/api/health` | Kiểm tra app/database |
| GET | `/api/demo` | Payload lớp, học sinh, assignment và câu hỏi demo |
| POST | `/api/students` | Tạo hoặc nhận diện học sinh bằng họ tên và số báo danh trong lớp demo |
| POST | `/api/demo/reset` | Xóa attempt/kết quả demo và trả về trạng thái đầu |
| POST | `/api/demo/run` | Chạy ba kịch bản seed qua engine |
| POST | `/api/attempts` | Ghi attempt idempotent và tính diagnosis |
| GET | `/api/teacher/dashboard` | Tổng quan và danh sách ưu tiên của lớp demo |
| POST | `/api/remediation` | Giao remediation path cho học sinh |
| POST | `/api/transfer` | Ghi transfer result và cập nhật gap status |
| POST | `/api/ai/explanation` | Giải thích câu sai sau khi xác minh học sinh đã nộp đủ bài, không đưa PII vào prompt |
| POST | `/api/ai/class-summary` | Tóm tắt lớp từ dữ liệu tổng hợp đã khử định danh |
| POST | `/api/ai/reteach-plan` | Soạn bản nháp dạy lại 10–30 phút cho một nhóm root-cause skill |

Ba API AI chỉ đọc câu hỏi, lời giải, skill, misconception trạng thái `approved`, lựa chọn đã khóa hoặc số liệu nhóm. `studentId` chỉ dùng phía server để xác minh attempt; tên, số báo danh, student ID và class code không đi vào prompt. Output LLM phải qua schema validator và citation allowlist; lỗi cấu hình, timeout, provider hoặc schema đều trả fallback deterministic cùng metadata `ai.mode`, không trả `null`. Diagnosis vẫn chạy độc lập và không gọi LLM.

Biến cấu hình server-only: `LLM_ENABLED`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_TIMEOUT_MS`, `LLM_MAX_TOKENS`, `LLM_MAX_RETRIES`. Giá trị mặc định FPT là base URL `https://mkp-api.fptcloud.com`, model `DeepSeek-V4-Flash`, timeout 30 giây, tối đa 1600 output token và retry một lần cho lỗi 429/5xx. Request thực tế được gửi tới `/chat/completions` bằng Bearer authentication và không stream. Không có key trong repository; `.env` bị gitignore.

Ví dụ ghi attempt:

```json
{
  "eventId": "4e18636a-f5fd-4adb-a2cc-d10f9d59a469",
  "studentId": "STUDENT_DEMO_MINH",
  "assignmentId": "ASSIGNMENT_DEMO_G9",
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
- AI output hiện chưa lưu lịch sử prompt/output, chưa có bộ eval sư phạm hoặc workflow phê duyệt bền vững; nhãn “cần giáo viên duyệt” là rào chắn UI của prototype.
- Khi đổi `DATABASE_URL`, phải khởi động lại Next.js để connection pool nhận cấu hình mới.
- Production build không mở kết nối database và có thể chạy khi chưa inject `DATABASE_URL`; biến này vẫn bắt buộc ở runtime khi API thực hiện thao tác database.
- Dataset có vòng rà soát Toán học do AI hỗ trợ theo ủy quyền; trước khi dùng trong lớp thật vẫn cần giáo viên Toán chịu trách nhiệm nội dung xác nhận.
