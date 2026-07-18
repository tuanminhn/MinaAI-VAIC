# Kế hoạch Pilot & Đo lường — Mina AI

## 1. Câu hỏi pilot

Pilot không chỉ kiểm tra “app có chạy không”, mà phải trả lời:

1. Giáo viên có hiểu và tin root-cause diagnosis khi thấy evidence/confidence không?
2. Đề xuất có làm giáo viên hành động nhanh/chính xác hơn workflow hiện tại không?
3. Học sinh có hoàn thành remediation và chuyển giao được sang target skill không?
4. Sản phẩm có hoạt động đủ ổn định trong điều kiện thiết bị/mạng thật không?

## 2. Thiết kế đề xuất

- Quy mô: 2–5 giáo viên, 3–8 lớp, 100–300 học sinh.
- Thời lượng: 4–6 tuần sau một tuần onboarding/baseline.
- Cụm nội dung: một chuỗi prerequisite thuộc Toán lớp 7–8, bộ Kết nối tri thức, đã chốt trong Q-003.
- So sánh: baseline trong cùng lớp trước can thiệp; nếu khả thi, staggered rollout giữa các lớp để giảm bias.
- Nhịp: diagnostic đầu vào → 2–3 vòng giao/remediation → transfer test → retention check sau 7–14 ngày.

Không tuyên bố tác động nhân quả rộng từ pilot nhỏ. Kết quả dùng để quyết định tiếp tục, sửa hướng hoặc dừng.

## 3. North Star và định nghĩa

### MET-001 — Gap Closure Rate

```text
confirmed gaps đạt trạng thái closed trong cửa sổ pilot
/
confirmed gaps đủ thời gian chạy retention check
```

Không đưa gap chưa đến hạn retention vào denominator. Báo cáo riêng `provisional closure rate` để theo dõi sớm.

### MET-002 — Confirmed gap

Gap được xác nhận khi engine đạt ngưỡng evidence/confidence **hoặc** giáo viên xác nhận; phải lưu nguồn xác nhận.

### MET-003 — Closed gap

Gap đạt transfer test và retention check cấu hình trước. Mọi threshold phải gắn version theo skill/test, không thay sau khi xem kết quả.

## 4. Chỉ số pilot và ngưỡng quyết định

| ID | Chỉ số | Cách tính | Mục tiêu ban đầu |
| --- | --- | --- | ---: |
| MET-101 | Diagnostic completion | completed / started | ≥ 60% |
| MET-102 | Teacher weekly active | GV có ≥1 phiên dashboard/tuần / GV onboard | ≥ 50% |
| MET-103 | Teacher action rate | đề xuất dẫn đến action / đề xuất đủ điều kiện | ≥ 30% |
| MET-104 | Diagnosis confirmation | diagnosis được GV xác nhận / diagnosis được GV review | ≥ 60% |
| MET-105 | False diagnosis | diagnosis bị bác là sai / diagnosis được review | ≤ 20% |
| MET-106 | Transfer success | transfer passed / transfer attempted | ≥ 50% |
| MET-107 | Gap closed 14 ngày | closed / confirmed gap đủ cửa sổ | ≥ 40% |
| MET-108 | Sync success | events tự sync / events queued | ≥ 95% |
| MET-109 | Data loss incident | attempt xác nhận local nhưng không thể khôi phục | 0 |
| MET-110 | Teacher trust | median khảo sát 1–5 sau evidence review | ≥ 4 |

Ngưỡng là giả thuyết pilot, không phải benchmark ngành. Cần khóa trước khi pilot bắt đầu.

## 5. Event tracking tối thiểu

Mỗi event có: `event_id`, `event_name`, `schema_version`, `occurred_at`, `received_at`, actor pseudonymous ID, role, session, app/content/graph/rule version và sync status. Không đưa tên thật vào analytics.

| Event | Thuộc tính chính |
| --- | --- |
| `teacher_onboarding_completed` | steps, duration |
| `class_created` | grade, textbook mapping, roster method |
| `assignment_published` | assignment/content version, item count, offline size |
| `assignment_downloaded` | pack version, checksum result, network type |
| `diagnostic_started/completed` | assignment, duration, online/offline |
| `attempt_recorded` | question/skill version, correctness, misconception, hint count; không lưu answer free-text vào analytics |
| `diagnosis_generated` | target/root skill, confidence bucket, status, rule/graph version |
| `diagnosis_reviewed` | accepted/edited/rejected, reason category |
| `evidence_viewed` | diagnosis, time-to-view |
| `recommendation_acted` | action type, time-to-action |
| `remediation_started/completed` | path version, duration |
| `transfer_attempted` | pass/fail, test version |
| `retention_checked` | pass/fail, delay days |
| `gap_status_changed` | from/to, actor/source |
| `sync_queued/succeeded/failed` | event count, retry count, error category |

## 6. Dữ liệu định tính

- Phỏng vấn giáo viên trước pilot: workflow hiện tại, thời gian phân tích, cách chia nhóm, mức tin tưởng dữ liệu.
- Quan sát ít nhất một buổi sử dụng/lớp nếu được consent.
- Phỏng vấn hằng tuần 15 phút: diagnosis nào hữu ích/sai, hành động đã chọn, phần gây thêm việc.
- Phỏng vấn học sinh ngắn: hiểu gợi ý, cảm giác bị gắn nhãn, khó khăn thiết bị/mạng.
- Ghi case study có consent, dùng alias và loại bỏ chi tiết nhận dạng.

## 7. Chất lượng đo lường

- Tách “không làm” với “không thể làm” (vắng học, thiết bị lỗi, content chưa tải).
- Báo cáo missing data, sample size và denominator cạnh mọi tỷ lệ.
- Không đánh đồng teacher override với ground truth; lấy mẫu chuyên gia review độc lập.
- Question/transfer test không được trùng câu luyện; theo dõi item difficulty và ambiguity.
- Không thay graph/rule/content giữa cohort mà không gắn version và phân tích riêng.

## 8. Go / Iterate / Stop

### Go

- Không có sự cố an toàn/dữ liệu nghiêm trọng.
- Data loss = 0 và sync đạt ngưỡng.
- Giáo viên hiểu evidence, action rate và learning metrics đạt hoặc gần ngưỡng với tín hiệu định tính tốt.

### Iterate

- Workflow có giá trị nhưng một cụm chỉ số thấp do UX/content/rule có nguyên nhân sửa được.
- Mọi vấn đề có owner, giả thuyết và kế hoạch thử lại rõ.

### Stop hoặc thu hẹp

- Giáo viên không xem diagnosis là vấn đề đáng giải quyết sau discovery/pilot.
- False diagnosis cao hoặc gây hại dù đã có evidence/override.
- Không thể vận hành an toàn với dữ liệu trẻ em/điều kiện thiết bị mục tiêu.
- Learning outcome không có tín hiệu sau khi content và implementation đạt chuẩn tối thiểu.

## 9. Deliverables trước pilot

- Protocol, consent/notice và contact xử lý sự cố.
- Danh sách lớp/thiết bị đã khử định danh.
- Content/graph/rule version bị khóa cho cohort.
- Dashboard đo lường và data dictionary.
- Bộ eval + baseline; sampling plan chuyên gia review.
- Runbook hỗ trợ, rollback và export/xóa dữ liệu khi kết thúc.
