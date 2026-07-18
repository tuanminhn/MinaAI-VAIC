# Mina AI Frontend

Frontend foundation for Mina AI using React, Vite, TypeScript, React Router, Tailwind CSS, shadcn-style primitives, TanStack Query, and MSW.

## Requirements

- Node.js `>=20.12.0`
- npm `>=10`

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test:run
```

## Typecheck and Lint

```bash
npm run typecheck
npm run lint
```

## Environment Variables

Copy `.env.example` to `.env` if needed.

- `VITE_API_BASE_URL`: Base URL for the future FastAPI backend.
- `VITE_ENABLE_MSW`: Enables browser MSW bootstrapping in development when set to `true`.

## MSW

- Browser MSW starts only in development and only when `VITE_ENABLE_MSW=true`.
- Test MSW is configured in `src/test/setup.ts`.
- Mock handlers live under `src/mocks/handlers/`.

## Directory Structure

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

## Architecture Boundary

Keep this flow:

```text
Page -> Hook/Query -> Repository -> HTTP or Mock adapter
```

Pages must not import raw fixture data directly.

## Authentication Boundary

- FE-003 uses MSW fixtures and a mock token only for development and test flows.
- Frontend route guards are for UX only; the future FastAPI backend must enforce authentication and role access.
- The mock session store keeps only an access token in local storage.
- Passwords are never stored or logged by the frontend.

## Not Implemented Yet

- Backend-enforced authentication
- Backend integration
- Student and teacher business screens
- Charts
- Dark mode
- PWA/service worker
