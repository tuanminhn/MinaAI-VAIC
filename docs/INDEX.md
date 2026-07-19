# Danh mục tài liệu Mina AI

Tài liệu trong thư mục này là nguồn đặc tả chính thức của Mina AI. Trạng thái dùng trong bảng:

- **Draft:** đủ để thảo luận, còn quyết định mở.
- **Review:** cần product/education/engineering xác nhận.
- **Approved:** có thể dùng làm đầu vào triển khai.

| Tài liệu | Mục đích | Trạng thái |
| --- | --- | --- |
| [Problem Statement](/docs/problem-statement.md) | Bài toán, đối tượng, ràng buộc và giả thuyết giá trị | Review |
| [PRD](/docs/prd.md) | Tầm nhìn, phạm vi, tính năng, kiến trúc định hướng và roadmap | Review |
| [MVP Spec](/docs/mvp-spec.md) | Phạm vi P0/P1, user stories, quy tắc nghiệp vụ và acceptance criteria | Review |
| [Hackathon Work Breakdown](/docs/hackathon-work-breakdown.md) | Backlog chia việc, dependency và các luồng làm song song; không có deadline/worklog | Review |
| [Non-functional Requirements](/docs/non-functional-requirements.md) | Hiệu năng, offline, bảo mật, quyền riêng tư, AI safety và vận hành | Review |
| [Product Decisions](/docs/product-decisions.md) | Giả định, câu hỏi mở, decision log và điều kiện sẵn sàng | Draft |
| [Pilot & Measurement](/docs/pilot-and-measurement.md) | Thiết kế pilot, KPI, event tracking và go/no-go | Review |
| [PDF → Knowledge Graph](/docs/pdf-to-knowledge-graph.md) | Quy trình tạo, duyệt và version hóa knowledge graph từ SGK | Review |
| [Kiến trúc kỹ thuật Task 2](/docs/technical-architecture.md) | Stack đã chốt, schema, API, diagnostic engine và cách chạy prototype | Implemented |

## Thứ tự làm việc trước pilot

1. Xác nhận bài toán, beachhead và outcome trong Problem Statement/PRD.
2. Trả lời toàn bộ quyết định P0 trong Product Decisions.
3. Duyệt MVP Spec và Non-functional Requirements.
4. Đối chiếu implementation với Kiến trúc kỹ thuật Task 2 và chia owner tích hợp theo Hackathon Work Breakdown.
5. Chuẩn bị nội dung mẫu theo PDF → Knowledge Graph.
6. Chốt Pilot & Measurement.

## Quy tắc quản trị

- Mọi yêu cầu bắt buộc phải có mã ổn định (`FR-*`, `NFR-*`, `MET-*`) để liên kết issue, test và quyết định.
- Nội dung chưa xác nhận phải ghi rõ là giả định hoặc câu hỏi mở, không trình bày như sự thật.
- Thay đổi phạm vi P0 phải cập nhật PRD, MVP Spec, kế hoạch pilot và decision log trong cùng pull request.
