# AGENTS.md

This file gives AI coding agents a fast, reliable mental model of this project so you can navigate, modify, and test it safely.

## Overview

- Purpose: Express 5 + TypeScript microservice template that powers a “registration API” with users/auth, health checks, and example modules for registration and schedule. Designed for production readiness and AI-friendly contribution.
- Style: Component-based architecture with auto-discovery, centralized logging/error handling, and dual data-layer support (MongoDB via Mongoose and PostgreSQL via Prisma/pg). Swagger docs, comprehensive tests, and Docker are included.

## Tech Stack

- Runtime: Node.js 18+, TypeScript 5.8 (strict)
- Web: Express 5.1, Helmet, CORS, rate-limits
- Validation: Zod
- Auth: JWT; OAuth (Google/GitHub/Facebook); optional 2FA (speakeasy/qrcode)
- Data: Prisma (PostgreSQL), Mongoose (MongoDB), Redis (cache)
- Realtime: Socket.IO
- Docs: Swagger (swagger-jsdoc + swagger-ui-express)
- Testing: Jest + Supertest; Playwright for E2E
- Logging: Pino (+ pino-pretty in dev)
- Packaging: Docker + Compose

## How It Runs

- Entrypoint: `src/server.ts`
  - Loads config (`src/config/index.ts`), middleware, Swagger, and components.
  - Connects to Postgres, Mongo, and Redis unless `SKIP_DB_CONNECTION=true`.
  - Auto-discovers components from `src/components/**/index.(ts|js)` and mounts to Express.
  - Initializes services (OAuth, service discovery, Socket.IO, event bus) and graceful shutdown.

### Key Commands

- Dev: `npm run dev` (default port `4010`)
- Build: `npm run build` → `dist/server.js`
- Start: `npm start`
- Tests: `npm test` (Jest); `npm run test:e2e` (Playwright)
- Lint/Types: `npm run lint`, `npm run type-check`
- Prisma: `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`

### Environment

Config is validated by Zod in `src/config/index.ts`. Required/used variables include:

- Core: `NODE_ENV`, `PORT` (default 4010), `CORS_ORIGIN`, `LOG_LEVEL`
- JWT: `JWT_SECRET` (≥32 chars), `JWT_EXPIRES_IN`
- Mongo: `MONGODB_URI`
- Postgres: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- Redis: `REDIS_HOST`, `REDIS_PORT`
- OAuth: `GOOGLE_CLIENT_ID|SECRET`, `GITHUB_CLIENT_ID|SECRET`, `FACEBOOK_CLIENT_ID|SECRET`
- Other: `BASE_URL`, feature flags like `USE_PRISMA` (not Zod-validated), `SKIP_DB_CONNECTION`

Tip: Treat `src/config/index.ts` as source of truth; `.env.example` may diverge.

## Project Structure

- `src/server.ts`: App bootstrap, DB connections, component discovery/mounting, error handling, shutdown.
- `src/components/*`: Self-contained features (health, users, registration, schedule).
- `src/common/*`: Base classes, component registry, middleware, utils, types, test helpers.
- `src/repositories/*`: Prisma-based repositories (primary path when `USE_PRISMA=true`).
- `src/database/*`: Low-level connections, Mongoose models, and Mongoose-based repositories (legacy/alt path).
- `src/services/*`: Socket.IO, event system, OAuth, API gateway, service discovery, 2FA.
- `src/config/*`: Env parsing/validation and Swagger config.
- `prisma/*`: Prisma schema, seed, migrations.
- `e2e/*`: Playwright tests.

## Routing and Components

- Base pattern: Components that extend `BaseComponent` default to `basePath = /api/v{version}/{name}` and mount their own router.
- Health component (`src/components/health`):
  - Paths: `/api/v1/health`, `/api/v1/health/ready`, `/api/v1/health/live`
  - Checks Mongo, Postgres, Redis; honors `SKIP_DB_CONNECTION` for mock mode.
- Users component (`src/components/users`):
  - Paths: `/api/v1/users/register`, `/api/v1/users/login`
  - Zod validation, JWT issuance, repository pattern with dual backing stores.
- Registration and Schedule components:
  - Manually defined `IComponent` objects (do not extend `BaseComponent`).
  - Current base paths: `/v1/registration`, `/v1/schedule` (note missing `/api` prefix). Protected by API-key middleware.

## Data Layer

- Prisma (Postgres): `src/repositories/user.repository.ts`, `prisma/schema.prisma`
  - Handles hashing on create/update, login attempt tracking, 2FA backup codes, pagination.
- Mongoose (Mongo): `src/database/models/*.ts`, `src/database/repositories/*.ts`
  - Rich user model with OAuth, 2FA, indices; repository mirrors the Prisma surface.
- Runtime selection:
  - Users service toggles repository via `USE_PRISMA` env flag.
  - `SKIP_DB_CONNECTION=true` enables mock repositories for tests/e2e.

## Services (Selected)

- Socket.IO: `src/services/socket.service.ts` – initialized after HTTP server starts.
- Events: `src/services/event.service.ts` – emits lifecycle events (startup/shutdown/error).
- OAuth: `src/services/oauth.service.ts` – providers: Google, GitHub, Facebook.
- Service Discovery: `src/services/service-discovery.service.ts`
- API Gateway: `src/services/api-gateway.service.ts` – routes via `/api/v1/gateway`.

## Testing

- Unit/Integration: Jest (`npm test`), with tests under `src/**/**/*.spec.ts`.
- E2E: Playwright (`npm run test:e2e`), reports in `playwright-report/`.
- DB-free mode: Export `SKIP_DB_CONNECTION=true` to bypass real databases during certain tests.

## API Docs

- Swagger UI: `/api-docs` from `src/config/swagger.ts`.
- Note: Current swagger-jsdoc globs target `./src/api/**/*.routes.ts` and `./src/api/**/*.controller.ts`, but code lives under `src/components/**`. Update globs to include components to surface all endpoints.

## Known Inconsistencies and Gotchas

- Swagger globs: Update to `./src/components/**/*.routes.ts` and `./src/components/**/*.controller.ts` so component JSDoc appears in `/api-docs`.
- Base paths: Health/Users are `/api/v1/*`, but Registration/Schedule are `/v1/*`. Align by converting these to extend `BaseComponent` or change their `basePath` to `/api/v1/...`.
- Env var drift: `.env.example` may use `*_URL` variables; runtime expects granular vars (`POSTGRES_HOST`, etc.). Prefer `src/config/index.ts` names or enhance config to also accept URL forms.
- Dual data models: Users service supports both Prisma and Mongoose; ensure tests and responses normalize shapes (e.g., name vs first/last). Code handles this, but pay attention when adding fields.
- License mismatch: Swagger info references MIT; `package.json` uses ISC. Pick one and unify if relevant to your change.
- Port references: Docs and scripts use 4010 for local dev; Docker Compose references 3001 in some places. Keep consistent per environment when modifying.

## Change Safely: DOs and DON’Ts

- Do keep component structure intact; prefer extending `BaseComponent` for new components.
- Do update Swagger JSDoc when adding routes; ensure swagger-jsdoc globs capture your files.
- Do respect repository pattern boundaries; avoid mixing business logic in controllers.
- Do add focused tests near the code you change; don’t introduce unrelated refactors.
- Don’t break both Prisma and Mongoose paths—guard with feature flags and keep shapes consistent.
- Don’t modify unrelated configs or env validation without clear need.

## Quick Recipes

- Add endpoint to Users:
  1. Define Zod schema in `src/components/users/users.validation.ts`
  2. Implement logic in `users.service.ts`
  3. Add route in `users.routes.ts` and handler in `users.controller.ts`
  4. Add JSDoc for Swagger and tests in `users.*.spec.ts`

- Add a new component `foo`:
  1. Scaffold folder under `src/components/foo`
  2. Create `index.ts` extending `BaseComponent` and set version/name
  3. Implement `foo.routes.ts`, `foo.controller.ts`, `foo.service.ts`
  4. Rely on auto-discovery; no manual mount needed

## Troubleshooting

- Swagger shows no routes: Fix `apis` globs in `src/config/swagger.ts` and restart.
- Health checks fail locally: Set `SKIP_DB_CONNECTION=true` during isolated dev/tests, or ensure Mongo/Postgres/Redis are running.
- E2E tests can’t reach server: Confirm port (4010 locally) and that `npm run dev` is active; for Docker, check mapped ports.
- Prisma client missing: Run `npm run prisma:generate` and re-run build.

## Pointers to Important Files

- App: `src/server.ts`
- Components: `src/components/**/index.ts`
- Users: `src/components/users/*`
- Health: `src/components/health/*`
- Registration: `src/components/registration/*`
- Schedule: `src/components/schedule/*`
- Config: `src/config/index.ts`, `src/config/swagger.ts`
- DB: `src/repositories/*`, `src/database/*`, `prisma/schema.prisma`
- Middleware: `src/common/middleware/*`
- Core infra: `src/common/core/ComponentRegistry.ts`, `src/common/base/*`

---

Maintainer note for AI agents: Prefer minimal, surgical changes aligned with existing patterns. If you must deviate (e.g., align base paths or Swagger globs), isolate the change and call it out in PR descriptions.
