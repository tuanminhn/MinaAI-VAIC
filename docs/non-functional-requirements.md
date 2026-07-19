# Yêu cầu Phi chức năng, An toàn & Dữ liệu — Mina AI

## 1. Phạm vi

Các yêu cầu này áp dụng cho MVP có người dùng là học sinh phổ thông. Mục tiêu là biến “offline, nhanh, an toàn và đáng tin” thành tiêu chí kiểm thử được, không phải khẩu hiệu.

## 2. Hiệu năng và độ tin cậy

| ID | Yêu cầu P0 | Mục tiêu MVP |
| --- | --- | --- |
| NFR-PERF-001 | Diagnostic không LLM | p50 < 300 ms; p95 < 800 ms phía server, đo theo version |
| NFR-PERF-002 | Dashboard lớp đã cache/aggregate | p95 < 2 s với lớp 50 học sinh |
| NFR-PERF-003 | Student interaction local | phản hồi UI < 100 ms cho thao tác không cần mạng |
| NFR-REL-001 | Không mất attempt đã xác nhận local | 0 incident trong test chaos và pilot |
| NFR-REL-002 | Sync event | ≥ 95% tự thành công; 100% failure còn event để retry/điều tra |
| NFR-REL-003 | Idempotency | retry cùng event không tạo bản ghi nghiệp vụ trùng |
| NFR-REL-004 | Backup/restore | backup DB hằng ngày; kiểm tra restore trước pilot; RPO 24h, RTO 8h cho MVP |

SLO chỉ có ý nghĩa khi có telemetry theo phiên bản, môi trường và loại thiết bị. Không tính request lỗi do dữ liệu test vào kết quả pilot mà không gắn nhãn.

## 3. Offline và low-bandwidth

### NFR-OFF-001 — Mức offline MVP

Mặc định là **offline-after-download**: người dùng cần mạng để tham gia lớp và tải assignment/content pack; sau đó làm bài tối đa 7 ngày không mạng. School hub/full offline provisioning là ngoài MVP trừ khi Q-006 thay đổi.

### NFR-OFF-002 — Content pack

- Manifest có `pack_id`, version, checksum, size, assignment IDs, expiry và minimum app version.
- Tải atomically: chỉ đánh dấu usable sau khi checksum hợp lệ.
- Không xóa pack đang có attempts chưa sync.
- Mục tiêu P0: pack diagnostic + remediation liên quan ≤ 10 MB; cần đo trên thiết bị pilot.

### NFR-OFF-003 — Đồng bộ

- Event do client tạo có UUID, `occurred_at`, `device_id` pseudonymous và schema version.
- Server lưu `received_at`; không dùng clock client để giải quyết thứ tự một cách mù quáng.
- Attempt là immutable event; correction tạo event mới tham chiếu event cũ.
- Dữ liệu lớp trên dashboard hiển thị freshness và số học sinh chưa sync.

## 4. Bảo mật và phân quyền

| ID | Yêu cầu |
| --- | --- |
| NFR-SEC-001 | TLS cho dữ liệu truyền; encryption at rest cho DB/object storage ở môi trường pilot |
| NFR-SEC-002 | RBAC + kiểm tra ownership ở server; không dựa vào route/UI để bảo vệ dữ liệu |
| NFR-SEC-003 | Teacher/admin session có expiry, revoke và rate limit; không log token/secret |
| NFR-SEC-004 | Classroom code có entropy phù hợp, rate limiting, expiry/rotation; không cấp quyền xem kết quả chỉ bằng mã lớp |
| NFR-SEC-005 | Secrets qua secret manager/env ở runtime; không commit hoặc đưa vào trace |
| NFR-SEC-006 | Audit event cho login nhạy cảm, export, role change, diagnosis override, publish/rollback nội dung |
| NFR-SEC-007 | Dependency/container scan và xử lý lỗ hổng nghiêm trọng trước pilot |

## 5. Quyền riêng tư và dữ liệu trẻ em

Đây là baseline sản phẩm, không thay thế tư vấn pháp lý. Trước pilot thật cần người phụ trách xác nhận quy trình theo pháp luật/chính sách áp dụng và thỏa thuận với trường.

### NFR-PRIV-001 — Data minimization

- Mặc định dùng student ID/alias; không bắt buộc email, số điện thoại, ngày sinh hoặc địa chỉ.
- Chỉ thu dữ liệu cần cho học tập, vận hành và đánh giá pilot đã công bố.
- Không bán dữ liệu, không dùng quảng cáo hành vi, không xếp hạng công khai học sinh.

### NFR-PRIV-002 — Consent và transparency

- Có notice dễ hiểu cho giáo viên/phụ huynh/học sinh theo mô hình pilot được chọn.
- Ghi version notice/consent, thời điểm và phạm vi.
- Có quy trình truy cập, sửa, export và xóa dữ liệu theo yêu cầu hợp lệ.

### NFR-PRIV-003 — Retention

- Retention là cấu hình theo tenant/pilot; mặc định đề xuất: dữ liệu định danh trong năm học + 90 ngày.
- Sau thời hạn: xóa hoặc ẩn danh không thể đảo ngược; backup hết vòng đời theo lịch.
- Không giữ raw prompt/response vô hạn.

### NFR-PRIV-004 — Third-party AI/observability

- Không gửi tên, mã học sinh, lớp cụ thể hoặc raw free-text có PII sang LLM/tracing bên thứ ba.
- Dùng pseudonymous request IDs và metadata tối thiểu.
- Provider phải cấu hình không dùng dữ liệu để huấn luyện nếu dịch vụ hỗ trợ; lưu danh sách subprocessors và region.
- Tính năng LLM phải tắt được mà không làm hỏng diagnostic P0.

## 6. AI safety và chất lượng sư phạm

| ID | Yêu cầu |
| --- | --- |
| NFR-AI-001 | Diagnostic có thể tái lập theo input/version và có evidence |
| NFR-AI-002 | Luôn cho phép “chưa đủ dữ liệu”; không ép confidence giả |
| NFR-AI-003 | Không tự động quyết định điểm số chính thức, kỷ luật, xếp lớp hoặc cơ hội học tập |
| NFR-AI-004 | Student hint không đưa ngay đáp án; giới hạn theo hint policy của item |
| NFR-AI-005 | Explanation sinh bởi LLM phải grounded vào content đã duyệt và gắn provenance/citation nội bộ |
| NFR-AI-006 | Output không dùng ngôn ngữ kỳ thị/gắn nhãn và không tiết lộ dữ liệu học sinh khác |
| NFR-AI-007 | Mọi model/prompt/rule/graph thay đổi có version và bộ eval hồi quy trước release |
| NFR-AI-008 | Có cơ chế report, teacher override, rollback và incident review |
| NFR-AI-009 | Bài luyện tập do LLM tạo không tự phát hành; phải qua schema/citation allowlist và hành động duyệt rõ ràng của giáo viên |

SBD-as-token và tự tạo tài khoản bằng SBD mới là ngoại lệ có chủ đích cho hackathon demo: cookie HttpOnly 60 phút, không gửi tên/SBD tới LLM. Trước pilot thật phải tắt auto-provision công khai hoặc buộc roster/mã mời, đồng thời bổ sung rate limit, token/PIN không thể đoán, rotation/revocation, audit đăng nhập và cơ chế khôi phục phù hợp; không tuyên bố SBD thuần là authentication production.

Eval set tối thiểu trước pilot gồm: ca đúng chuẩn, misconception điển hình, bất cẩn/thiếu dữ liệu, graph edge sai, prompt injection, yêu cầu đáp án trực tiếp, PII leakage và tiếng Việt không phù hợp lứa tuổi.

## 7. Accessibility và tương thích

| ID | Yêu cầu P0 |
| --- | --- |
| NFR-UX-001 | Responsive từ màn hình 360 px; tap target đủ lớn cho thiết bị cảm ứng |
| NFR-UX-002 | Dùng được bằng bàn phím cho luồng chính; focus rõ; label form đầy đủ |
| NFR-UX-003 | Không dùng màu là tín hiệu duy nhất; contrast theo WCAG 2.1 AA cho text chính |
| NFR-UX-004 | Công thức toán có biểu diễn accessible/fallback text phù hợp |
| NFR-UX-005 | Hỗ trợ 2 phiên bản trình duyệt phổ biến gần nhất và thiết bị Android mục tiêu do pilot xác nhận |
| NFR-UX-006 | Copy tiếng Việt ngắn, trung tính; lỗi luôn kèm hành động khôi phục |

## 8. Quan sát, hỗ trợ và sự cố

- Correlation/request ID xuyên FE–BE–AI nhưng không chứa PII.
- Metrics: latency, error rate, sync backlog, content version, fallback, guardrail, diagnosis override.
- Alert P0: login/class access bất thường, sync backlog kéo dài, error spike, content pack checksum lỗi, data export bất thường.
- Có runbook cho provider AI down, DB restore, content rollback, leaked classroom code và suspected data incident.
- Mọi lỗi học sinh gặp phải có mã hỗ trợ không lộ nội dung/PII.

## 9. Release gate

Không pilot lớp thật nếu chưa hoàn tất threat model, access-control test, restore test, offline chaos test, content approval, privacy/consent decision và AI eval baseline. Exception phải có owner, thời hạn và phương án giảm thiểu được ghi trong decision log.
