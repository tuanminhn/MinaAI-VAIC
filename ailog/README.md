# AI Log Package

Thư mục này gom phần tài liệu AI log theo yêu cầu nộp hồ sơ của BTC cho dự án Mina AI.

## Mục đích

Thư mục `ailog/` dùng để lưu:

- file phiên từ công cụ desktop;
- ảnh chụp màn hình liên quan;
- manifest mô tả nguồn gốc tài liệu;
- file mẫu để bổ sung link chat từ công cụ AI trực tuyến.

## Hiện đã có

- `codex/current-codex-session.jsonl`: bản sao phiên Codex hiện tại.
- `codex/current-session-history-excerpt.jsonl`: trích đoạn từ `~/.codex/history.jsonl` có liên quan tới phiên hiện tại.
- `codex/current-session-index.jsonl`: metadata phiên từ `~/.codex/session_index.jsonl`.
- `screenshots/codex-session.png`: file screenshot đã tạo trong môi trường hiện tại.
- `manifest.md`: mô tả chi tiết từng file và trạng thái thu thập.
- `online-chat-links-template.md`: mẫu để bạn tự điền các link chat khác.

## Việc bạn cần tự bổ sung

- Link các phiên chat AI trực tuyến khác.
- File phiên từ công cụ khác nếu muốn nộp chung.
- Ảnh chụp màn hình thủ công nếu cần ảnh thể hiện đúng UI đang mở.
- File `.zip` và link Google Drive nếu tổng dung lượng vượt quá 20MB.

## Gợi ý nộp

1. Điền link vào `online-chat-links-template.md` hoặc chép nội dung sang Google Doc riêng.
2. Kiểm tra lại screenshot hiện có, vì môi trường desktop tự động có thể không chụp được UI đầy đủ.
3. Nếu gom nhiều tài liệu hơn và vượt 20MB, nén toàn bộ `ailog/` thành một file `.zip` rồi tải lên Google Drive.
