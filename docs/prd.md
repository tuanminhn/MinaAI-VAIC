# PRD v1.2 — Mina AI

> **Trạng thái:** Review — định hướng sản phẩm và kiến trúc, chưa phải đặc tả triển khai hoàn chỉnh.
>
> **Cập nhật:** 2026-07-18
>
> **Tài liệu nghiệm thu:** [MVP Spec](/docs/mvp-spec.md)
>
> **Yêu cầu an toàn/kỹ thuật:** [Non-functional Requirements](/docs/non-functional-requirements.md)
>
> **Quyết định còn mở:** [Product Decisions](/docs/product-decisions.md)

## Cách sử dụng tài liệu

PRD mô tả **vì sao, cho ai và sản phẩm cần đạt outcome gì**. Các stack/provider/latency trong tài liệu là định hướng để ước lượng và thảo luận; chỉ trở thành quyết định đóng băng sau khi câu hỏi P0 được xác nhận và có ADR kỹ thuật. Khi PRD xung đột với acceptance criteria chi tiết, phải dừng và đồng bộ tài liệu thay vì tự chọn một phiên bản.

## 1. Tên dự án

**Mina AI**

## 2. One-liner

**Mina AI là co-teacher AI cho giáo viên Việt Nam, giúp phát hiện nguyên nhân gốc của lỗi sai, chia nhóm học sinh theo nhu cầu, gợi ý ai cần hỗ trợ trước và tạo lộ trình bù hổng cá nhân hóa để học sinh quay lại được bài học hiện tại.**

---

# 3. Tóm tắt sản phẩm

Mina AI là một hệ thống web dành cho giáo viên và học sinh trong lớp học phổ thông Việt Nam, đặc biệt tập trung vào lớp học đông, học sinh chênh lệch trình độ mạnh.

Sản phẩm không chỉ chấm đúng/sai. Khi học sinh làm sai một bài Toán lớp 7, Mina AI sẽ truy ngược theo đồ thị kiến thức để phát hiện nguyên nhân gốc, ví dụ: học sinh sai phương trình vì hổng quy đồng phân số từ lớp trước.

Giáo viên không chỉ nhận báo cáo điểm số, mà nhận được dashboard hành động:

```text
Ai cần giúp trước?
Vì sao em đó đang mắc kẹt?
Nên giao bài bù, kèm nhóm nhỏ hay dạy lại cả lớp?
```

Khoảng trống thị trường trong tài liệu nghiên cứu là chưa có sản phẩm nào đồng thời mạnh ở 4 lớp: chẩn đoán nguyên nhân gốc, lộ trình bù hổng cá nhân hóa, dashboard giáo viên để can thiệp, và vận hành tốt trong điều kiện offline/low-bandwidth tại Việt Nam.

---

# 4. Vấn đề

## 4.1. Problem statement

Trong một lớp 35–45 học sinh, giáo viên không có đủ thời gian và dữ liệu để biết từng học sinh đang hổng kiến thức nền nào.

Ví dụ:

```text
Bài hiện tại:
x + 3/4 = 5/6

Học sinh làm sai.
```

Một app học tập thông thường kết luận:

```text
Học sinh yếu phần phương trình.
```

Mina AI cần kết luận:

```text
Học sinh không giải được phương trình vì chưa thành thạo trừ phân số khác mẫu.
Nguyên nhân sâu hơn: chưa biết quy đồng phân số.
Độ tin cậy: 82%.
Đề xuất: giao gói bù “Quy đồng phân số cơ bản” trong 10 phút, sau đó quay lại bài phương trình.
```

## 4.2. Pain points của giáo viên

| Pain point                            | Mô tả                                                     |
| ------------------------------------- | --------------------------------------------------------- |
| Không biết học sinh hổng từ đâu       | Điểm thấp không cho biết nguyên nhân gốc                  |
| Không đủ thời gian soi từng học sinh  | Một giáo viên khó phân tích 40 học sinh thủ công          |
| Chia nhóm theo cảm tính               | Thường chia theo điểm, không theo nguyên nhân             |
| Không biết nên giúp ai trước          | Nhiều học sinh yếu nhưng mức ưu tiên khác nhau            |
| Không biết khi nào nên dạy lại cả lớp | Một lỗi có thể là lỗi cá nhân hoặc misconception toàn lớp |
| Dashboard hiện tại ít hành động       | Nhiều báo cáo nhưng không chỉ rõ bước tiếp theo           |

## 4.3. Pain points của học sinh

| Nhóm học sinh                    | Pain                                         |
| -------------------------------- | -------------------------------------------- |
| Học sinh hổng nền                | Bị giao bài hiện tại quá khó                 |
| Học sinh yếu                     | Làm sai liên tục, mất tự tin                 |
| Học sinh khá giỏi                | Bị giữ lại theo nhịp chung                   |
| Học sinh vùng khó                | Mạng yếu, thiết bị cũ                        |
| Học sinh không thích bị gắn nhãn | Không muốn bị gọi là “mất gốc”, “yếu”, “kém” |

---

# 5. Mục tiêu kinh doanh

## 5.1. Mục tiêu 12 tháng

| Mục tiêu                      | Kết quả kỳ vọng                                                    |
| ----------------------------- | ------------------------------------------------------------------ |
| Chứng minh nhu cầu thật       | Giáo viên dùng dashboard hằng tuần                                 |
| Chứng minh hiệu quả học tập   | Học sinh đóng được lỗ hổng và quay lại bài chính                   |
| Chứng minh willingness to pay | Có trường/giáo viên trả phí sau pilot                              |
| Tạo moat dữ liệu              | Tích lũy knowledge graph, misconception data, intervention outcome |
| Mở rộng sản phẩm              | Từ Toán lớp 7–8 Kết nối tri thức sang khối/bộ sách khác sau MVP     |

## 5.2. Revenue model đề xuất

| Gói                     | Đối tượng                       | Cách tính phí                |
| ----------------------- | ------------------------------- | ---------------------------- |
| Teacher Pro             | Giáo viên cá nhân               | Theo tháng/năm               |
| Class Plan              | Một lớp học                     | Theo lớp/năm học             |
| School Plan             | Trường/tổ chuyên môn            | Theo số học sinh hoặc số lớp |
| Offline Deployment Plan | Trường vùng khó/tổ chức tài trợ | Phí triển khai + bảo trì     |

## 5.3. Chiến lược bán ban đầu

Giai đoạn đầu không nên bán đại trà B2C. Nên đi theo:

```text
Pilot với giáo viên Toán
→ Chứng minh workflow và learning outcome
→ Mở rộng theo tổ chuyên môn
→ Bán gói trường học
```

---

# 6. Chân dung người dùng

## 6.1. Persona 1 — Giáo viên Toán lớp 7

**Tên:** Cô Lan
**Vai trò:** Giáo viên Toán THCS
**Lớp:** 7A, 42 học sinh
**Pain:** Cô biết nhiều em yếu nhưng không biết yếu từ đâu.
**Mục tiêu:** Biết ai cần hỗ trợ trước, chia nhóm chính xác, giao bài đúng lỗ hổng.
**Mina AI giúp gì:** Cô mở dashboard và thấy nhóm hổng quy đồng, nhóm nhầm dấu số âm, nhóm cần bài nâng cao.

## 6.2. Persona 2 — Học sinh hổng nền

**Tên:** Minh
**Lớp:** 7
**Tình trạng:** Đang học phương trình nhưng yếu phân số.
**Pain:** Làm bài mới liên tục sai.
**Mục tiêu:** Được quay lại đúng kỹ năng nền cần bù, không phải học lại cả chương.
**Mina AI giúp gì:** Minh được luyện quy đồng 10 phút rồi quay lại bài phương trình.

## 6.3. Persona 3 — Học sinh khá giỏi

**Tên:** An
**Lớp:** 7
**Tình trạng:** Hoàn thành bài nhanh.
**Pain:** Chán vì phải chờ cả lớp.
**Mục tiêu:** Có bài nâng cao phù hợp.
**Mina AI giúp gì:** Hệ thống nhận diện An đã thành thạo và giao bài thử thách.

## 6.4. Persona 4 — Tổ trưởng chuyên môn

**Tên:** Thầy Hùng
**Vai trò:** Tổ trưởng Toán
**Pain:** Không biết lớp nào đang hổng chủ đề nào.
**Mục tiêu:** Có bản đồ lỗ hổng theo lớp/khối.
**Mina AI giúp gì:** Xem báo cáo lớp 7A, 7B, 7C để lên kế hoạch dạy lại hoặc phụ đạo.

## 6.5. Persona 5 — Quản lý trường

**Tên:** Cô Mai
**Vai trò:** Phó hiệu trưởng chuyên môn
**Pain:** Muốn cải thiện chất lượng nhưng thiếu dữ liệu chi tiết.
**Mục tiêu:** Biết việc phụ đạo có hiệu quả hay không.
**Mina AI giúp gì:** Theo dõi gap closure rate, transfer success, lớp nào cải thiện.

---

# 7. Chiến lược sản phẩm theo Day 16

## 7.1. Idea

Lớp học Việt Nam có ability gap lớn. Học sinh sai bài hiện tại thường vì hổng kiến thức nền từ lớp trước.

## 7.2. Customer

Customer đầu tiên:

```text
Giáo viên Toán lớp 7–8 dạy bộ Kết nối tri thức, có lớp đông và nhiều học sinh chênh lệch trình độ.
```

Không chọn toàn bộ học sinh K–12 ngay từ đầu vì scope quá rộng.

## 7.3. Need

Need thật:

```text
Giáo viên cần biết ai cần giúp trước, vì sao, và giúp bằng cách nào.
```

Không phải:

```text
Giáo viên cần thêm một app AI.
```

## 7.4. Strategy

Beachhead:

```text
Toán lớp 7–8, bộ Kết nối tri thức với cuộc sống
Cụm kiến thức đầu tiên: một chuỗi prerequisite liên thông giữa hai khối, chờ chốt tại Q-003
```

Lý do:

- Dependency rõ.
- Root-cause dễ chứng minh.
- Giáo viên đau thật.
- Có thể làm MVP nhỏ nhưng có giá trị.

## 7.5. Moat

Moat không phải là chatbot hay số lượng bài tập.

Moat của Mina AI:

```text
Localized Knowledge Graph
+ Vietnamese Misconception Ontology
+ Teacher Intervention Outcome Data
+ Offline/Low-bandwidth Know-how
+ Embedded Teacher Workflow
```

---

# 8. Phạm vi MVP

## 8.1. In scope

| Nhóm                 | Scope MVP                                                    |
| -------------------- | ------------------------------------------------------------ |
| Môn học              | Toán                                                         |
| Bộ sách              | Kết nối tri thức với cuộc sống                               |
| Khối chính           | Lớp 7 và lớp 8                                               |
| Kiến thức truy ngược | Chỉ các skill đã duyệt trong dataset Toán 7–8                |
| Chủ đề               | Theo SGK Toán 7–8 Kết nối tri thức; thứ tự ingest theo Q-003 |
| Người dùng           | Giáo viên + học sinh                                         |
| Nền tảng             | Web app + PWA                                                |
| FE deploy            | Vercel                                                       |
| BE deploy            | VPS hoặc Render                                              |
| AI Service deploy    | VPS hoặc Render                                              |
| AI provider          | FPT Cloud primary, OpenRouter fallback                       |
| Trace AI             | LangGraph + LangSmith                                        |
| Offline              | Student PWA cache, local attempt storage, sync sau           |

## 8.2. Out of scope MVP

Không làm trong MVP:

- Tất cả môn học.
- Toán toàn bộ lớp 1–12.
- Dữ liệu từ bộ Cánh diều, Chân trời sáng tạo hoặc bộ sách khác.
- Dữ liệu môn khác hoặc khối ngoài lớp 7–8.
- Chatbot tự do cho học sinh.
- Video bài giảng dài.
- Livestream.
- Gamification phức tạp.
- Parent app đầy đủ.
- Chấm tự luận viết tay.
- Dashboard cấp Sở/Phòng.
- AI tự sinh nội dung rồi phát hành không kiểm duyệt.

---

# 9. Tính năng cốt lõi

## 9.1. Knowledge Graph GDPT 2018

Mina AI chia kiến thức thành micro-skill và nối bằng quan hệ prerequisite.

**Giới hạn bộ sách trong MVP:**
MVP chỉ ingest và phục vụ dữ liệu **Kết nối tri thức với cuộc sống, môn Toán lớp 7–8**. Knowledge Graph vẫn dùng canonical skill để có thể mở rộng về sau, nhưng curriculum mapping trong MVP chỉ có Kết nối tri thức. Giao diện không cho chọn Cánh diều, Chân trời sáng tạo, môn khác hoặc khối khác. Việc hỗ trợ đa bộ sách là hậu MVP.

Ví dụ:

```text
Bội chung
→ Mẫu số chung
→ Quy đồng phân số
→ Cộng/trừ phân số khác mẫu
→ Số hữu tỉ
→ Phương trình chứa phân số
```

Mỗi skill có:

- Skill ID.
- Tên kỹ năng.
- Lớp.
- Chủ đề.
- Chuẩn GDPT 2018.
- **SGK Mapping Metadata** (vị trí bài học trong Toán 7–8 Kết nối tri thức; các bộ khác ngoài MVP).
- Prerequisite skills.
- Dependent skills.
- Misconception thường gặp.
- Câu hỏi diagnostic.
- Câu luyện remediation.
- Transfer test.
- Mastery threshold.

## 9.2. Root-cause Diagnostic Engine

Engine xác định nguyên nhân gốc dựa trên:

- Câu trả lời đúng/sai.
- Dạng đáp án sai.
- Thời gian làm.
- Số lần thử lại.
- Hint usage.
- Skill graph.
- Misconception mapping.
- Confidence score.

Output mẫu:

```text
Root-cause gap: Quy đồng phân số
Confidence: 82%
Evidence:
- Sai 4/5 câu khác mẫu
- Làm đúng 3/3 câu cùng mẫu
- Chọn mẫu chung bằng tổng hai mẫu
Recommended action: Gói bù 10 phút + transfer test
```

## 9.3. Repair and Return Learning Path

Luồng bù hổng:

```text
Sai bài hiện tại
→ Truy ngược prerequisite
→ Xác nhận gap
→ Bù hổng 5–15 phút
→ Transfer test
→ Quay lại bài hiện tại
```

Nguyên tắc:

- Không học lại cả chương.
- Không kẹt vô hạn trong remedial path.
- Luôn quay lại skill hiện tại sau khi bù.

## 9.4. Teacher Intervention Dashboard

Dashboard trả lời:

```text
Hôm nay cần giúp ai trước?
```

Màn hình chính gồm:

| Học sinh | Root-cause gap   | Ưu tiên | Hành động         |
| -------- | ---------------- | ------: | ----------------- |
| Minh     | Quy đồng phân số |     Cao | Kèm trực tiếp     |
| Lan      | Nhầm dấu số âm   |     Cao | Giao gói bù       |
| An       | Đã thành thạo    |    Thấp | Giao bài nâng cao |

Tính năng:

- Priority list.
- Auto grouping.
- Evidence view.
- One-click assignment.
- Intervention log.
- Before/after result.

## 9.5. Auto Grouping

Không chia theo điểm, mà chia theo nguyên nhân:

```text
Nhóm A: Hổng quy đồng phân số
Nhóm B: Nhầm dấu số âm
Nhóm C: Đúng nhưng thao tác chậm
Nhóm D: Đã thành thạo, cần thử thách
Nhóm E: Chưa đủ dữ liệu
```

## 9.6. Class-wide Gap Detection

Khi nhiều học sinh sai cùng dạng:

```text
45% lớp đang nhầm quy tắc cộng hai số âm.
Kiểu sai phổ biến: lấy hiệu hai giá trị tuyệt đối.
Đề xuất: dạy lại nhanh 8 phút + exit ticket 3 câu.
```

## 9.7. Offline / Low-bandwidth

Student PWA cần:

- Tải content pack (chứa metadata câu hỏi, đáp án gây nhiễu, và gợi ý).
- Làm bài offline.
- **Chẩn đoán cục bộ (Local Diagnostic Engine):** Sử dụng một Rule-based Engine gọn nhẹ viết bằng JS/TS để chạy thuật toán duyệt đồ thị kiến thức cục bộ ngay trên PWA, chấm bài và điều hướng học sinh sang remedial path phù hợp mà không cần kết nối mạng.
- Chấm cơ bản local.
- Lưu attempt local.
- Lưu hint usage.
- Sync khi có mạng.
- Không mất dữ liệu nếu mất mạng giữa chừng.

---

# 10. Luồng trải nghiệm người dùng

## 10.1. Flow 1 — Giáo viên tạo lớp và giao diagnostic

```text
Giáo viên đăng nhập
→ Tạo lớp (bộ sách cố định: Kết nối tri thức)
→ Chọn khối 7 hoặc lớp 8
→ Thêm học sinh bằng cách import file xuất từ VnEdu/SMAS/CSDL Ngành hoặc chia sẻ mã lớp
→ Chọn chủ đề “Số hữu tỉ và phương trình”
→ Hệ thống dùng phạm vi truy ngược đã duyệt trong dataset Toán 7–8
→ Giao diagnostic 15 phút
→ Học sinh nhận nhiệm vụ
```

Output cho giáo viên:

```text
7 học sinh cần hỗ trợ khẩn cấp
12 học sinh cần củng cố
15 học sinh đúng nhịp
6 học sinh cần thử thách
42% lớp có dấu hiệu hổng quy đồng phân số
```

## 10.2. Flow 2 — Học sinh làm bài và được chẩn đoán

```text
Học sinh mở PWA
→ Nhập mã lớp
→ Chọn tên
→ Làm diagnostic
→ Sai bài phương trình chứa phân số
→ Hệ thống hỏi câu prerequisite
→ Xác nhận hổng quy đồng
→ Giao gói bù 10 phút
→ Làm transfer test
→ Quay lại bài chính
```

## 10.3. Flow 3 — Giáo viên xử lý nhóm cần hỗ trợ

```text
Giáo viên mở dashboard
→ Xem “Hôm nay cần giúp ai?”
→ Chọn nhóm “Hổng quy đồng phân số”
→ Xem evidence
→ Chọn hành động: kèm nhóm 8 phút
→ Giao exit ticket
→ Xem kết quả sau can thiệp
```

Output:

```text
Nhóm Quy đồng phân số:
5 học sinh
4/5 vượt transfer test sau can thiệp
1 học sinh cần hỗ trợ tiếp
```

## 10.4. Flow 4 — Phát hiện lỗ hổng toàn lớp

```text
Nhiều học sinh sai cùng dạng
→ Hệ thống gom mẫu sai
→ Phát hiện misconception chung
→ Cảnh báo giáo viên
→ Giáo viên dạy lại 8 phút
→ Giao exit ticket
→ Dashboard cập nhật kết quả
```

## 10.5. Flow 5 — Offline learning và sync

```text
Giáo viên/học sinh tải content pack khi có mạng
→ Học sinh làm bài khi mất mạng
→ Dữ liệu lưu IndexedDB local
→ Khi có mạng, app sync metadata lên backend
→ Backend cập nhật dashboard
→ AI Service xử lý diagnostic nâng cao nếu cần
```

---

# 11. Tech stack hệ thống

## 11.1. Tổng quan 3 khối

```text
Frontend React
    ↓
Backend FastAPI
    ↓
AI Service FastAPI + LangGraph
    ↓
LLM Provider Router
    ├── FPT Cloud: https://mkp-api.fptcloud.com
    └── OpenRouter fallback
```

---

# 12. Frontend

## 12.1. Stack

```text
React
TypeScript
Vite hoặc Next.js
TailwindCSS
shadcn/ui
TanStack Query
Zustand
IndexedDB + Dexie.js
Recharts hoặc ECharts
PWA
Deploy: Vercel
```

## 12.2. Lý do chọn React + Vercel

- React phù hợp dashboard giáo viên và PWA học sinh.
- Vercel giúp deploy FE nhanh, CI/CD đơn giản.
- Tách FE khỏi BE/AI để scale và deploy độc lập.
- FE có thể cache static assets và content pack nhẹ.

## 12.3. FE apps

MVP có thể dùng một codebase React nhưng chia route:

```text
/teacher
/student
/admin
```

Hoặc tách thành 2 app sau này:

```text
teacher.mina.ai
student.mina.ai
```

## 12.4. Offline ở FE

Student PWA dùng:

```text
Service Worker
IndexedDB
Dexie.js
Sync Queue
Content Pack Cache
Local Rule-based Diagnostic Engine
```

Local lưu:

- Assignment & Graph Metadata.
- Questions.
- Answer options & Misconception maps.
- Hint content.
- Attempts.
- Sync status.

---

# 13. Backend FastAPI

## 13.1. Stack

```text
Python 3.11+
FastAPI
PostgreSQL
SQLAlchemy 2.0
Alembic
Redis
Celery hoặc RQ
S3-compatible storage: Cloudflare R2 / MinIO / S3
JWT Auth
Docker
Deploy: VPS hoặc Render
Monitoring: Sentry + OpenTelemetry
Product analytics: PostHog
```

## 13.2. Vai trò Backend

Backend xử lý nghiệp vụ chính:

```text
User
Teacher
Student
Classroom
Skill
Question
Assignment
Attempt
DiagnosticResult
RemediationPath
TeacherIntervention
Report
SyncEvent
```

## 13.3. Backend modules

| Module             | Vai trò                                     |
| ------------------ | ------------------------------------------- |
| Auth Service       | Đăng nhập, role, permission                 |
| Classroom Service  | Tạo lớp, mã lớp, danh sách học sinh         |
| Content Service    | Skill, question, remediation, transfer test |
| Assignment Service | Giao diagnostic, bài luyện, exit ticket     |
| Attempt Service    | Lưu bài làm, thời gian, hint usage          |
| Sync Service       | Nhận event offline từ FE                    |
| Reporting Service  | Dashboard, KPIs, before/after               |
| AI Gateway Client  | Gọi AI Service nội bộ                       |
| Admin CMS          | Quản lý học liệu và kiểm duyệt              |

## 13.4. Deploy BE

### Option A — Render

Phù hợp MVP vì:

- Deploy nhanh.
- Ít vận hành.
- Có managed Postgres/Redis nếu cần.
- Dễ preview/staging.

### Option B — VPS

Phù hợp khi muốn:

- Giảm chi phí dài hạn.
- Kiểm soát network.
- Giảm cold start.
- Chạy AI Service cùng region/machine để giảm latency.
- Chủ động cấu hình worker, cache, Nginx.

### Khuyến nghị

MVP ban đầu:

```text
FE: Vercel
BE: Render hoặc VPS
AI Service: VPS ưu tiên nếu cần latency thấp
DB: Managed Postgres hoặc Postgres trên VPS nếu team đủ vận hành
```

Nếu mục tiêu latency AI thấp nhất, nên đặt:

```text
Backend và AI Service cùng VPS hoặc cùng private network.
```

---

# 14. AI Service FastAPI

## 14.1. Stack

```text
Python 3.11+
FastAPI
LangGraph
LangSmith
Pydantic
httpx async
PostgreSQL + pgvector
Redis cache
Provider Router: FPT + OpenRouter
Deploy: VPS hoặc Render
```

## 14.2. Vai trò AI Service

AI Service xử lý:

```text
Root-cause diagnostic
RAG Tutor / Teacher Assistant
Teacher summary
Remediation recommendation
Citation validation
LLM judge
Guardrails
Trace logging
```

Quan trọng: **LLM không phải lõi chẩn đoán duy nhất**.

Lõi chẩn đoán nên là:

```text
Knowledge Graph
+ Rule-based scoring
+ Misconception mapping
+ Attempt evidence
+ Confidence score
```

LLM dùng để:

- Giải thích cho giáo viên.
- Tóm tắt bằng chứng.
- Sinh gợi ý từng bước.
- Viết hướng dẫn dạy lại.
- Hỗ trợ content draft có kiểm duyệt.

---

# 15. Kiến trúc AI Service

Mina AI nên có 2 pipeline chính:

```text
1. Learning Diagnostic Pipeline
2. RAG Tutor / Teacher Assistant Pipeline
```

---

## 15.1. Pipeline 1 — Learning Diagnostic Pipeline

Dùng khi học sinh làm bài, hệ thống cần tìm nguyên nhân gốc.

```text
Student Attempt
     ↓
Attempt Normalizer
     ↓
Skill Mapper
     ↓
Misconception Detector
     ↓
Prerequisite Graph Traversal
     ↓
Confidence Scoring
     ↓
Diagnostic Decision
     ↓
Remediation Path Selector
     ↓
Transfer Test Selector
     ↓
Teacher Evidence Builder
     ↓
Save Diagnostic Result
```

### Mục tiêu latency

Pipeline này phải cực nhanh.

Mục tiêu MVP:

```text
p50 < 300ms nếu không gọi LLM
p95 < 800ms nếu không gọi LLM
```

Chỉ gọi LLM khi cần tạo explanation dài hoặc teacher summary.

---

## 15.2. Pipeline 2 — RAG Tutor / Teacher Assistant Pipeline

Dùng cho:

- Học sinh hỏi gợi ý.
- Giáo viên hỏi vì sao hệ thống chẩn đoán như vậy.
- Giáo viên yêu cầu hoạt động dạy lại.
- Hệ thống tạo summary lớp.

Pipeline đề xuất:

```text
User Question
     ↓
Request Classifier
     ↓
FAQ Cache
     ↓
Input Guardrail
     ↓
Intent Detection
     ↓
Query Rewrite
     ↓
Metadata Filter
     ↓
Hybrid Retrieval
     ↓
Rerank
     ↓
Context Builder
     ↓
Prompt Builder
     ↓
LLM Provider Router
     ↓
Citation Validator
     ↓
Groundedness Judge
     ↓
Pedagogy Judge
     ↓
Output Guardrail
     ↓
Trace Logger
     ↓
User
```

---

# 16. AI latency optimization

Vì yêu cầu AI tối ưu latency, thiết kế cần chia request thành 3 cấp.

## 16.1. Cấp 1 — Không gọi LLM

Dùng cho diagnostic realtime.

```text
Attempt scoring
Skill state update
Misconception rule matching
Prerequisite traversal
Remediation selection
```

Mục tiêu:

```text
p50 < 300ms
p95 < 800ms
```

## 16.2. Cấp 2 — Gọi LLM nhỏ, có cache

Dùng cho:

- Gợi ý học sinh.
- Giải thích ngắn.
- Rewrite query.
- Classify intent.

Tối ưu:

```text
Redis cache
Short prompt
Low max_tokens
Async httpx
Provider timeout 8–12s
Streaming nếu cần
```

Mục tiêu:

```text
p50 < 2.5s
p95 < 6s
```

## 16.3. Cấp 3 — Gọi LLM mạnh, chạy async

Dùng cho:

- Teacher weekly summary.
- Lesson re-teach plan.
- LLM Judge nâng cao.
- Content draft.

Không chặn UI. Chạy background job:

```text
User bấm tạo summary
→ BE trả trạng thái “đang tạo”
→ Worker gọi AI
→ FE poll hoặc nhận realtime update
```

Mục tiêu:

```text
p50 < 8s
p95 < 20s
```

## 16.4. Các kỹ thuật tối ưu latency bắt buộc

| Kỹ thuật                        | Cách dùng                                      |
| ------------------------------- | ---------------------------------------------- |
| Provider router                 | FPT primary, OpenRouter fallback               |
| Timeout ngắn                    | Không để request treo quá lâu                  |
| Async calls                     | Dùng httpx async                               |
| Redis cache                     | Cache FAQ, hint, explanation, retrieval result |
| Prompt ngắn                     | Không nhét quá nhiều context                   |
| Metadata filter trước retrieval | Giảm search space                              |
| Rerank nhẹ                      | Rule-based trước, LLM rerank sau               |
| No-LLM diagnostic               | Chẩn đoán realtime không phụ thuộc LLM         |
| Background jobs                 | Summary/judge nặng chạy async                  |
| Streaming                       | Dùng cho câu trả lời dài                       |
| Same region deployment          | BE và AI Service đặt cùng VPS/region           |

---

# 17. LLM Provider Router

## 17.1. Provider chính

```text
FPT Cloud
Base URL: https://mkp-api.fptcloud.com
```

## 17.2. Provider fallback

```text
OpenRouter
```

## 17.3. Routing logic

```text
Student hint tiếng Việt
→ ưu tiên FPT

Teacher summary tiếng Việt
→ ưu tiên FPT

FPT timeout/rate limit/5xx
→ fallback OpenRouter

Judge/rerank nhẹ
→ có thể dùng model rẻ qua OpenRouter

Request cần reasoning cao
→ dùng model mạnh hơn qua OpenRouter nếu cần
```

## 17.4. Config môi trường

```env
LLM_PRIMARY_PROVIDER=fpt
FPT_BASE_URL=https://mkp-api.fptcloud.com
FPT_API_KEY=...

OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=...

LLM_TIMEOUT_SECONDS=12
LLM_MAX_RETRIES=1
LLM_FALLBACK_ENABLED=true
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=mina-ai-prod
```

---

# 18. LangGraph + LangSmith trace

## 18.1. Mục tiêu trace

Mỗi request AI phải biết:

```text
Ai gọi?
Intent gì?
Retrieved docs nào?
Prompt gì?
Provider nào?
Model nào?
Latency bao nhiêu?
Fallback có dùng không?
Output có pass guardrail không?
Judge score bao nhiêu?
User có hài lòng không?
```

## 18.2. Trace metadata bắt buộc

```json
{
  "request_id": "REQ_001",
  "user_role": "teacher",
  "class_id": "C7A",
  "student_id": "S001",
  "intent": "explain_diagnosis",
  "provider": "fpt",
  "model": "selected_model",
  "latency_ms": 1420,
  "fallback_used": false,
  "groundedness_score": 0.91,
  "pedagogy_score": 0.88
}
```

## 18.3. LangSmith projects

```text
mina-ai-dev
mina-ai-staging
mina-ai-prod
mina-ai-evals
```

## 18.4. Log nội bộ ngoài LangSmith

Ngoài LangSmith, hệ thống vẫn cần bảng log nội bộ:

```text
ai_request_logs
ai_provider_logs
ai_guardrail_logs
ai_judge_logs
ai_feedback_logs
```

Lý do: LangSmith dùng debug/eval, còn database nội bộ dùng audit, KPI và sản phẩm.

---

# 19. Guardrails AI

## 19.1. Input guardrail

Chặn:

- Prompt injection.
- Yêu cầu lộ system prompt.
- Hỏi ngoài phạm vi học tập.
- Hỏi đáp án trực tiếp khi đang làm bài.
- Nội dung không phù hợp học sinh.
- Dữ liệu cá nhân nhạy cảm.

## 19.2. Output guardrail

Chặn hoặc sửa:

- Đưa đáp án trực tiếp.
- Hallucination.
- Nội dung không bám học liệu.
- Dán nhãn học sinh là “yếu”, “kém”, “mất gốc”.
- Lộ dữ liệu học sinh khác.
- Giải thích quá dài hoặc quá khó.

## 19.3. Pedagogy guardrail

Với học sinh:

```text
Không đưa đáp án ngay.
Gợi ý từng bước.
Ngôn ngữ đơn giản.
Không tạo cảm giác bị đánh giá.
Luôn quay lại mục tiêu học tập.
Ngăn ngừa Stigma: Giao diện khi điều hướng sang remedial path phải dùng thuật ngữ trung tính,
tập trung vào kỹ năng luyện tập (ví dụ: "Luyện tập: Quy đồng mẫu số") thay vì hiển thị lớp học/khối của kỹ năng đó (ví dụ: "Học lại bài lớp 5").
```

Với giáo viên:

```text
Nói rõ evidence.
Nói rõ confidence.
Đề xuất hành động cụ thể.
Nêu giới hạn nếu chưa đủ dữ liệu.
```

---

# 20. Database chính

## 20.1. PostgreSQL tables

```text
users
teachers
students
schools
classrooms
classroom_students
skills
knowledge_edges
questions
answer_options
misconceptions
assignments
assignment_items
attempts
student_skill_states
diagnostic_results
remediation_paths
remediation_items
transfer_tests
teacher_interventions
sync_events
ai_request_logs
ai_feedback_logs
```

## 20.2. Vector store MVP

Dùng:

```text
PostgreSQL + pgvector
```

Tables:

```text
content_chunks
skill_explanations
teacher_guides
faq_chunks
misconception_explanations
```

Metadata:

```json
{
  "subject": "math",
  "grade": 7,
  "skill_id": "MATH_FRAC_005",
  "curriculum": "GDPT_2018",
  "content_type": "explanation",
  "approved": true,
  "version": "v1"
}
```

---

# 21. API endpoints chính

## 21.1. Backend API

```http
POST /auth/login
POST /classes
GET /classes/{class_id}
POST /classes/{class_id}/students/import
POST /assignments/diagnostic
POST /attempts
POST /sync/events
GET /dashboard/classes/{class_id}
GET /dashboard/classes/{class_id}/priority
GET /dashboard/classes/{class_id}/groups
POST /assignments/group
POST /teacher-interventions
GET /reports/class/{class_id}
```

## 21.2. AI Service API

```http
POST /ai/diagnose-attempt
POST /ai/recommend-remediation
POST /ai/chat
POST /ai/teacher-summary
POST /ai/class-wide-gap
POST /ai/validate-output
GET /ai/traces/{request_id}
```

---

# 22. Kiến trúc triển khai

## 22.1. MVP deployment

```text
Frontend React
→ Vercel

Backend FastAPI
→ VPS hoặc Render

AI Service FastAPI
→ VPS hoặc Render

PostgreSQL
→ Managed Postgres hoặc VPS Postgres

Redis
→ Redis Cloud / Upstash / VPS Redis

Object Storage
→ Cloudflare R2 / S3 / MinIO

Tracing
→ LangSmith

Monitoring
→ Sentry + OpenTelemetry
```

## 22.2. Khuyến nghị triển khai tối ưu latency

Nếu ưu tiên latency AI:

```text
FE: Vercel
BE: VPS
AI Service: cùng VPS hoặc cùng region với BE
PostgreSQL: cùng region
Redis: cùng region
```

Topology đề xuất:

```text
Vercel FE
   ↓ HTTPS
Nginx trên VPS
   ├── /api → Backend FastAPI
   └── /ai  → AI Service FastAPI
        ↓
PostgreSQL + Redis cùng VPS hoặc cùng region
        ↓
External LLM Provider
   ├── FPT Cloud
   └── OpenRouter
```

## 22.3. Sơ đồ kiến trúc đầy đủ

```text
┌─────────────────────────┐
│ React Frontend on Vercel │
│ Teacher Web + Student PWA│
└────────────┬────────────┘
             │ HTTPS
             ▼
┌─────────────────────────┐
│ Nginx / API Gateway VPS │
└───────┬─────────┬───────┘
        │         │
        ▼         ▼
┌──────────────┐  ┌────────────────────┐
│ Backend API  │  │ AI Service API      │
│ FastAPI      │  │ FastAPI + LangGraph │
└──────┬───────┘  └─────────┬──────────┘
       │                    │
       ▼                    ▼
┌──────────────┐   ┌───────────────────┐
│ PostgreSQL   │   │ LangSmith Tracing │
│ + pgvector   │   └───────────────────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Redis Cache  │
└──────────────┘

AI Service Provider Router:
        ├── FPT Cloud: https://mkp-api.fptcloud.com
        └── OpenRouter fallback
```

---

# 23. KPIs và tiêu chí thành công

## 23.1. North Star Metric

**Gap Closure Rate**

```text
Số prerequisite gaps được đóng và vượt transfer test
/
Tổng số prerequisite gaps đã được xác nhận
```

Một gap chỉ được xem là closed nếu:

1. Học sinh hoàn thành remediation.
2. Vượt transfer test quay lại skill hiện tại.
3. Không sai lại trong retention check gần nhất.

## 23.2. Product KPIs

| KPI                           |    Mục tiêu MVP |
| ----------------------------- | --------------: |
| Teacher onboarding completion |           ≥ 80% |
| Student join rate             |           ≥ 70% |
| Diagnostic completion rate    |           ≥ 60% |
| First dashboard viewed        | ≥ 80% giáo viên |
| Teacher weekly active rate    |           ≥ 50% |
| Assignment completion rate    |           ≥ 60% |
| Teacher action rate           |   ≥ 30% đề xuất |
| Evidence view rate            | ≥ 40% giáo viên |

## 23.3. Learning KPIs

| KPI                          |       Mục tiêu MVP |
| ---------------------------- | -----------------: |
| Diagnostic confirmation rate |              ≥ 60% |
| False diagnosis rate         |    ≤ 20% pilot đầu |
| Transfer success rate        |              ≥ 50% |
| Gap closure within 14 days   |              ≥ 40% |
| Median time to close gap     | ≤ 2 phiên học ngắn |

## 23.4. AI latency KPIs

| KPI                      |                     Mục tiêu MVP |
| ------------------------ | -------------------------------: |
| Diagnostic no-LLM p50    |                          < 300ms |
| Diagnostic no-LLM p95    |                          < 800ms |
| Student hint p50         |                           < 2.5s |
| Student hint p95         |                             < 6s |
| Teacher summary p50      |                             < 8s |
| AI fallback success rate |            ≥ 95% khi primary lỗi |
| AI trace coverage        |                  100% request AI |
| Guardrail pass rate      | ≥ 98% với content học tập hợp lệ |

## 23.5. Offline KPIs

| KPI                        |  Mục tiêu MVP |
| -------------------------- | ------------: |
| Offline task completion    |         ≥ 80% |
| Sync success rate          |         ≥ 95% |
| Data loss incidents        |             0 |
| Failed sync recoverability | 100% có retry |

---

# 24. Lịch trình phát triển

> Phần này chỉ mô tả lộ trình sản phẩm dài hạn và không dùng để giao việc trong hackathon. Backlog chính thức cho hackathon, không có deadline/sprint/worklog, nằm tại [Hackathon Work Breakdown](/docs/hackathon-work-breakdown.md).

## Phase 0 — Discovery

**Thời gian:** 2–3 tuần
**Mục tiêu:** Xác nhận vấn đề và workflow giáo viên.

### Công việc

- Phỏng vấn 10–15 giáo viên Toán THCS.
- Thu thập bài tập/bài kiểm tra thật.
- Xác định chủ đề hổng phổ biến nhất.
- Kiểm tra điều kiện thiết bị/mạng.
- Chọn chương/chủ đề ưu tiên trong Toán lớp 7–8 Kết nối tri thức.

### Exit criteria

- Ít nhất 7/10 giáo viên xác nhận vấn đề “không biết hổng từ đâu” là đau thật.
- Ít nhất 5 giáo viên đồng ý thử prototype.

---

## Phase 1 — Prototype

**Thời gian:** 4–6 tuần
**Mục tiêu:** Chứng minh giáo viên hiểu và tin root-cause diagnosis.

### Build

- FE prototype trên React.
- Knowledge graph nhỏ 15–25 skills.
- 50–100 câu hỏi.
- Diagnostic flow cơ bản.
- Teacher dashboard mock.
- Evidence view.
- 1–2 remediation paths.
- AI Service skeleton với LangGraph trace.

### Exit criteria

- Giáo viên hiểu vì sao hệ thống kết luận root-cause.
- Giáo viên nói dashboard hữu ích hơn bảng điểm thường.
- Có flow: sai bài hiện tại → truy ra prerequisite gap → gợi ý bù hổng.

---

## Phase 2 — MVP Build

**Thời gian:** 8–10 tuần
**Mục tiêu:** Xây sản phẩm dùng được trong lớp thật.

### Sprint 1 — Foundation

- Repo FE/BE/AI.
- FE deploy Vercel.
- BE deploy VPS/Render.
- AI Service deploy VPS/Render.
- Auth giáo viên.
- Tạo lớp.
- PostgreSQL schema.
- Basic monitoring.

### Sprint 2 — Content & Knowledge Graph

- Skill graph schema.
- Content CMS đơn giản.
- Question bank.
- Misconception tags.
- Transfer test data.

### Sprint 3 — Student Diagnostic

- Student join bằng mã lớp.
- Làm bài diagnostic.
- Attempt tracking.
- Hint usage tracking.
- Local IndexedDB storage.

### Sprint 4 — Diagnostic Engine

- Rule-based scoring.
- Prerequisite traversal.
- Confidence score.
- Diagnostic result.
- Teacher evidence builder.

### Sprint 5 — Teacher Dashboard

- Priority list.
- Auto grouping.
- Student evidence view.
- One-click assignment.
- Teacher feedback.

### Sprint 6 — AI RAG Service

- LangGraph RAG pipeline.
- FPT provider.
- OpenRouter fallback.
- Redis cache.
- Citation validator.
- Output guardrail.
- LangSmith tracing.

### Sprint 7 — Remediation

- Repair and Return path.
- Remediation assignment.
- Transfer test.
- Gap closure logic.
- Before/after report.

### Sprint 8 — Offline & Sync

- PWA service worker.
- Offline content pack.
- Sync queue.
- Retry logic.
- Sync status UI.
- Data loss prevention.

### Exit criteria

- Một lớp thật có thể dùng end-to-end.
- Mất mạng không mất dữ liệu bài làm.
- Diagnostic realtime không phụ thuộc LLM.
- 100% AI requests có trace.

---

## Phase 3 — Pilot

**Thời gian:** 4–6 tuần
**Quy mô:** 2–5 giáo viên, 3–8 lớp, 100–300 học sinh.

### Hoạt động

- Onboard giáo viên.
- Chạy diagnostic đầu vào.
- Theo dõi 2–3 vòng giao bài.
- Ghi nhận teacher intervention.
- Đo Gap Closure Rate.
- Phỏng vấn giáo viên hằng tuần.
- Theo dõi AI latency và sync reliability.

### Exit criteria

- ≥ 60% học sinh hoàn thành diagnostic.
- ≥ 40% confirmed gaps được đóng trong 14 ngày.
- ≥ 50% giáo viên dùng dashboard hằng tuần.
- AI diagnostic p95 không LLM < 800ms.
- Sync success rate ≥ 95%.
- Có ít nhất 1 case study học sinh/nhóm tiến bộ rõ.

---

## Phase 4 — Beta

**Thời gian:** 3–6 tháng
**Mục tiêu:** Tăng độ tin cậy, mở rộng nội dung, chuẩn bị thương mại hóa.

### Build thêm

- Nhiều chủ đề Toán hơn.
- Printable worksheets.
- Dashboard tổ chuyên môn.
- Parent summary nhẹ.
- Content authoring CMS tốt hơn.
- Better AI evaluation.
- Better offline school hub.
- Payment/subscription thử nghiệm.

### Exit criteria

- 20–50 lớp active.
- Teacher W4 retention ≥ 40%.
- Có trường trả phí hoặc cam kết trả phí.
- Có 2–3 case study đủ mạnh.

---

# 25. Rủi ro và giảm thiểu

| Risk                         | Mức độ     | Giảm thiểu                                                   |
| ---------------------------- | ---------- | ------------------------------------------------------------ |
| Chẩn đoán sai                | Cao        | Evidence, confidence, giáo viên sửa được                     |
| Scope quá rộng               | Cao        | Chỉ dữ liệu Toán lớp 7–8, bộ Kết nối tri thức trong MVP      |
| AI latency cao               | Cao        | No-LLM diagnostic, cache, timeout, async, same-region deploy |
| FPT provider lỗi             | Cao        | OpenRouter fallback                                          |
| LLM hallucination            | Cao        | RAG, citation validator, groundedness judge                  |
| Giáo viên không đổi workflow | Cao        | Dashboard xoay quanh “hôm nay giúp ai trước?”                |
| Offline sync lỗi             | Cao        | Event queue, retry, không ghi đè attempt                     |
| Nội dung sai chuẩn           | Cao        | Human review, versioning, content approval                   |
| Bị xem là IXL Việt Nam       | Trung bình | Tập trung teacher intervention OS, không chỉ practice        |

---

# 26. Final MVP definition

MVP của Mina AI không phải nền tảng học tập hoàn chỉnh.

MVP là phép thử cho giả thuyết:

> Nếu giáo viên có công cụ phát hiện root-cause gap, chia nhóm tự động và giao lộ trình bù hổng ngắn, thì họ sẽ can thiệp đúng hơn, học sinh đóng lỗ hổng nhanh hơn, và lớp học phân hóa được quản lý tốt hơn.

MVP cần có 6 năng lực:

```text
1. Knowledge graph nhỏ nhưng đúng
2. Diagnostic truy ngược prerequisite
3. Repair and Return learning path
4. Teacher priority dashboard
5. Auto grouping theo nguyên nhân
6. Offline learning + sync cơ bản
```

Về kỹ thuật, MVP cần có 5 năng lực nền tảng:

```text
1. React FE deploy Vercel
2. FastAPI Backend deploy VPS/Render
3. FastAPI AI Service deploy VPS/Render
4. Provider Router: FPT primary + OpenRouter fallback
5. LangGraph + LangSmith trace 100% request AI
```

---

# 27. Câu định vị cuối cùng

> **Mina AI là hệ thống web co-teacher AI cho giáo viên Việt Nam, giúp truy nguyên lỗ hổng kiến thức, chia nhóm học sinh theo nhu cầu, gợi ý ai cần hỗ trợ trước và tạo lộ trình bù hổng cá nhân hóa — với kiến trúc React + FastAPI + AI Service riêng, deploy FE trên Vercel, BE/AI trên VPS hoặc Render, tối ưu latency và có trace đầy đủ bằng LangGraph/LangSmith.**
