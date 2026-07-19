# Agent Instructions

This file is intentionally concise. Do not duplicate project architecture,
subsystem specs, API contracts, schema details, hardware behavior, or workflow
plans here.

## Source Of Truth

Before starting any task:

1. Read `README.md`.
2. Read `docs/INDEX.md`.
3. Read the relevant documents in `docs/` for the subsystem being changed.
4. Treat `README.md` and `docs/` as the authoritative project specification.
5. Verify assumptions against those documents before changing code or docs.

## Documentation Synchronization

Keep documentation and implementation synchronized.

When a change affects architecture, APIs, database schema, robot communication,
AI training, model outputs, frontend behavior, backend behavior, embedded
firmware, folder structure, or development workflow, update the affected docs in
the same task.

## Implementation Rules

- Keep changes focused and maintainable.
- Avoid duplicate implementations and redundant documentation.

## Completion Checklist

Before finishing a task:

1. Confirm implementation matches `README.md` and relevant docs.
2. Update any affected documents.
3. Remove outdated or conflicting documentation.
4. Confirm README and docs remain synchronized.
