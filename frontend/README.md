# Mina AI Frontend

Tài liệu tổng quan cho runtime chính nằm ở [README gốc](../README.md), [docs/source-code.md](../docs/source-code.md) và [docs/architecture.md](../docs/architecture.md).

## Mục đích

`frontend/` là ứng dụng React + Vite của Mina AI. Frontend chịu trách nhiệm:

- Đăng nhập và khôi phục phiên bằng cookie `HttpOnly`.
- Hiển thị luồng học sinh: assignments, diagnostic, remediation, transfer, result.
- Hiển thị luồng giáo viên: classes, assignments, learning session evidence.
- Gọi FastAPI backend qua repository layer và validate response bằng Zod.

Frontend không tự chấm câu trả lời và không tự xác định root cause. Quyết định điều hướng pha học tiếp theo đến từ backend.

## Chạy nhanh

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL="http://localhost:8000/api/v1"
$env:VITE_ENABLE_MSW="false"
npm run dev
```

URL mặc định:

```text
http://localhost:5173
```

Nếu muốn dùng mock trong development:

```powershell
cd frontend
$env:VITE_ENABLE_MSW="true"
npm run dev
```

## Test và build

```powershell
cd frontend
npm run typecheck
npm run lint
npm run test:run
npm run build
```

## Lưu ý

- Browser MSW chỉ bật trong development khi `VITE_ENABLE_MSW=true`.
- Request thật dùng `credentials: "include"`.
- Route guards ở frontend chỉ phục vụ UX; backend vẫn là nơi enforce authentication và role.
- `teacher/groups` và `teacher/interventions` hiện là placeholder route.
