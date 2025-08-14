# Repository Guidelines

## Project Structure & Module Organization

- Source lives in `src/` (entry: `src/server.ts`).
- Route components auto-discover from `src/components/*/index.ts` and mount at `/api/v{version}/{name}` via `BaseComponent`.
- Shared code: `src/common/*` (base classes, middleware, utils), `src/config/*` (env + Swagger), `src/services/*`.
- Data layers: `src/repositories/*` (Prisma/Postgres), `src/database/*` (Mongoose/Mongo), `prisma/*` (schema, migrations).
- Tests: Jest alongside sources as `*.spec.ts`; Playwright E2E in `e2e/*`.
- Docs: Swagger served at `/api-docs`.

## Build, Test, and Development Commands

- `npm run dev`: Start local server with hot reload (port `4010`).
- `npm run build`: Compile TypeScript to `dist/`.
- `npm start`: Run compiled server from `dist/`.
- `npm test`: Run Jest unit/integration tests. Use `SKIP_DB_CONNECTION=true` for DB-free runs.
- `npm run test:e2e`: Run Playwright E2E tests.
- `npm run lint` / `npm run type-check`: Lint and strict TS checks.

## Coding Style & Naming Conventions

- Language: TypeScript 5 (strict). Prefer async/await and typed interfaces.
- Indentation: 2 spaces. Keep functions small and focused.
- Naming: files `kebab-case.ts`; classes `PascalCase`; functions/vars `camelCase`; tests `*.spec.ts`.
- Linting/formatting: ESLint via `npm run lint`. Fix obvious issues before PRs.

## Testing Guidelines

- Frameworks: Jest + Supertest (API), Playwright (E2E).
- Placement: unit/integration tests live next to code; E2E under `e2e/`.
- Env isolation: export `SKIP_DB_CONNECTION=true` to enable mock repositories.
- Aim for meaningful coverage: include happy paths, validation, and error cases.

## Commit & Pull Request Guidelines

- Commits: clear, present-tense messages (optionally scoped, e.g., `users:`). Group related changes.
- PRs: describe intent, key changes, and testing done; link issues. Include screenshots/logs for behavior changes. Keep diffs focused.

## Security & Configuration Tips

- Configuration validated in `src/config/index.ts`. Set `JWT_SECRET` (≥32 chars), DB/Redis vars, and `CORS_ORIGIN`.
- Feature flags: `USE_PRISMA` selects Postgres; `SKIP_DB_CONNECTION` enables mock mode.
- Components extend `BaseComponent` for conventional routing; prefer this over manual mounts.
