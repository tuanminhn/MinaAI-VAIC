PRD v2.0 — Mina AI
AI-native Adaptive Remediation System cho học sinh cấp 2 Việt Nam

1. Tóm tắt sản phẩm
Mina AI là hệ thống học tập thích ứng dành cho học sinh cấp 2, bắt đầu với môn Toán, tập trung giải quyết vấn đề lớn trong giáo dục phổ thông Việt Nam: trong một lớp học 35–45 học sinh, trình độ nền tảng rất khác nhau, đặc biệt ở vùng sâu vùng xa, khiến học sinh yếu bị bỏ lại còn học sinh khá bị chậm nhịp.
Mina AI không phải một chatbot giải bài Toán. Mina AI là một hệ thống diagnostic + remediation + teacher dashboard chạy được trong môi trường offline hoặc mạng yếu.
Sản phẩm sẽ:
Học sinh làm bài lớp hiện tại
→ Mina phát hiện em sai kỹ năng nào
→ Truy ngược kiến thức nền bị hổng
→ Giao lộ trình bù đúng điểm hổng
→ Kiểm tra transfer test
→ Báo cáo cho giáo viên biết ai cần giúp trước

Điểm cốt lõi:
Mina AI không chỉ biết học sinh sai. Mina AI phải biết vì sao học sinh sai, hổng kỹ năng nền nào, và học đúng phần đó có giúp em quay lại bài hiện tại được không.
Tài liệu nghiên cứu adaptive learning bạn gửi cũng nhấn mạnh các khoảng trống quan trọng của hệ thống học thích ứng hiện tại: thiếu kiểm chứng trong lớp học thật, chi phí tính toán cao, rủi ro bias, thiếu đánh giá dài hạn, và cần mô hình nhẹ triển khai được ở môi trường ít tài nguyên. Đây là cơ sở để Mina AI chọn hướng offline-first, lightweight AI, real-world validation và long-term retention.

2. Problem Statement
2.1. Vấn đề chính
Trong giáo dục phổ thông Việt Nam, đặc biệt ở vùng khó khăn, vấn đề lớn không phải thiếu nội dung học tập. Vấn đề lớn là:
Một lớp có 40 học sinh
→ mỗi em có nền tảng khác nhau
→ giáo viên không thể biết từng em hổng ở đâu
→ app học hiện tại thường dạy theo thứ tự cố định
→ học sinh yếu tiếp tục tụt lại
→ học sinh khá bị giữ lại theo nhịp chung

Ví dụ:
Học sinh lớp 7 làm sai:
x + 3/4 = 5/6

Một hệ thống thường chỉ nói:
Sai bài phương trình.

Mina AI cần nói:
Học sinh hiểu phương trình đơn giản,
nhưng đang hổng quy đồng phân số.
Nguyên nhân gốc có thể từ kỹ năng phân số lớp 5/6.
Độ tin cậy: 82%.
Đề xuất: ôn quy đồng phân số 10 phút,
sau đó quay lại phương trình chứa phân số.


3. Product Thesis
3.1. Mina AI không phải chatbot
LLM chỉ nên dùng cho:
1. Giải thích kết luận cho học sinh.
2. Viết gợi ý từng bước.
3. Tóm tắt cho giáo viên/phụ huynh.
4. Tạo bản nháp câu hỏi để chuyên gia duyệt.
5. Hỏi đáp có kiểm soát dựa trên học liệu đã duyệt.

LLM không nên dùng để quyết định lõi:
Học sinh hổng kỹ năng nào?
Cần học bài gì tiếp theo?
Có đóng được gap hay chưa?

Những phần này phải dựa trên:
Knowledge Graph
+ Question Tagging
+ Misconception Mapping
+ Attempt Evidence
+ Confidence Score
+ Transfer/Retention Test

3.2. AI-native đúng nghĩa
AI-native không có nghĩa là “có chatbot”.
AI-native ở Mina AI nghĩa là:
Mỗi học sinh có một trạng thái năng lực riêng.
Mỗi câu trả lời cập nhật skill state.
Mỗi lỗi sai được map về misconception.
Hệ thống biết nên hỏi câu truy ngược nào.
Hệ thống biết bài bù nào phù hợp.
Hệ thống đo được bù hổng có hiệu quả hay không.


4. Target User
4.1. Core user
Học sinh cấp 2, bắt đầu với lớp 6–7, đang hổng nền Toán.

4.2. Trust user
Giáo viên Toán.
Phụ huynh.
Tổ trưởng chuyên môn.

4.3. Buyer / Customer
Trường học.
Tổ chức giáo dục.
Đơn vị tài trợ giáo dục vùng khó.
Phụ huynh hoặc nhóm phụ huynh ở giai đoạn sau.

4.4. Beachhead
Không bắt đầu với toàn bộ cấp 2.
MVP tập trung:
Môn: Toán
Khối: lớp 6–7
Truy ngược: lớp 4–6
Cụm kiến thức:
- Phân số
- Quy đồng
- Số nguyên
- Số hữu tỉ
- Biểu thức cơ bản
- Phương trình một bước / phương trình chứa phân số


5. Product Positioning
5.1. Câu định vị
Mina AI là hệ thống adaptive remediation chạy được offline cho học sinh cấp 2 Việt Nam, giúp phát hiện lỗ hổng kiến thức nền, giao lộ trình bù đúng điểm hổng và hỗ trợ giáo viên biết ai cần giúp trước.
5.2. Không định vị là
Chatbot giải bài Toán.
App luyện đề thông thường.
SaaS học online phụ thuộc Internet.
Kho bài tập số hóa.

5.3. Định vị nên dùng khi pitching
Không học lại cả chương. Mina AI tìm đúng điểm hổng nhỏ nhất đang chặn học sinh tiến bộ.

6. Scope MVP
6.1. In scope
Web app cho học sinh và giáo viên.
Môn Toán lớp 6–7.
Knowledge graph Toán theo GDPT 2018.
Question bank có gắn skill và misconception.
Diagnostic engine truy ngược root-cause gap.
Personalized remediation path.
Transfer test.
Retention check.
Teacher dashboard.
Auto grouping.
Class-wide gap detection.
Offline/local deployment.
Local RAG.
Local hosted small model.
Hybrid cloud option qua FPT/OpenRouter.

6.2. Out of scope MVP
Tất cả môn học.
Tất cả lớp 1–12.
Chatbot tự do.
OCR bài viết tay.
Camera scan bài tập.
Voice tutor.
Blockchain.
Federated learning.
Gamification phức tạp.
Parent app đầy đủ.
Dashboard cấp Sở/Phòng.
AI tự xuất bản nội dung không kiểm duyệt.


7. Chiến lược môn học
7.1. Có khả năng nhiều môn không?
Có, nhưng phải chia thành 2 lớp:
RAG nhiều môn: có thể thiết kế ngay.
Adaptive diagnosis sâu: chỉ nên làm Toán trước.

7.2. Vì sao Toán trước?
Toán phù hợp nhất để bắt đầu vì:
Có prerequisite rõ.
Có đúng/sai tương đối rõ.
Có thể thiết kế misconception.
Có thể đo transfer test.
Có thể đo retention.
Dễ chứng minh học sinh tiến bộ.
Nhu cầu phụ đạo cao.

7.3. Multi-subject strategy
Kiến trúc content/RAG phải mở cho nhiều môn:
Toán
KHTN
Tiếng Anh
Vật lý
Hóa học
Sinh học

Nhưng adaptive diagnosis sâu cần thêm cho từng môn:
Subject skill graph
Misconception map
Diagnostic questions
Remediation path
Transfer test
Rubric đánh giá

7.4. Cách pitch với nhà đầu tư
Mina bắt đầu với Toán vì đây là môn có cấu trúc prerequisite rõ nhất và dễ chứng minh learning gain nhất. Tuy nhiên, hệ thống content ingestion và RAG được thiết kế đa môn ngay từ đầu. Khi có thêm subject knowledge graph và assessment bank, Mina có thể mở rộng sang KHTN, Tiếng Anh, Vật lý, Hóa học.

8. Nguồn học liệu và Knowledge Base
8.1. Source of truth
Nguồn chuẩn cao nhất là:
Chương trình Giáo dục Phổ thông 2018 — Môn Toán

Dữ liệu này được chuyển thành:
Curriculum standards
Learning outcomes
Subject topics
Micro-skills
Prerequisite graph
Mastery requirements

8.2. SGK và tài liệu cấp 2
SGK và tài liệu khác không nên chỉ đưa vào RAG như PDF thô.
Cách xử lý đúng:
SGK / tài liệu giáo viên / đề kiểm tra
→ extract text
→ chunk
→ gắn metadata
→ map vào curriculum standard
→ map vào skill_id
→ human review
→ embedding
→ đưa vào RAG index

Lưu ý bản quyền:
Không copy nguyên văn SGK để phát hành nếu chưa có quyền.
SGK nên dùng để alignment, mapping, tham khảo dạng bài.
Mina nên tạo nội dung gốc đã kiểm duyệt.

8.3. Content layers
Official Curriculum KB
        ↓
Skill Graph Layer
        ↓
Textbook / Document Mapping Layer
        ↓
Approved Learning Resource Layer
        ↓
Question & Assessment Layer
        ↓
RAG Layer


9. Core Learning Engine
9.1. Knowledge Graph
Ví dụ:
Bội chung
→ Mẫu số chung
→ Quy đồng phân số
→ Cộng/trừ phân số khác mẫu
→ Số hữu tỉ
→ Phương trình chứa phân số

Mỗi skill có:
Skill ID
Tên kỹ năng
Môn học
Khối lớp
Chủ đề
Chuẩn GDPT liên quan
Prerequisite skills
Dependent skills
Misconceptions
Diagnostic questions
Practice questions
Transfer tests
Mastery threshold

9.2. Diagnostic Engine
Luồng:
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

9.3. Ví dụ diagnostic
Học sinh sai:
x + 3/4 = 5/6

Hệ thống hỏi probe:
x + 2 = 5
5/6 - 3/4 = ?
3/4 viết thành phân số có mẫu 12 là gì?
Mẫu số chung nhỏ nhất của 4 và 6 là bao nhiêu?

Kết luận:
Current failed skill:
Phương trình chứa phân số — lớp 7

Root-cause gap:
Quy đồng phân số — lớp 5/6

Confidence:
82%

Evidence:
- Làm đúng phương trình số nguyên
- Sai phép trừ phân số khác mẫu
- Không đổi được 3/4 về mẫu 12
- Chọn đáp án sai theo pattern trừ tử với tử, mẫu với mẫu

Recommended path:
Ôn quy đồng phân số 10 phút
→ luyện trừ phân số khác mẫu
→ quay lại phương trình chứa phân số


10. Personalization Logic
10.1. Cá nhân hóa không phải là gọi tên học sinh
Cá nhân hóa thật là:
Chọn đúng skill học sinh đang hổng.
Chọn đúng câu probe.
Chọn đúng bài bù.
Chọn đúng thời điểm quay lại bài chính.
Đo được em đã thật sự đóng gap hay chưa.

10.2. Student skill state
unknown
suspected_gap
confirmed_gap
in_remediation
temporarily_repaired
mastered
needs_teacher_intervention

10.3. Verified Gap Closure
Một gap chỉ được coi là đóng khi:
1. Học sinh hoàn thành remediation.
2. Vượt transfer test.
3. Vượt retention check sau 3–7 ngày.

10.4. North Star Metric
Verified Gap Closure Rate =
Số gaps được đóng và vượt retention check
/
Tổng số confirmed gaps


11. Teacher Dashboard
11.1. Câu hỏi dashboard phải trả lời
Hôm nay cần giúp ai trước?
Vì sao em đó cần giúp?
Nên chia nhóm như thế nào?
Có lỗi chung nào cả lớp cần dạy lại không?

11.2. Core dashboard
Priority Students
Auto Groups
Class-wide Gaps
Evidence View
One-click Remediation Assignment
Intervention Log
Before/After Report

11.3. Auto grouping
Ví dụ:
Nhóm A: Hổng quy đồng phân số
Nhóm B: Nhầm dấu số âm
Nhóm C: Chưa hiểu chuyển vế
Nhóm D: Đúng nhưng thao tác chậm
Nhóm E: Đã thành thạo, cần thử thách

11.4. Class-wide gap detection
Rule mẫu:
Nếu > 40% lớp sai cùng skill
hoặc > 30% lớp chọn cùng misconception
→ cảnh báo giáo viên
→ đề xuất dạy lại 8 phút
→ giao exit ticket


12. AI Strategy
12.1. 3 tầng AI fallback
Tier 0 — Rule/Graph Engine
Luôn chạy offline, không cần LLM.

Tier 1 — Local Small Model
Chạy trong Mina Local AI server, dùng cho hint/tóm tắt/giải thích.

Tier 2 — Cloud LLM
Dùng trong Mina Hybrid qua FPT hoặc OpenRouter khi có mạng.

12.2. Rule/Graph Engine
Chạy các tác vụ:
Chấm bài.
Map skill.
Nhận diện misconception.
Truy ngược prerequisite.
Tính confidence.
Giao remediation path.
Chia nhóm.
Phát hiện class-wide gap.

Không cần Internet, không cần GPU.
12.3. Local Small Model
Dùng cho:
Giải thích kết luận cho học sinh.
Hint từng bước.
Tóm tắt nhóm cho giáo viên.
Local RAG trên học liệu đã duyệt.

Không dùng để:
Tự quyết định root-cause gap.
Tự tạo kết luận không có evidence.
Chat tự do ngoài phạm vi.

12.4. Cloud LLM
Provider:
Primary: FPT Cloud
Base URL: https://mkp-api.fptcloud.com

Fallback: OpenRouter

Dùng cho:
Teacher summary nâng cao.
RAG chất lượng cao hơn.
Sinh bản nháp câu hỏi.
LLM judge.
Content authoring có kiểm duyệt.

12.5. Routing logic
Request cần chẩn đoán?
→ Rule/Graph Engine

Request cần diễn giải?
→ Template hoặc Local Model

Có Internet và gói Hybrid?
→ FPT Cloud

FPT lỗi?
→ OpenRouter

Tất cả lỗi?
→ Local Model hoặc Template


13. RAG Strategy
13.1. Local RAG là bắt buộc
Mina Local AI phải RAG được không Internet.
Dữ liệu RAG được đóng gói sẵn trong content pack:
Approved explanations
Teacher guides
Misconception guides
Worked examples
FAQ
Curriculum mappings

13.2. RAG nhiều môn
Hệ thống cho phép nhập tài liệu nhiều môn:
Upload document
→ extract text
→ chunk
→ detect subject/grade/topic
→ map vào curriculum standard
→ map skill_id nếu có
→ human review
→ embedding
→ store vào pgvector
→ RAG ready

13.3. Metadata bắt buộc
{
  "subject": "math",
  "grade": 7,
  "topic": "rational_numbers",
  "skill_id": "MATH_7_RATIONAL_003",
  "standard_id": "GDPT_MATH_2018_xxx",
  "content_type": "concept_explanation",
  "source_type": "mina_original",
  "approved": true,
  "version": "1.0.0"
}

13.4. RAG pipeline
User Question
     ↓
Role Detection
     ↓
Intent Detection
     ↓
Skill/Topic Detection
     ↓
Metadata Filter
     ↓
Hybrid Retrieval
     ↓
Rerank nhẹ
     ↓
Context Builder
     ↓
Local/Cloud LLM
     ↓
Citation/Groundedness Check
     ↓
Output Guardrail


14. Database Architecture
14.1. Local-first DB
Mina AI không dùng cloud DB làm nguồn duy nhất.
Mina Local AI:
Local PostgreSQL + pgvector

Mina Hybrid:
Local PostgreSQL + pgvector
+ Cloud PostgreSQL + pgvector
+ sync metadata

14.2. Vì sao PostgreSQL + pgvector?
Quản lý học sinh/lớp/bài làm tốt.
Lưu skill graph được.
Lưu RAG chunks và embeddings được.
Chạy local bằng Docker.
Dùng chung cho local và cloud.
Giảm số lượng service phải vận hành.

14.3. Nhóm bảng chính
Content / Curriculum
curriculum_standards
subjects
topics
skills
knowledge_edges
misconceptions
questions
answer_options
remediation_paths
remediation_items
transfer_tests
content_documents
content_chunks
content_embeddings
content_pack_versions

School / Student
schools
teachers
students
classrooms
classroom_students
assignments
assignment_items
attempts
student_skill_states
diagnostic_results
gap_closure_events
retention_checks
teacher_interventions

RAG / AI
rag_queries
rag_retrieval_logs
ai_request_logs
ai_provider_logs
ai_guardrail_logs
ai_trace_events
local_model_logs
prompt_templates

Sync
sync_outbox
sync_inbox
sync_checkpoint
device_registry
content_update_logs

14.4. Sync strategy
Local-first.
Không chặn lớp học nếu sync lỗi.
Retry khi có mạng.
Sync metadata nhẹ.
Không sync dữ liệu cá nhân thừa.
Content update có version rõ.


15. Content Pack
15.1. Khái niệm
Content pack là gói học liệu đã xử lý, cài vào local server.
Ví dụ:
content_pack_math_6_7_foundation_v1.zip

15.2. Bên trong content pack
manifest.json
curriculum_standards.json
skills.json
knowledge_edges.json
misconceptions.json
questions.json
answer_options.json
remediation_paths.json
transfer_tests.json
content_documents.json
content_chunks.json
content_embeddings
prompt_templates.json
local_rag_config.json

15.3. Import flow
Admin import content pack
→ validate version
→ import DB
→ build indexes
→ verify embedding model
→ ready for offline learning/RAG


16. Product Packages
Chỉ có 2 gói.

16.1. Gói 1 — Mina Local AI
Định vị:
Cài trực tiếp tại trường, chạy trong mạng nội bộ, có local model nhẹ, không phụ thuộc Internet.
Có:
Local server install.
React web app served locally.
Backend FastAPI.
AI Service FastAPI.
PostgreSQL + pgvector.
Knowledge graph Toán.
Rule/Graph diagnostic engine.
Personalized remediation.
Teacher dashboard.
Auto grouping.
Class-wide gap detection.
Local RAG.
Local small model.
Local trace log.
Backup/restore.
In phiếu bài tập.
Content pack Toán 6–7.

Không có hoặc hạn chế:
Cloud LLM.
Remote analytics realtime.
Cloud backup.
Online content update tự động.
LangSmith realtime.
Dashboard nhiều trường.

Mô hình thương mại:
Mua license local.
Có thể bán kèm Mina Box.
Có annual maintenance để cập nhật học liệu, model, lỗi kỹ thuật.


16.2. Gói 2 — Mina Hybrid
Định vị:
Có toàn bộ Mina Local AI, thêm cloud enhancement khi có Internet.
Có thêm:
FPT Cloud / OpenRouter.
Cloud RAG nâng cao.
Cloud sync.
Cloud backup.
Online content update.
Teacher weekly summary nâng cao.
Dashboard cấp trường/tổ chuyên môn.
Remote support.
LangSmith/cloud trace khi online.
Central analytics.

Nguyên tắc:
Khi có mạng → thông minh hơn.
Khi mất mạng → quay về Mina Local AI.


17. Hardware Baseline
17.1. Dev machine của bạn
Laptop hiện tại:
CPU: i5-12500H
RAM: 16GB
SSD: 512GB

Phải chạy được bản dev:
React FE
FastAPI BE
FastAPI AI Service
PostgreSQL + pgvector
Rule/Graph Engine
Local RAG nhỏ
Local small model 1B–3B hoặc fallback cloud

Không dùng laptop này để benchmark production 40 học sinh.
17.2. Production Minimum Spec
Dành cho 20–30 học sinh đồng thời.
CPU: 6 cores / 12 threads
RAM: 16GB
Storage: SSD 512GB
GPU: không bắt buộc
Network: LAN/Wi-Fi ổn định
OS: Ubuntu Server LTS
Runtime: Docker Compose

17.3. Recommended Spec cho Mina Local AI
Dành cho một lớp 35–45 học sinh.
CPU: 8 cores / 16 threads
RAM: 32GB
Storage: NVMe SSD 1TB
GPU: 8GB VRAM khuyến nghị
Network: LAN 1Gbps
UPS: nên có
OS: Ubuntu Server LTS
Runtime: Docker Compose

17.4. Plus Spec
Dành cho nhiều lớp/phòng học.
CPU: 12–16 cores
RAM: 64GB
Storage: NVMe SSD 2TB
GPU: 12–16GB VRAM
Network: LAN 1Gbps/2.5Gbps
UPS: bắt buộc

17.5. Nguyên tắc local LLM
Chấm bài không gọi LLM.
Diagnostic không gọi LLM.
Dashboard không phụ thuộc LLM.
Local LLM có queue.
Timeout thì fallback template.
Không cho 40 học sinh chat tự do cùng lúc.


18. Deployment Architecture
18.1. Local school deployment
Student PCs / Tablets
        ↓ LAN
http://mina.local
        ↓
Mina Local Server
├── Nginx
├── React static frontend
├── Backend FastAPI
├── AI Service FastAPI
├── PostgreSQL + pgvector
├── Redis optional
├── Local model runtime
├── Content pack
├── Backup worker
└── Sync worker

18.2. Hybrid deployment
Local School Server
        ↓ sync khi có mạng
Mina Cloud
├── Cloud API
├── Cloud DB
├── Content update server
├── FPT/OpenRouter provider router
├── Cloud analytics
└── LangSmith trace sync

18.3. FE deployment
Có 2 mode:
Demo/Hybrid:
Frontend React deploy Vercel.

Local School:
Cùng React build được serve bởi Nginx trong local server.

Không mâu thuẫn: Vercel dùng cho demo/hybrid, còn trường offline dùng local static frontend.

19. Investor Demo Strategy
19.1. Không demo bằng localhost
Demo nhà đầu tư cần public URL:
demo.mina.ai

19.2. Cloud-simulated Local Box
Bản demo nên host trên một server giống local school server:
Vercel FE
        ↓
Demo Server
├── Backend FastAPI
├── AI Service FastAPI
├── PostgreSQL + pgvector
├── Local RAG index
├── Self-hosted small model
├── Content pack Toán 6–7
└── Seed data lớp 7A

Điểm cần chứng minh:
Model được self-host.
Không bắt buộc gọi API LLM.
RAG chạy trên content pack.
Diagnostic chạy bằng rule/graph.
Hybrid mode có thể bật FPT/OpenRouter.

19.3. Demo modes
Mode 1: Local AI Mode
Cloud LLM OFF.
Local model ON.
RAG local.
Diagnostic local.

Mode 2: Hybrid Mode
Cloud LLM ON.
FPT/OpenRouter ON.
Local fallback ON.

19.4. Demo flows
Flow 1 — Học sinh sai bài lớp 7
Làm sai phương trình chứa phân số
→ Mina hỏi probe
→ phát hiện hổng quy đồng
→ giao bài bù
→ transfer test

Flow 2 — Teacher dashboard
Giáo viên thấy:
- Ai cần giúp trước
- Nhóm hổng quy đồng
- Class-wide gap
- Gợi ý dạy lại 8 phút

Flow 3 — Local AI explanation
Tắt cloud
→ hỏi “vì sao Minh thuộc nhóm cần hỗ trợ?”
→ local model trả lời dựa trên evidence

Flow 4 — Multi-subject RAG
Upload tài liệu KHTN/Tiếng Anh
→ map metadata
→ hỏi đáp tài liệu
→ nói rõ đây là RAG layer, chưa phải adaptive diagnosis sâu


20. Tech Stack
20.1. Frontend
React
TypeScript
Vite hoặc Next.js
TailwindCSS
shadcn/ui
TanStack Query
Zustand
IndexedDB + Dexie.js
PWA
Recharts/ECharts
Deploy demo/hybrid: Vercel
Local deploy: Nginx static build

20.2. Backend
Python 3.11+
FastAPI
PostgreSQL
SQLAlchemy 2.0
Alembic
Redis optional
Docker Compose
JWT/Auth local
Sentry/OpenTelemetry optional

20.3. AI Service
Python 3.11+
FastAPI
LangGraph
LangSmith for hybrid/cloud trace
Pydantic
httpx async
PostgreSQL + pgvector
Local model runtime: Ollama / llama.cpp / vLLM tùy cấu hình
Provider Router: FPT + OpenRouter

20.4. Dev profiles
core:
FE + BE + AI Service + PostgreSQL + pgvector

local-ai:
core + local model runtime

hybrid:
core + FPT/OpenRouter config


21. AI Trace & Observability
21.1. Local trace
Offline vẫn phải log:
request_id
mode
pipeline
student_id_hash
skill_detected
root_cause
confidence
model_used
llm_used
latency
fallback_used
created_at

21.2. Hybrid trace
Khi có mạng:
Sync local trace
→ central server
→ LangSmith project nếu phù hợp

21.3. LangSmith projects
mina-ai-dev
mina-ai-staging
mina-ai-prod
mina-ai-evals


22. Guardrails
22.1. Input guardrail
Chặn:
Prompt injection.
Yêu cầu lộ system prompt.
Hỏi ngoài phạm vi học tập.
Hỏi đáp án trực tiếp trong khi làm bài.
Nội dung không phù hợp học sinh.

22.2. Output guardrail
Chặn hoặc sửa:
Đưa đáp án trực tiếp.
Hallucination.
Dữ liệu không có trong context.
Gắn nhãn học sinh là yếu/kém/mất gốc.
Lộ dữ liệu học sinh khác.
Giải thích quá dài/quá khó.

22.3. Pedagogy guardrail
Với học sinh:
Không đưa đáp án ngay.
Gợi ý từng bước.
Ngôn ngữ đơn giản.
Không làm học sinh xấu hổ.

Với giáo viên:
Nêu evidence.
Nêu confidence.
Đề xuất hành động cụ thể.
Nói rõ khi chưa đủ dữ liệu.


23. Core User Flows
23.1. Student Diagnostic Flow
Học sinh vào http://mina.local
→ chọn lớp / nhập mã lớp
→ làm diagnostic lớp 7
→ sai câu hiện tại
→ hệ thống hỏi probe lớp trước
→ xác định root-cause gap
→ giao bài bù
→ transfer test
→ cập nhật skill state

23.2. Teacher Intervention Flow
Giáo viên mở dashboard
→ xem “Ai cần giúp trước?”
→ chọn nhóm học sinh
→ xem evidence
→ giao remediation hoặc dạy lại nhóm
→ exit ticket
→ xem before/after

23.3. Offline Sync Flow
Học sinh làm bài trong LAN
→ dữ liệu lưu local DB
→ mất Internet không ảnh hưởng
→ khi có mạng, sync metadata
→ tải content update nếu có

23.4. RAG Flow
Học sinh/giáo viên hỏi
→ detect role/intent/skill
→ metadata filter
→ local retrieval
→ local model hoặc cloud LLM
→ guardrail
→ trả lời có kiểm soát


24. KPIs
24.1. Learning KPIs
Diagnostic teacher validation rate ≥ 70%
False diagnosis rate ≤ 20–25%
Transfer success rate ≥ 50%
Verified gap closure within 14 days ≥ 40%
Retention pass rate sau 7 ngày ≥ 40%
Median time to close gap ≤ 2 phiên học ngắn

24.2. Product KPIs
Student diagnostic completion ≥ 60%
Teacher dashboard viewed ≥ 80%
Teacher weekly active ≥ 50%
Teacher action rate ≥ 30%
Evidence view rate ≥ 40%

24.3. Offline KPIs
Offline task completion ≥ 80%
Sync success rate ≥ 95%
Data loss incidents = 0
Dashboard usable without Internet = 100%

24.4. AI latency KPIs
Rule diagnostic p95 < 800ms
Dashboard update 1–2s
Local hint 2–6s
Teacher summary local 5–15s
Cloud fallback success ≥ 95% khi primary lỗi


25. Roadmap
Phase 0 — Discovery
Thời gian: 2–3 tuần
Phỏng vấn 10–15 giáo viên Toán.
Thu thập bài kiểm tra thật.
Xác định lỗi phổ biến.
Chọn cụm kiến thức MVP.
Kiểm tra điều kiện thiết bị/mạng.

Exit criteria:
≥ 7/10 giáo viên xác nhận pain.
≥ 5 giáo viên đồng ý thử prototype.

Phase 1 — Local Dev Prototype
Thời gian: 4–6 tuần
Build trên laptop dev:
React FE
FastAPI BE
AI Service
PostgreSQL + pgvector
Skill graph 15–25 skills
50–100 câu hỏi
Diagnostic flow
Teacher dashboard mock
Local RAG nhỏ
Local model nhỏ hoặc template fallback

Exit criteria:
Sai bài lớp 7 → truy ra gap lớp trước.
Có dashboard evidence.
Có RAG trả lời từ học liệu duyệt.

Phase 2 — MVP Local AI
Thời gian: 8–10 tuần
Content pack Toán 6–7.
Rule/Graph diagnostic engine.
Remediation path.
Transfer test.
Retention check.
Teacher dashboard.
Auto grouping.
Local RAG.
Local model integration.
Backup/restore.
Docker Compose installer.

Exit criteria:
Một lớp thật có thể dùng end-to-end.
Không Internet vẫn chạy.
Chẩn đoán không phụ thuộc LLM.

Phase 3 — Investor Demo
Thời gian: 2–3 tuần
FE deploy Vercel.
Demo server host BE/AI/DB/local model.
Seed lớp 7A.
Demo Local AI Mode.
Demo Hybrid Mode.
Demo multi-subject RAG layer.

Exit criteria:
Nhà đầu tư truy cập public URL.
Thấy self-hosted model hoạt động.
Thấy offline-first architecture.
Thấy adaptive Toán sâu.

Phase 4 — Pilot
Thời gian: 4–6 tuần
2–5 giáo viên.
3–8 lớp.
100–300 học sinh.
Chạy diagnostic/remediation.
Đo gap closure.
Thu feedback giáo viên.
Đo latency/offline/sync.

Phase 5 — Hybrid Expansion
FPT/OpenRouter.
Cloud sync.
Online content update.
Cloud backup.
Teacher summary nâng cao.
Central analytics.


26. Risks & Mitigation
Risk
Mức độ
Giảm thiểu
Chẩn đoán sai
Cao
Evidence + confidence + teacher correction
Local model yếu
Cao
Không cho quyết định lõi, fallback template
Máy trường không đủ mạnh
Cao
Hardware baseline + Mina Box
Scope đa môn quá rộng
Cao
Adaptive sâu Toán trước, RAG đa môn sau
RAG hallucination
Cao
Approved content + metadata filter + guardrail
Offline sync lỗi
Cao
Outbox/inbox sync + retry + local-first
Bản quyền SGK
Cao
Mapping/metadata, tạo nội dung gốc, kiểm duyệt
Bị xem là chatbot
Trung bình
Pitch diagnostic/remediation/dashboard
Chi phí cloud
Trung bình
Local-first, cloud optional
Giáo viên không dùng
Cao
Dashboard trả lời “ai cần giúp trước?”


27. Final MVP Definition
MVP của Mina AI không phải một app học Toán đầy đủ.
MVP là phép thử cho giả thuyết:
Nếu hệ thống có thể phát hiện đúng lỗ hổng kiến thức nền, giao đúng bài bù, và giúp giáo viên biết ai cần hỗ trợ trước, thì học sinh sẽ đóng gap nhanh hơn và lớp học đông sẽ được quản lý tốt hơn.
MVP phải chứng minh được:
1. Học sinh sai bài lớp hiện tại.
2. Mina truy được root-cause gap ở lớp trước.
3. Mina giao bài bù đúng skill.
4. Học sinh vượt transfer test.
5. Giáo viên thấy nhóm cần hỗ trợ.
6. Hệ thống chạy được offline/local.
7. Local model hỗ trợ giải thích/hint nhưng không quyết định lõi.


28. Câu chốt chiến lược
Mina AI bắt đầu với Toán cấp 2 vì đây là môn có prerequisite rõ nhất để chứng minh adaptive learning. Hệ thống được thiết kế local-first: cài được vào phòng tin học, chạy được không Internet bằng knowledge graph, rule diagnostic và local model nhẹ. Khi có mạng, Mina Hybrid dùng FPT/OpenRouter để tăng chất lượng giải thích, RAG và báo cáo, nhưng lớp học không bao giờ phụ thuộc vào cloud để vận hành.

