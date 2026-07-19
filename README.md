# Mina AI

Mina AI là **co-teacher thích ứng cho lớp học phổ thông có trình độ không đồng đều**. Sản phẩm giúp giáo viên phát hiện nguyên nhân gốc của lỗi sai, ưu tiên học sinh cần hỗ trợ, chia nhóm theo nhu cầu và giao lộ trình bù hổng ngắn; học sinh được quay lại đúng kỹ năng nền còn thiếu rồi trở về bài học hiện tại.

## Trạng thái

Dự án đang ở giai đoạn **hackathon prototype**. Task 1 (dataset/knowledge graph) đã được duyệt cho demo; Task 2 (Next.js full-stack, PostgreSQL schema và diagnostic engine) đã được triển khai. Bản này phục vụ demo, chưa được tuyên bố production-ready hoặc sẵn sàng dùng trong lớp thật.

## Beachhead và phạm vi MVP

- Người dùng chính: giáo viên Toán THCS và học sinh trong lớp của họ.
- Phạm vi dữ liệu MVP: **Toán lớp 6–9 theo Chương trình GDPT 2018**; bài diagnostic dành cho học sinh lớp 9 và truy ngược prerequisite về lớp 6–8.
- Knowledge graph dùng ontology chương trình độc lập bộ sách. Provenance SGK Kết nối tri thức hiện có cho lát cắt lớp 6–7; node lớp 8–9 dùng văn bản chương trình chính thức và cần bổ sung mapping trang SGK trước pilot.
- Nền tảng: web app/PWA cho giáo viên và học sinh.
- Điều kiện vận hành: hỗ trợ mạng yếu và học sinh tiếp tục làm nhiệm vụ đã tải khi offline.
- Chuẩn nội dung: Chương trình GDPT 2018; mapping bộ sách được lưu riêng khi có nguồn trang đã kiểm duyệt.

Ngoài MVP: dữ liệu lớp 1–5 hoặc lớp 10–12, bộ Cánh diều/Chân trời sáng tạo, chatbot tự do, chấm bài viết tay, ứng dụng phụ huynh đầy đủ, gamification phức tạp và dashboard cấp Sở/Phòng.

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
- Prototype có bốn luồng AI hỗ trợ: giải thích câu sai sau khi học sinh đã nộp và khóa bài, tóm tắt lớp đã khử định danh, bản nháp kế hoạch dạy lại cho nhóm và bộ luyện tập cá nhân hóa cho từng học sinh. Bộ luyện tập luôn mở ở trạng thái bản nháp để giáo viên review rồi mới giao; không có gợi ý trong lúc làm diagnostic và AI không thay đổi diagnosis hay điểm diagnostic.
- Dữ liệu học sinh tối thiểu hóa theo mục đích, phân quyền theo lớp và không đưa thông tin định danh vào prompt/trace của bên thứ ba.
- Học liệu và knowledge graph có provenance, version, trạng thái duyệt và khả năng rollback.
- Offline dùng event/attempt ID bất biến và thao tác sync idempotent để tránh tạo trùng hoặc ghi đè bài làm.

Stack prototype đã chốt là **Next.js + TypeScript cho frontend và backend**, PostgreSQL qua `DATABASE_URL`, và diagnostic engine TypeScript chạy phía server. Chi tiết hiện trạng, schema và API nằm trong [Kiến trúc kỹ thuật Task 2](/docs/technical-architecture.md).

## Chạy prototype local

Yêu cầu Bun 1.3+. Tạo `.env` ở root với `DATABASE_URL` trỏ tới PostgreSQL, sau đó chạy:

```bash
bun install
bun run db:setup
bun run dev
```

Mở `http://localhost:3000`; student flow ở `/student`, teacher dashboard ở `/teacher`. Không đặt `NEXT_PUBLIC_` trước `DATABASE_URL`: biến này chỉ được đọc trong server code.

Bốn tính năng AI mặc định gọi FPT AI Inference tại `https://mkp-api.fptcloud.com/chat/completions` với model `DeepSeek-V4-Flash`. Chỉ cần đặt API key server-only trong `LLM_API_KEY`; `LLM_BASE_URL` và `LLM_MODEL` vẫn có thể đổi để dùng endpoint tương thích OpenAI khác. Có thể chỉnh `LLM_TIMEOUT_MS` (mặc định 30000 ms), `LLM_MAX_TOKENS` (1600), `LLM_MAX_RETRIES` (1) hoặc đặt `LLM_ENABLED=false`. Khi chưa có key, bị tắt, timeout, provider lỗi hoặc output sai schema, giao diện vẫn hoạt động bằng bản dự phòng deterministic và hiển thị rõ chế độ này. Không đặt `NEXT_PUBLIC_` trước bất kỳ API key nào.

Tài khoản học sinh demo chỉ bắt buộc SBD; họ tên là tùy chọn. Seed cung cấp `9001` (Minh), `9002` (An), `9003` (Lan). SBD đã tồn tại sẽ tải hồ sơ cũ và không đổi tên đã lưu; SBD mới tự tạo học sinh trong lớp demo, dùng tên đã nhập hoặc `Học sinh {SBD}` nếu bỏ trống. SBD được giữ trong cookie HttpOnly 60 phút. Đây là cơ chế tiện cho hackathon, không phải authentication production; pilot thật phải dùng mã lớp + token/PIN có thể thu hồi và chống dò.

Các lệnh kiểm tra:

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

## Tài liệu nguồn

Bắt đầu tại [docs/INDEX.md](/docs/INDEX.md). Thứ tự đọc trước khi code:

1. [Problem Statement](/docs/problem-statement.md)
2. [PRD](/docs/prd.md)
3. [Đặc tả MVP & Acceptance Criteria](/docs/mvp-spec.md)
4. [Hackathon Work Breakdown](/docs/hackathon-work-breakdown.md)
5. [Yêu cầu Phi chức năng, An toàn & Dữ liệu](/docs/non-functional-requirements.md)
6. [Product Decisions](/docs/product-decisions.md)
7. [Kế hoạch Pilot & Đo lường](/docs/pilot-and-measurement.md)
8. [PDF → Knowledge Graph](/docs/pdf-to-knowledge-graph.md)
9. [Kiến trúc kỹ thuật Task 2](/docs/technical-architecture.md)

## Definition of Ready trước pilot

Prototype hackathon có thể tiếp tục với giả định được ghi rõ. Trước pilot/lớp thật cần:

- Các câu hỏi P0 trong Product Decisions đã có owner và quyết định.
- Phạm vi P0, user stories và acceptance criteria được product/education/engineering cùng duyệt.
- Có ít nhất một knowledge graph mẫu đã được chuyên gia duyệt, cùng bộ câu hỏi diagnostic/remediation/transfer test tối thiểu.
- Luồng dữ liệu, consent, retention và quyền truy cập dữ liệu học sinh được chấp thuận.
- Có wireflow cho 3 luồng P0: tạo/giao bài, học sinh làm diagnostic, giáo viên xem và hành động.
- Kế hoạch pilot, baseline, event tracking và tiêu chí go/no-go được chốt.

## Quy tắc đồng bộ tài liệu

`README.md` và `docs/` là nguồn đặc tả chính thức. Thay đổi kiến trúc, API, schema, AI output, offline behavior, nội dung học tập hoặc workflow người dùng phải cập nhật tài liệu liên quan trong cùng thay đổi.
