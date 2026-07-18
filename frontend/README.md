# Mina AI Frontend

Frontend cho Mina AI dùng React, Vite, TypeScript, React Router, Tailwind CSS, shadcn-style primitives, TanStack Query và Vitest.

## Yêu cầu

- Node.js `>=20.12.0`
- npm `>=10`

## Cài dependency

```bash
npm install
```

## Chạy development

Dùng MSW:

```bash
VITE_ENABLE_MSW=true
npm run dev
```

Dùng backend thật:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENABLE_MSW=false
npm run dev
```

PowerShell:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8000/api/v1"
$env:VITE_ENABLE_MSW="false"
npm run dev
```

## Build

```bash
npm run build
```

Production build sẽ xóa `mockServiceWorker.js` khỏi `dist`.

## Test

```bash
npm run typecheck
npm run lint
npm run test:run
```

## Environment variables

- `VITE_API_BASE_URL`: base URL của FastAPI backend
- `VITE_ENABLE_MSW`: chỉ bật browser MSW trong development khi giá trị là `true`

## MSW boundary

- Browser MSW chỉ chạy trong development
- Test MSW nằm ở `src/test/setup.ts`
- Mock handlers nằm trong `src/mocks/handlers`
- Khi backend lỗi, frontend không fallback sang business fixture

## Auth boundary

- Frontend không lưu access token trong `localStorage` hoặc `sessionStorage`
- Auth thật dùng cookie `HttpOnly` do backend set
- Frontend luôn gọi request với `credentials: "include"`
- Frontend route guards chỉ phục vụ UX
- Backend vẫn phải enforce authentication và role

## Cấu trúc chính

```text
frontend/
  public/
  src/
    app/
    components/
    contracts/
    features/
    hooks/
    lib/
    mocks/
    repositories/
    routes/
    styles/
    test/
```

## Boundary kiến trúc

```text
Page -> Hook/Query -> Repository -> HTTP hoặc Mock adapter
```

Page không được import fixture trực tiếp.

## Chưa triển khai

- Backend business APIs cho assignments/diagnostic
- Teacher dashboard thật
- Charts
- Dark mode
- PWA
