# Đặc tả MVP & Acceptance Criteria — Mina AI

## 1. Mục tiêu release

MVP kiểm chứng giả thuyết: khi giáo viên nhận được root-cause gap có bằng chứng và một hành động ngắn phù hợp, họ can thiệp chính xác hơn và học sinh có thể bù kỹ năng nền rồi quay lại bài hiện tại.

MVP **không** nhằm chứng minh Mina AI dạy thay giáo viên hoặc chẩn đoán chính xác mọi lỗi sai.

### 1.1. Phạm vi dữ liệu bị khóa

| Thuộc tính | Phạm vi MVP |
| --- | --- |
| Bộ sách | **Kết nối tri thức với cuộc sống** |
| Môn | **Toán** |
| Khối | **Lớp 6 và lớp 7** |
| Nguồn dữ liệu | SGK/học liệu được phép sử dụng thuộc đúng bộ sách, môn và khối trên |
| Đầu ra được tạo | Canonical skills, curriculum mappings, prerequisite edges, misconceptions, questions, remediation và transfer tests trong phạm vi lớp 6–9 |

MVP không ingest, trích xuất, ánh xạ hoặc phục vụ dữ liệu từ bộ Cánh diều, Chân trời sáng tạo, môn khác hay khối ngoài lớp 6–9. Diagnostic chỉ được truy ngược qua các skill đã duyệt nằm trong dataset này. Nếu nguyên nhân có thể thuộc kiến thức lớp 5 trở xuống, hệ thống trả về `outside_mvp_scope` hoặc `insufficient_evidence`, không tự suy đoán một skill chưa có dữ liệu.

## 2. Vai trò và quyền

| Vai trò | Quyền P0 |
| --- | --- |
| Giáo viên | Tạo/quản lý lớp của mình, giao bài, xem bằng chứng, sửa/bác diagnosis, tạo nhóm, giao remediation, ghi nhận can thiệp |
| Học sinh | Tham gia đúng lớp, xem/làm nhiệm vụ của mình, nhận gợi ý và remediation, xem tiến độ cá nhân tối thiểu |
| Content reviewer/admin | Tạo, duyệt, version và thu hồi skill/question/content pack; không mặc định xem dữ liệu lớp |
| Quản trị hệ thống | Vận hành và audit theo nguyên tắc least privilege; không dùng dữ liệu học sinh cho mục đích khác |

## 3. Phân mức phạm vi

### P0 — phải có để chạy luồng end-to-end

- Lớp học, mã lớp và danh sách học sinh pseudonymous.
- Knowledge graph Toán 6–9 theo GDPT 2018 đã duyệt; question bank có misconception mapping.
- Tạo và giao diagnostic.
- Học sinh làm bài, lưu attempt và tiếp tục sau khi mất mạng nếu nhiệm vụ đã tải.
- Rule-based root-cause diagnosis với evidence, confidence và trạng thái “chưa đủ dữ liệu”.
- Teacher priority list, grouping và evidence view.
- Giao remediation + transfer test; ghi nhận gap closure.
- Sync idempotent, trạng thái đồng bộ và retry.
- Audit tối thiểu cho nội dung, diagnosis override và truy cập nhạy cảm.

### P1 — nên có nếu còn thời gian

- Import CSV theo template Mina.
- Class-wide gap detection.
- Exit ticket cho nhóm/lớp.
- Teacher summary do LLM tạo từ dữ liệu đã khử định danh. Prototype đã có class summary và bản nháp re-teach plan; pilot thật vẫn cần eval, audit và teacher override đầy đủ.
- Retention check và báo cáo trước/sau.
- Bài nâng cao cho học sinh đã thành thạo.

### P2 — sau pilot

- Import trực tiếp VnEdu/SMAS.
- Dashboard tổ/trường, thanh toán, parent summary.
- School offline hub, nhiều môn/khối, authoring CMS đầy đủ.
- Chatbot tự do hoặc sinh bài tự động ở quy mô lớn.
- Dữ liệu bộ Cánh diều, Chân trời sáng tạo hoặc bất kỳ khối nào ngoài lớp 6–9.

## 4. Quy tắc nghiệp vụ chung

- Mọi diagnosis phải có `target_skill`, `root_cause_skill`, `confidence`, `evidence`, `status` và version của graph/rule/content.
- Khi evidence không đạt ngưỡng tối thiểu, trả về “chưa đủ dữ liệu” và câu hỏi thăm dò tiếp theo; không ép kết luận.
- Khi prerequisite cần thiết nằm ngoài Toán 6–9 theo GDPT 2018, trả về `outside_mvp_scope`; không tạo node hoặc nội dung ngoài dataset để lấp khoảng trống.
- Giáo viên có thể chấp nhận, sửa hoặc bác diagnosis; quyết định này không xóa output gốc.
- Remediation chỉ được dùng nội dung trạng thái `approved` và tương thích content-pack version.
- Một gap chỉ “closed” khi hoàn thành remediation, đạt transfer test và đạt retention check theo cấu hình pilot. Nếu chưa chạy retention check, dùng trạng thái `provisionally_closed`.
- Học sinh không nhìn thấy grade-level nguồn của remedial skill nếu thông tin đó có thể tạo stigma.
- AI explanation không thay đổi diagnosis hoặc skill state nếu không đi qua rule/approval workflow.

## 5. Functional requirements và acceptance criteria

### FR-001 — Tạo lớp và học sinh tham gia

**User story:** Là giáo viên, tôi muốn tạo lớp và đưa học sinh vào lớp nhanh để giao diagnostic.

Acceptance criteria:

- Giáo viên chỉ xem/sửa lớp mình sở hữu hoặc được cấp quyền.
- Mã lớp có hạn dùng/có thể rotate; không dùng làm credential vĩnh viễn.
- Học sinh không cần email/số điện thoại trong mặc định MVP.
- Prototype chỉ bắt buộc SBD, họ tên tùy chọn, và dùng cookie 60 phút; SBD cũ tải hồ sơ đã lưu, SBD mới tự tạo tài khoản với tên nhập vào hoặc tên mặc định. Pilot thật không được coi SBD thuần hay auto-provision công khai là credential đủ an toàn.
- Không hiển thị danh sách hoặc kết quả của học sinh khác cho học sinh.
- Import lỗi trả về từng dòng lỗi và không tạo trùng bản ghi khi retry.

### FR-002 — Tạo và giao diagnostic

**User story:** Là giáo viên, tôi muốn chọn chủ đề và giao một bài ngắn để xác định nhóm hỗ trợ.

Acceptance criteria:

- Chỉ chọn được question/content version đã duyệt.
- Trước khi giao, hiển thị chủ đề, số câu, thời lượng dự kiến, phạm vi prerequisite và dung lượng tải offline.
- Giáo viên chỉ có thể chọn nội dung Toán lớp 6, 7, 8 hoặc 9 thuộc GDPT 2018; MVP không hiển thị bộ sách/môn/khối khác để lựa chọn.
- Assignment giữ snapshot/version để thay đổi học liệu sau này không làm đổi bài đã giao.
- Có trạng thái draft, scheduled/assigned, active, closed.

### FR-003 — Học sinh làm diagnostic

**User story:** Là học sinh, tôi muốn làm bài đơn giản, nhận gợi ý vừa đủ và không mất tiến độ khi mạng yếu.

Acceptance criteria:

- Mỗi câu trả lời tạo attempt/event ID duy nhất ngay trên thiết bị.
- Lưu đáp án, thời gian, số lần thử và hint usage; không dùng timing như bằng chứng duy nhất.
- Reload/mất mạng không xóa attempt đã xác nhận cục bộ.
- UI phân biệt “đã lưu trên thiết bị”, “đang đồng bộ”, “đã đồng bộ”, “cần thử lại”.
- Không hiện đáp án đúng trước khi hết policy số lần thử.

### FR-004 — Chẩn đoán nguyên nhân gốc

**User story:** Là giáo viên, tôi muốn hiểu học sinh mắc ở kỹ năng nào và vì sao để quyết định can thiệp.

Acceptance criteria:

- Với cùng input + cùng version, engine trả kết quả xác định (deterministic).
- Kết quả liệt kê evidence dễ đọc và liên kết tới attempts liên quan.
- Có confidence đã hiệu chỉnh và trạng thái `insufficient_evidence`.
- Có trạng thái `outside_mvp_scope` khi không thể chẩn đoán tiếp bằng dataset Toán 6–9 theo GDPT 2018.
- Không gọi LLM trên critical path chẩn đoán.
- Mọi thay đổi rule/graph có version và test fixture hồi quy.
- Giáo viên có thể override và chọn lý do; audit giữ cả hai kết quả.

### FR-005 — Priority list và auto-grouping

**User story:** Là giáo viên, tôi muốn biết ai cần giúp trước và có thể xử lý theo nhóm nguyên nhân.

Acceptance criteria:

- Priority giải thích được bằng severity, confidence, thời gian mắc kẹt và khả năng can thiệp; không dựa trên thuộc tính nhạy cảm.
- Nhóm theo root cause/misconception; “chưa đủ dữ liệu” là nhóm riêng.
- Mọi con số lớp có denominator và thời điểm cập nhật.
- Giáo viên có thể đổi nhóm thủ công mà không xóa đề xuất máy.
- Mỗi nhóm hiển thị tên/SBD của học sinh thuộc nhóm cho đúng giáo viên lớp; giáo viên có thể mở tạo bài cá nhân cho từng em.

### FR-006 — Remediation và Repair-and-Return

**User story:** Là học sinh, tôi muốn luyện đúng phần còn thiếu và quay lại bài chính trong một phiên ngắn.

Acceptance criteria:

- Path có mục tiêu kỹ năng, thời lượng dự kiến, tối đa số bước và điều kiện thoát.
- Không tạo vòng lặp prerequisite/remediation.
- Sau remediation, hệ thống chạy transfer test độc lập với câu luyện.
- Nếu chưa đạt, hệ thống đưa ra một bước tiếp theo hữu hạn hoặc chuyển về giáo viên; không kẹt vô hạn.
- Khi đạt, học sinh được đưa lại target skill ban đầu.
- Bài do LLM tạo chỉ được lưu là `draft`; giáo viên phải thấy toàn bộ câu, đáp án và lời giải trong màn hình review trước khi chuyển sang `assigned`.
- Học sinh chỉ nhận bài `assigned` của chính session SBD; payload trước khi nộp không chứa đáp án đúng hoặc lời giải.
- Câu trả lời, điểm và thời điểm nộp bài cá nhân được lưu để giáo viên theo dõi quá trình.

### FR-007 — Gap closure và báo cáo

**User story:** Là giáo viên, tôi muốn biết can thiệp có hiệu quả hay không.

Acceptance criteria:

- Phân biệt `open`, `in_progress`, `provisionally_closed`, `closed`, `reopened`.
- Dashboard cho biết numerator/denominator và định nghĩa từng chỉ số.
- Có thể truy từ kết quả về assignment, attempts, remediation, transfer và retention evidence.
- Override/reopen có lý do và audit trail.

### FR-008 — Offline và sync

**User story:** Là học sinh, tôi muốn hoàn thành nhiệm vụ đã tải khi mạng chập chờn và đồng bộ an toàn khi có mạng.

Acceptance criteria:

- Chỉ các assignment/content pack đã tải và kiểm tra toàn vẹn mới dùng offline.
- Gửi cùng một event nhiều lần không tạo nhiều attempts.
- Server không âm thầm ghi đè event bất biến; xung đột metadata hiển thị trạng thái xử lý.
- Sync tiếp tục được sau app restart và có exponential backoff giới hạn.
- Giáo viên thấy thời điểm đồng bộ gần nhất; dữ liệu chưa sync không bị trình bày như dữ liệu lớp hoàn chỉnh.

### FR-009 — Content governance

**User story:** Là reviewer, tôi muốn biết nội dung đến từ đâu, ai duyệt và có thể thu hồi bản lỗi.

Acceptance criteria:

- Skill/question/misconception/edge có provenance, version, status và reviewer.
- Không phát hành content pack chứa item chưa `approved`.
- Có pre-publish validation: duplicate, broken reference, prerequisite cycle, đáp án thiếu/đa nghĩa và mapping thiếu.
- Có thể deprecate/rollback mà không phá assignment lịch sử.

## 6. Trạng thái và thuật ngữ chuẩn

- **Diagnostic:** bài thăm dò nhằm thu thập bằng chứng, không phải kỳ thi xếp loại.
- **Root-cause gap:** kỹ năng prerequisite có bằng chứng chưa thành thạo và có liên hệ nhân quả giả thuyết với lỗi ở target skill.
- **Misconception:** mẫu tư duy sai có thể quan sát từ cách trả lời; không đồng nhất với bất cẩn.
- **Transfer test:** câu mới kiểm tra khả năng áp dụng sau remediation, không lặp nguyên câu luyện.
- **Retention check:** kiểm tra trễ để xác nhận kết quả được duy trì.
- **Confidence:** độ tin cậy của kết luận theo dữ liệu hiện có, không phải xác suất học sinh “yếu”.

## 7. Điều kiện nghiệm thu MVP

- Toàn bộ FR P0 có test hoặc bằng chứng nghiệm thu.
- Kịch bản golden path và các failure paths chính chạy được trên thiết bị/mạng mục tiêu.
- Một chuyên gia Toán duyệt graph và nội dung pilot.
- Product owner duyệt copy không gắn nhãn và dashboard evidence.
- Các ngưỡng go/no-go trong kế hoạch pilot được cấu hình, không hard-code rải rác.
