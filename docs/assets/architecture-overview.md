# Architecture Overview

```mermaid
flowchart LR
    Student[Học sinh]
    Teacher[Giáo viên]
    FE[React + Vite]
    API[FastAPI]
    Services[Services và State Machines]
    DB[(PostgreSQL)]

    Student --> FE
    Teacher --> FE
    FE --> API
    API --> Services
    Services --> DB
```
