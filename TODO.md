# TODO: Next Steps Plan (excluding OpenAPI YAML changes)

## Scope

- The OpenAPI spec at `api-docs/openapi.yaml` is authoritative and remains unchanged. This plan addresses code and configuration fixes only.

### 1. Fix Swagger docs (JSDoc) configuration

- Tasks
  - [ ] Update `src/config/swagger.ts` to scan component files:
    - Set `apis` to `['./src/components/**/*.routes.ts', './src/components/**/*.controller.ts']`.
  - [ ] Verify `/api-docs` renders Users and Health endpoints locally.
- Acceptance criteria
  - Visiting `/api-docs` lists Users and Health operations without errors.

### 2. Align user validation, controllers, and services

- Problem
  - Registration schema uses `name`; repositories/services expect `firstName`/`lastName`.
  - Controllers re-parse Zod schemas even though the validation middleware already parsed the request.
- Tasks
  - [ ] `src/components/users/users.validation.ts`: Replace `name` with `firstName` and `lastName` under `body`.
  - [ ] `src/components/users/users.types.ts`: Ensure `UserRegistrationInput` (inferred) reflects `firstName`/`lastName`.
  - [ ] `src/components/users/users.controller.ts`:
    - Remove redundant `UserRegistrationSchema.parse(req.body)` and `UserLoginSchema.parse(req.body)`.
    - Use `req.body` directly (already validated by middleware).
    - Remove any now-unused imports.
  - [ ] `src/components/users/users.service.ts` (non‑Prisma branch):
    - Replace `parseFullName(user.name)` with direct `user.firstName`/`user.lastName`.
  - [ ] Smoke test both repository modes by toggling `USE_PRISMA`.
- Acceptance criteria
  - `POST /api/v1/users/register` accepts `{ firstName, lastName, email, password }`.
  - `POST /api/v1/users/login` accepts `{ email, password }`.
  - Responses conform to existing shapes; no Zod errors thrown in controllers.
  - Type check and lint pass with no new warnings.

### 3. Make component auto-discovery production-safe

- Problem
  - `ComponentRegistry` tries to import `index.ts` only; fails after build where `.js` exists.
- Tasks
  - [ ] `src/common/core/ComponentRegistry.ts`:
    - In `autoDiscover`, detect and import `index.js` (preferred in prod) or `index.ts` (dev).
    - Log which file is imported; skip directories missing both.
  - [ ] Verify component mounting in:
    - Dev: `npm run dev`
    - Prod: `npm run build && node dist/server.js`
- Acceptance criteria
  - Health and Users components mount in both dev and prod builds.

### 4. Improve logging user identification (optional)

- Tasks
  - [ ] `src/common/middleware/logging.middleware.ts`:
    - Prefer `req.user?.id` when available for `userId`.
    - Optionally, decode JWT using `jsonwebtoken.decode` to populate `userId` when `req.user` is absent (behind an env flag).
- Acceptance criteria
  - Request/response/error logs include `requestId` and `userId` when present. No crashes if token is missing/invalid.

### 5. Quality gates and verification

- Tasks
  - [ ] `npm run type-check`
  - [ ] `npm run lint`
  - [ ] `npm test`
  - [ ] `npm run build` and start the dist server to verify route discovery and docs.
- Acceptance criteria
  - All commands succeed; `/`, `/api/v1/health`, `/api/v1/users/*` work in dev and prod.

### 6. Delivery and rollback

- Workflow
  - [ ] Create branch: `chore/next-steps-implementation`
  - [ ] Small, focused commits per task; link to this TODO.
  - [ ] If regressions appear, revert the specific commit; changes are isolated.

### 7. Estimates

- Swagger config: S (≤30m)
- Validation/Controllers/Service alignment: M (1–2h)
- ComponentRegistry import hardening: M (1–2h)
- Logging userId (optional): S (≤45m)
- Verification: S (≤30m)

> The full AI-Friendly Template Compliance Plan has been moved to `COMPLIANCE_PLAN.md`.
