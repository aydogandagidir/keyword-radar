# Task 07 — Backend Skeleton

Create lightweight backend in `apps/web`.

Prefer Next.js API routes unless another choice is already established.

Endpoints:
- POST /api/projects
- GET /api/projects
- POST /api/runs
- GET /api/runs/:id
- POST /api/keywords/bulk

Use Zod validation.

MVP may use in-memory storage, but code must be structured so PostgreSQL can be added later.

Acceptance criteria:
- Backend starts locally.
- Endpoints validate payloads.
- API tests or basic request tests exist.
