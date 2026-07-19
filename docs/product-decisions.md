# Product Decisions — Mina AI

## 1. Mục đích

Tài liệu này tách **điều đã thống nhất**, **giả định cần kiểm chứng** và **câu hỏi cần chủ sản phẩm quyết định**. Không để đội code tự suy diễn các quyết định sản phẩm hoặc chính sách dữ liệu.

Mức ưu tiên:

- **P0:** chặn thiết kế/triển khai hoặc pilot; cần trả lời trước khi code phần liên quan.
- **P1:** có thể dùng mặc định tạm thời và xác nhận trước pilot.
- **P2:** quyết định sau khi có dữ liệu pilot.

## 2. Baseline đã thống nhất từ tài liệu hiện tại

| ID | Quyết định baseline | Trạng thái |
| --- | --- | --- |
| DEC-001 | Beachhead là giáo viên Toán lớp 9 và sử dụng đồ thị prerequisite lớp 6–9, có lớp đông và trình độ chênh lệch | Đã thống nhất |
| DEC-002 | Dataset MVP gồm ontology Toán lớp 6–9 theo GDPT 2018; diagnostic dành cho lớp 9, curriculum mapping SGK được bổ sung độc lập | Đã thống nhất |
| DEC-003 | Giáo viên là người dùng chính và giữ quyền phê duyệt/can thiệp | Đã thống nhất |
| DEC-004 | Diagnostic realtime không phụ thuộc LLM | Đã thống nhất |
| DEC-005 | AI-generated content không tự phát hành nếu chưa được người có chuyên môn duyệt | Đã thống nhất |
| DEC-006 | Học sinh có thể hoàn thành nhiệm vụ đã tải khi offline và đồng bộ sau | Đã thống nhất |
| DEC-007 | Không dùng nhãn “yếu”, “kém”, “mất gốc” trong giao diện học sinh | Đã thống nhất |

## 3. Câu hỏi P0 cần chủ sản phẩm xác nhận

| ID | Câu hỏi | Vì sao chặn | Mặc định đề xuất |
| --- | --- | --- | --- |
| Q-001 | MVP phục vụ **hackathon demo**, **prototype kiểm chứng với giáo viên**, hay **pilot trong lớp thật**? Deadline cụ thể? | Quyết định độ sâu auth, consent, offline, monitoring và content QA | Prototype có thể demo + chuẩn bị pilot nhỏ; không tuyên bố production-ready |
| Q-002 | Ai là người chịu trách nhiệm sản phẩm và ai là chuyên gia Toán duyệt knowledge graph/câu hỏi? | Cần owner ký duyệt nội dung và xử lý chẩn đoán tranh chấp | 1 product owner + ít nhất 1 giáo viên Toán THCS reviewer |
| Q-003 | Chương/chủ đề nào của Toán 6–9 theo GDPT 2018 được ưu tiên ingest và demo trước? | Toàn bộ bốn khối có thể quá lớn cho lần triển khai đầu; cần thứ tự xử lý | Chọn một chuỗi prerequisite liên thông giữa lớp 6, 7, 8 và 9 |
| Q-004 | Học sinh đăng nhập thế nào và có thu thập họ tên thật không? | Chặn schema người dùng, consent và phân quyền | Mã lớp + alias/pseudonymous ID; không yêu cầu email/số điện thoại học sinh |
| Q-005 | Trường/giáo viên có đồng ý lưu dữ liệu học sinh trên cloud và dùng nhà cung cấp AI bên thứ ba không? | Chặn kiến trúc dữ liệu và provider routing | Không gửi PII tới LLM/trace; consent rõ; có thể tắt tính năng LLM |
| Q-006 | “Offline” nghĩa là thiết bị cá nhân mất mạng sau khi tải bài, hay cả trường không có Internet trong nhiều ngày? | Hai mức này cần kiến trúc và chi phí rất khác | MVP hỗ trợ offline-after-download tối đa 7 ngày, chưa có school hub |
| Q-007 | Ngôn ngữ và accessibility bắt buộc trong MVP? | Chặn UX/content scope | Tiếng Việt; bàn phím; screen-reader cơ bản; không dựa riêng vào màu sắc |
| Q-008 | Nhóm có bao nhiêu người, kỹ năng chính và ngân sách hạ tầng/AI cho MVP là bao nhiêu? | Chặn quyết định monolith/tách service, provider và tiến độ thực tế | Ưu tiên kiến trúc triển khai đơn giản nhất đáp ứng NFR; tách ranh giới logic trước khi tách hạ tầng |

## 4. Câu hỏi P1 trước pilot

| ID | Câu hỏi | Mặc định đề xuất |
| --- | --- | --- |
| Q-101 | Giáo viên import danh sách từ file nào? | CSV template của Mina trước; adapter VnEdu/SMAS sau khi có file mẫu hợp pháp |
| Q-102 | Ai có quyền xem dữ liệu cấp lớp/trường? | Giáo viên chỉ xem lớp mình; quản trị trường chỉ có khi được cấu hình và ủy quyền |
| Q-103 | Thời gian lưu attempts và AI logs? | Attempts trong năm học + 90 ngày; audit tối thiểu cần thiết; xóa/ẩn danh sau đó |
| Q-104 | Ngưỡng confidence nào được phép hiển thị như “đã xác nhận”? | `<0,60`: chưa đủ dữ liệu; `0,60–0,79`: khả năng; `≥0,80`: độ tin cậy cao, vẫn là khuyến nghị |
| Q-105 | Có cho giáo viên sửa diagnosis và lý do không? | Có; lưu cả đề xuất máy, quyết định giáo viên và audit trail |
| Q-106 | Cách xử lý học sinh dùng chung thiết bị? | Session ngắn, chọn lại hồ sơ bằng mã/PIN, không hiển thị dữ liệu học sinh khác |

## 5. Giả thuyết cần discovery xác minh

| ID | Giả thuyết | Cách kiểm chứng |
| --- | --- | --- |
| H-001 | “Không biết học sinh hổng từ đâu” là pain đủ lớn để giáo viên đổi workflow | 10–15 phỏng vấn + 5 usability tests |
| H-002 | Giáo viên tin diagnosis nếu thấy evidence/confidence | So sánh dashboard có/không evidence; đo trust và action rate |
| H-003 | Remediation 5–15 phút đủ giúp học sinh quay lại bài chính | Transfer test + retention check |
| H-004 | Auto-grouping theo root cause hữu ích hơn nhóm theo điểm | Quan sát kế hoạch can thiệp và phỏng vấn sau buổi học |
| H-005 | Học sinh có thiết bị phù hợp và có thể tải content pack trước | Khảo sát thiết bị/mạng tại lớp mục tiêu |

## 6. Decision log

Khi trả lời câu hỏi, thêm dòng; không xóa lịch sử.

| Ngày | ID | Quyết định | Người quyết định | Tác động tài liệu |
| --- | --- | --- | --- | --- |
| 2026-07-18 | INIT | Tạo baseline pre-code; các mục Q-* vẫn mở | Chờ xác nhận | README, PRD, MVP Spec, NFR, Pilot |
| 2026-07-18 | DEC-001/002 (đã thay thế) | Từng khóa dataset MVP ở Kết nối tri thức, môn Toán lớp 7–8; quyết định này không còn hiệu lực | Chủ sản phẩm | Được thay thế bởi DEC-001/002 v2 |
| 2026-07-18 | DEC-001/002 v2 | Thay phạm vi lớp 7–8 bằng Toán lớp 6–9; vẫn giữ bộ Kết nối tri thức | Chủ sản phẩm | README, Problem Statement, PRD, MVP Spec, PDF pipeline, backlog hackathon |
| 2026-07-18 | DEC-001/002 v3 | Mở ontology ra toàn bộ Toán THCS lớp 6–9 theo GDPT 2018; bài diagnostic tập trung học sinh lớp 9 | Chủ sản phẩm | Dataset, engine, UI Knowledge Base, README và docs |
| 2026-07-18 | DEC-008 | Hackathon prototype dùng Next.js + TypeScript full-stack, PostgreSQL qua `DATABASE_URL`; diagnostic engine rule-based chạy server và không phụ thuộc LLM | Chủ sản phẩm | README, PRD, kiến trúc kỹ thuật, Task 2 |

## 7. Definition of Ready

Không bắt đầu code phần P0 nếu Q-001 đến Q-008 chưa được xác nhận hoặc chưa có quyết định mặc định được product owner chấp thuận. Có thể làm prototype thiết kế/nội dung để trả lời các câu hỏi discovery nhưng phải ghi rõ không phải bản production.
