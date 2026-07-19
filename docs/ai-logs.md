# AI Logs

Tài liệu này phục vụ yêu cầu mô tả AI Logs của dự án, nhưng chỉ ghi đúng phạm vi runtime hiện tại.

## Phạm vi hiện tại

- Active runtime hiện dùng deterministic engine cho diagnostic, remediation và transfer.
- AI runtime trong FastAPI chưa được tích hợp.
- File này ghi prompt mẫu, quy ước log và hook dự kiến cho giai đoạn mở rộng.
- Các log thực tế chỉ nên được thêm khi model gateway được triển khai trong backend.

## Prompt mẫu

Các prompt dưới đây là **mẫu thiết kế**, không phải prompt đang chạy trong runtime hiện tại.

### Question generation candidate

```text
SYSTEM:
Bạn tạo câu hỏi học tập dựa hoàn toàn trên dữ liệu nguồn được cung cấp.
Không thêm kiến thức ngoài nguồn.
Chỉ trả JSON đúng schema.

INPUT:
- subject
- grade
- skillCode
- difficulty
- misconception
- knowledgeChunks

OUTPUT:
- prompt
- options
- correctOptionCode
- explanation
- sourceChunkIds
```

### Explanation generation

```text
SYSTEM:
Bạn tạo lời giải thích ngắn gọn cho học sinh.
Ngôn ngữ phải phù hợp với lớp học được yêu cầu.
Không phán xét.
Không dùng thông tin ngoài knowledge source.
Chỉ trả JSON đúng schema.

INPUT:
- language
- grade
- skillCode
- misconception
- approvedKnowledgeChunks
- expectedSchema

OUTPUT:
- explanation
- hints
- sourceChunkIds
```

### Teacher summary

```text
SYSTEM:
Bạn tóm tắt dữ liệu lớp học cho giáo viên.
Chỉ dùng dữ liệu tổng hợp đã được cung cấp.
Không tạo nhận xét vượt quá dữ liệu.
Chỉ trả JSON đúng schema.

INPUT:
- assignmentStats
- learningStatuses
- rootCauseGroups
- timeWindow

OUTPUT:
- summary
- notablePatterns
- suggestedReviewPoints
```

Prompt này là **mẫu dự kiến**, không phải runtime hiện tại.

## Chat log format

**Ví dụ cấu trúc log, không phải log runtime thật**

```json
{
  "traceId": "example-trace-id",
  "useCase": "question_generation",
  "provider": "not-configured",
  "model": "not-configured",
  "promptVersion": "question-generation-v1",
  "inputReferences": [],
  "latencyMs": null,
  "inputTokens": null,
  "outputTokens": null,
  "estimatedCost": null,
  "validationStatus": "not-run",
  "fallbackUsed": false,
  "createdAt": "example"
}
```

## Hook theo yêu cầu Ban Tổ chức

### `before_model_call`

- Mục đích: ghi nhận use case, prompt version, nguồn dữ liệu đầu vào và trace ID trước khi gọi model.
- Dữ liệu được ghi: `traceId`, `useCase`, `promptVersion`, `sourceChunkIds`, timestamp.
- Dữ liệu tuyệt đối không được ghi: password, session cookie, API key, raw student identity không cần thiết.

### `after_model_call`

- Mục đích: ghi metadata sau khi model trả kết quả.
- Dữ liệu được ghi: `provider`, `model`, `latencyMs`, `inputTokens`, `outputTokens`, `estimatedCost`.
- Dữ liệu tuyệt đối không được ghi: secret, cookie, raw credential, dữ liệu cá nhân ngoài nhu cầu audit tối thiểu.

### `on_model_error`

- Mục đích: ghi lỗi gọi model để retry hoặc fallback.
- Dữ liệu được ghi: `traceId`, `useCase`, `provider`, `model`, `errorCode`, `createdAt`.
- Dữ liệu tuyệt đối không được ghi: stack trace chứa secret, full prompt có dữ liệu nhạy cảm chưa được lọc.

### `after_validation`

- Mục đích: ghi kết quả schema validation hoặc content validation sau khi model trả dữ liệu.
- Dữ liệu được ghi: `traceId`, `validationStatus`, mã lỗi validation, danh sách reference được chấp nhận.
- Dữ liệu tuyệt đối không được ghi: toàn bộ raw conversation nếu không có consent rõ ràng.

### `on_fallback`

- Mục đích: ghi việc chuyển sang provider khác hoặc deterministic fallback.
- Dữ liệu được ghi: `traceId`, `useCase`, `fallbackUsed`, `fallbackType`, `errorCode`.
- Dữ liệu tuyệt đối không được ghi: credential của provider chính hoặc provider thay thế.

## Observability fields

| Field | Trạng thái |
| --- | --- |
| `traceId` | Chưa có - dự kiến |
| `useCase` | Chưa có - dự kiến |
| `provider` | Chưa có - dự kiến |
| `model` | Chưa có - dự kiến |
| `promptVersion` | Chưa có - dự kiến |
| `sourceChunkIds` | Chưa có - dự kiến |
| `latencyMs` | Chưa có - dự kiến |
| `inputTokens` | Chưa có - dự kiến |
| `outputTokens` | Chưa có - dự kiến |
| `estimatedCost` | Chưa có - dự kiến |
| `validationStatus` | Chưa có - dự kiến |
| `fallbackUsed` | Chưa có - dự kiến |
| `errorCode` | Chưa có - dự kiến |
| `createdAt` | Chưa có - dự kiến |

## Fallback policy dự kiến

Fallback policy đề xuất:

```text
Primary model API
-> alternate provider nếu được cấu hình
-> approved deterministic content bank
```

Chính sách này chưa được triển khai trong FastAPI runtime hiện tại.

## Prompt và log security

- API key chỉ đi qua env.
- Không commit secret.
- Không log cookie.
- Không log password.
- Không dùng raw student identity nếu không cần.
- Prompt phải có version.
- Generated content phải qua validation trước khi sử dụng.
