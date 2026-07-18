# Mina AI

Mina AI là **co-teacher thích ứng cho lớp học phổ thông có trình độ không đồng đều**. Sản phẩm giúp giáo viên phát hiện nguyên nhân gốc của lỗi sai, ưu tiên học sinh cần hỗ trợ, chia nhóm theo nhu cầu và giao lộ trình bù hổng ngắn; học sinh được quay lại đúng kỹ năng nền còn thiếu rồi trở về bài học hiện tại.

## Trạng thái

Dự án đang ở giai đoạn **product discovery / pre-code**. Chưa bắt đầu triển khai cho đến khi các quyết định P0 trong [Product Decisions](/docs/product-decisions.md) được xác nhận.

## Beachhead và phạm vi MVP

- Người dùng chính: giáo viên Toán THCS và học sinh trong lớp của họ.
- Phạm vi dữ liệu MVP: duy nhất **SGK Kết nối tri thức với cuộc sống, môn Toán lớp 7 và lớp 8**.
- Knowledge graph, câu hỏi, misconception và nội dung remediation của MVP chỉ được tạo từ phạm vi dữ liệu này.
- Nền tảng: web app/PWA cho giáo viên và học sinh.
- Điều kiện vận hành: hỗ trợ mạng yếu và học sinh tiếp tục làm nhiệm vụ đã tải khi offline.
- Chuẩn nội dung: Chương trình GDPT 2018 theo cấu trúc chương/bài của bộ Kết nối tri thức.

Ngoài MVP: dữ liệu lớp 1–6 hoặc lớp 9–12, bộ Cánh diều/Chân trời sáng tạo, chatbot tự do, chấm bài viết tay, ứng dụng phụ huynh đầy đủ, gamification phức tạp và dashboard cấp Sở/Phòng.

## Giá trị cốt lõi

1. **Chẩn đoán có bằng chứng:** không chỉ báo đúng/sai mà chỉ ra kỹ năng nền có khả năng gây lỗi, độ tin cậy và dữ liệu hỗ trợ.
2. **Repair and Return:** bù đúng lỗ hổng trong một phiên ngắn, kiểm tra chuyển giao rồi quay lại bài hiện tại.
3. **Dashboard để hành động:** trả lời “hôm nay cần giúp ai, vì sao và nên làm gì?”.
4. **Giáo viên giữ quyền quyết định:** mọi chẩn đoán là khuyến nghị có thể xem, sửa hoặc bác bỏ; nội dung AI không tự phát hành.
5. **Không gắn nhãn học sinh:** giao diện dùng ngôn ngữ trung tính, tập trung vào kỹ năng cần luyện.
6. **Offline có giới hạn rõ:** chấm và điều hướng cơ bản chạy cục bộ; phân tích nâng cao đồng bộ khi có mạng.

## Chỉ số thành công chính

North Star Metric là **Gap Closure Rate**: tỷ lệ lỗ hổng đã xác nhận được bù, vượt transfer test và không tái xuất hiện ở lần kiểm tra duy trì gần nhất.

MVP chỉ được coi là có tín hiệu tốt khi đồng thời chứng minh:

- Giáo viên dùng dashboard hằng tuần và thực hiện hành động từ đề xuất.
- Học sinh hoàn thành diagnostic và remediation trong điều kiện lớp thật.
- Chẩn đoán sai nằm trong ngưỡng pilot đã định và luôn hiển thị bằng chứng/độ tin cậy.
- Không mất bài làm khi mất mạng hoặc đồng bộ lại.

Chi tiết công thức, ngưỡng và sự kiện đo lường nằm trong [Kế hoạch Pilot & Đo lường](/docs/pilot-and-measurement.md).

## Luồng MVP

```text
Giáo viên tạo lớp và giao diagnostic
→ Học sinh làm bài (online hoặc offline sau khi tải nhiệm vụ)
→ Engine đối chiếu đáp án, misconception và prerequisite graph
→ Hệ thống đề xuất root-cause gap kèm evidence/confidence
→ Giáo viên xem nhóm ưu tiên và giao can thiệp
→ Học sinh hoàn thành remediation + transfer test
→ Dashboard ghi nhận kết quả và gap closure
```

## Nguyên tắc kỹ thuật đã thống nhất

- Chẩn đoán thời gian thực dựa trên knowledge graph, rule-based scoring và misconception mapping; **không phụ thuộc LLM**.
- LLM chỉ hỗ trợ giải thích, tóm tắt và tạo bản nháp có kiểm duyệt.
- Dữ liệu học sinh tối thiểu hóa theo mục đích, phân quyền theo lớp và không đưa thông tin định danh vào prompt/trace của bên thứ ba.
- Học liệu và knowledge graph có provenance, version, trạng thái duyệt và khả năng rollback.
- Offline dùng event/attempt ID bất biến và thao tác sync idempotent để tránh tạo trùng hoặc ghi đè bài làm.

Các lựa chọn stack trong PRD là **định hướng**, chưa phải quyết định đóng băng nếu chưa có ADR tương ứng.

## Tài liệu nguồn

Bắt đầu tại [docs/INDEX.md](/docs/INDEX.md). Thứ tự đọc trước khi code:

1. [Problem Statement](/docs/problem-statement.md)
2. [PRD](/docs/prd.md)
3. [Đặc tả MVP & Acceptance Criteria](/docs/mvp-spec.md)
4. [Yêu cầu Phi chức năng, An toàn & Dữ liệu](/docs/non-functional-requirements.md)
5. [Product Decisions](/docs/product-decisions.md)
6. [Kế hoạch Pilot & Đo lường](/docs/pilot-and-measurement.md)
7. [PDF → Knowledge Graph](/docs/pdf-to-knowledge-graph.md)

## Definition of Ready trước khi code

Đội phát triển chỉ bắt đầu khi:

- Các câu hỏi P0 trong Product Decisions đã có owner và quyết định.
- Phạm vi P0, user stories và acceptance criteria được product/education/engineering cùng duyệt.
- Có ít nhất một knowledge graph mẫu đã được chuyên gia duyệt, cùng bộ câu hỏi diagnostic/remediation/transfer test tối thiểu.
- Luồng dữ liệu, consent, retention và quyền truy cập dữ liệu học sinh được chấp thuận.
- Có wireflow cho 3 luồng P0: tạo/giao bài, học sinh làm diagnostic, giáo viên xem và hành động.
- Kế hoạch pilot, baseline, event tracking và tiêu chí go/no-go được chốt.

## Quy tắc đồng bộ tài liệu

`README.md` và `docs/` là nguồn đặc tả chính thức. Thay đổi kiến trúc, API, schema, AI output, offline behavior, nội dung học tập hoặc workflow người dùng phải cập nhật tài liệu liên quan trong cùng thay đổi.
