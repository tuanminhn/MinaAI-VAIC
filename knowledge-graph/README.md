# Mina AI Knowledge Graph

Pipeline Python cho Task 1 - xử lý dữ liệu và Knowledge Graph từ bốn SGK scan trong `raw/`.

## Phạm vi

- Chuẩn chính: Chương trình GDPT 2018; mapping SGK Kết nối tri thức được giữ cho nguồn lớp 6–7 hiện có.
- Môn: Toán.
- Khối: lớp 6, 7, 8 và 9.
- Đồ thị demo: bản đồ chương trình Toán THCS lớp 6–9; bài diagnostic tổng hợp dành cho học sinh lớp 9.

PDF hiện tại là bản scan, không có text layer. Pipeline không coi text rỗng là dữ liệu hợp lệ. Nó tạo manifest/checksum, render trang cần review và xuất dataset curated có provenance. OCR tự động chưa được bật trong phiên bản này vì môi trường chưa có OCR tiếng Việt đáng tin cậy; không dùng OCR kém chất lượng để tự phát hành dữ liệu giáo dục.

## Chạy

Không cần cài package Python ngoài standard library. Cần có Poppler `pdfinfo` và `pdftoppm` trong `PATH`. Nếu có `pypdf`, bước inspect sẽ dùng nó để kiểm tra text layer; nếu thiếu, manifest ghi rõ probe không khả dụng.

```bash
cd knowledge-graph
python3 -m mina_kg.cli all
python3 -m unittest discover -s tests -v
```

Nếu chạy trực tiếp từ repo mà chưa cài package:

```bash
PYTHONPATH=knowledge-graph/src python3 -m mina_kg.cli all \
  --root knowledge-graph
```

Các lệnh riêng:

```bash
PYTHONPATH=knowledge-graph/src python3 -m mina_kg.cli inspect --root knowledge-graph
PYTHONPATH=knowledge-graph/src python3 -m mina_kg.cli render --root knowledge-graph
PYTHONPATH=knowledge-graph/src python3 -m mina_kg.cli build --root knowledge-graph
PYTHONPATH=knowledge-graph/src python3 -m mina_kg.cli validate --root knowledge-graph
```

## Output

| File | Nội dung |
| --- | --- |
| `output/source_manifest.json` | PDF checksum, số trang, text-layer status và phạm vi |
| `output/knowledge_graph.json` | Canonical skills, curriculum mappings và edges |
| `output/misconceptions.json` | Misconception/error patterns |
| `output/questions.json` | Diagnostic, remediation và transfer questions |
| `output/remediation_paths.json` | Repair-and-Return path |
| `output/demo_students.json` | Ba học sinh giả lập và expected diagnosis |
| `output/validation_report.json` | Kết quả kiểm tra reference, DAG, provenance và scope |
| `output/review-pages/` | Trang PNG để reviewer đối chiếu, không commit mặc định |

## Quy tắc dữ liệu

- ID là deterministic, không do LLM tự sinh.
- Mỗi skill/question có provenance tới `book_id` và trang PDF.
- Nội dung curated mặc định ở trạng thái `pending`; dataset demo V1 hiện ở trạng thái `approved` sau vòng rà soát Toán học có ghi metadata người/phương thức duyệt trong `dataset`.
- Chỉ edge `prerequisite` phải tạo DAG.
- Question loại `transfer` không được trùng stem với question `remediation`.
- Không đưa dữ liệu ngoài Toán lớp 6–9 theo GDPT 2018 vào dataset.

Dataset hiện có 156 skills và 175 edges phủ bốn lớp 6–9 theo ba mạch của Chương trình GDPT 2018: Số và Đại số; Hình học và Đo lường; Thống kê và Xác suất. Các năng lực tổng hợp vẫn được giữ để tương thích diagnostic, đồng thời micro-skill chi tiết có provenance tới trang yêu cầu cần đạt tương ứng (lớp 6: trang 47–54; lớp 7: 55–62; lớp 8: 63–69; lớp 9: 71–77).

Mapping SGK Kết nối tri thức Toán 6 Tập 1 được đối chiếu từ metadata 22 bài/41 kỹ năng: 27 micro-skill chưa có đã được bổ sung và các kỹ năng trùng nghĩa được gắn provenance vào canonical node thay vì tạo bản sao. Tổng cộng 43 canonical node hiện tham chiếu `KNTT_TOAN_6_T1`, phủ trang 5–111. Dataset câu hỏi hiện có 21 misconceptions, 28 câu hỏi và 3 lộ trình Repair-and-Return; 12 câu diagnostic lớp 9 phủ Đại số, Hình học, Thống kê và Xác suất.

Độ phủ catalog không đồng nghĩa mọi node đều đã có đủ diagnostic/remediation. Validation phân biệt tính hợp lệ cấu trúc của graph với độ phủ ngân hàng câu hỏi; trước pilot, giáo viên Toán vẫn phải xác nhận nội dung và quan hệ sư phạm.

## Human review bắt buộc

1. Đối chiếu skill và edge với các trang nguồn đã render.
2. Kiểm tra mỗi distractor có thật sự biểu hiện misconception đã gắn.
3. Kiểm tra đáp án, ký hiệu, độ khó và ngôn ngữ học sinh.
4. Đổi `review_status` sang `approved` chỉ sau khi reviewer ký duyệt; khi sửa nội dung đã duyệt, phải đưa mục bị ảnh hưởng về `pending` để duyệt lại.

## Kết quả duyệt dataset demo V1

Ngày 2026-07-18, dataset được rà soát theo phạm vi skill, prerequisite edge, đáp án, distractor và misconception. Vòng duyệt đã:

- tách các liên kết chỉ mang tính hỗ trợ khỏi quan hệ prerequisite;
- thu hẹp skill gộp nhiều hành vi về một hành vi có thể đánh giá;
- tách hai misconception quy đồng khác nhau;
- sửa distractor transfer để khớp đúng error pattern được gắn.

Metadata `reviewed_at`, `reviewed_by` và `review_scope` được lưu trong `output/knowledge_graph.json`. Đây là vòng duyệt có AI hỗ trợ theo ủy quyền của chủ dự án; trước khi dùng trong lớp học thật vẫn nên có giáo viên Toán chịu trách nhiệm nội dung xác nhận lại.
