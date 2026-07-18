# Mina AI Knowledge Graph

Pipeline Python cho Task 1 - xử lý dữ liệu và Knowledge Graph từ bốn SGK scan trong `raw/`.

## Phạm vi

- Bộ sách: Kết nối tri thức với cuộc sống.
- Môn: Toán.
- Khối: lớp 6 và lớp 7.
- Lát cắt demo: Phân số lớp 6 -> Số hữu tỉ lớp 7.

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
- Mọi nội dung curated mặc định `review_status: pending` cho đến khi chuyên gia Toán duyệt.
- Chỉ edge `prerequisite` phải tạo DAG.
- Question loại `transfer` không được trùng stem với question `remediation`.
- Không ingest dữ liệu ngoài Toán 6-7 Kết nối tri thức.

## Human review bắt buộc

1. Đối chiếu skill và edge với các trang nguồn đã render.
2. Kiểm tra mỗi distractor có thật sự biểu hiện misconception đã gắn.
3. Kiểm tra đáp án, ký hiệu, độ khó và ngôn ngữ học sinh.
4. Đổi `review_status` sang `approved` chỉ sau khi reviewer ký duyệt.
