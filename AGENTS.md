# Repository Guidelines

## Project Structure & Module Organization

- Source: `src/` (entry: `src/server.ts`). Components live under `src/components/*` with auto-discovery of each `index.ts`.
- Core/Shared: `src/common/*` (base classes, middleware, utils), `src/config/*` (env + Swagger), `src/services/*`.
- Data: `src/repositories/*` (Prisma/Postgres), `src/database/*` (Mongoose/Mongo), `prisma/*` (schema, migrations).
- Tests: Jest in `src/**/**/*.spec.ts`; Playwright E2E in `e2e/*`.
- Docs: Swagger at `/api-docs`.

## Build, Test, and Development Commands

- `npm run dev`: Start local server with hot reload (default port `4010`).
- `npm run build`: TypeScript build to `dist/`.
- `npm start`: Run compiled server.
- `npm test`: Jest unit/integration tests (use `SKIP_DB_CONNECTION=true` for DB-free runs).
- `npm run test:e2e`: Playwright E2E tests.
- `npm run lint` / `npm run type-check`: Lint and strict TS checks.

## Coding Style & Naming Conventions

- Language: TypeScript 5 (strict). Prefer async/await and typed interfaces.
- Indentation: 2 spaces; keep functions small and focused.
- Naming: files `kebab-case.ts`; classes `PascalCase`; functions/vars `camelCase`; tests `*.spec.ts` near code.
- Linting: ESLint via `npm run lint`; fix obvious issues before PRs.

## Testing Guidelines

- Frameworks: Jest + Supertest (API), Playwright (E2E).
- Placement: Unit/integration tests beside sources; E2E under `e2e/`.
- Env: For isolated tests, export `SKIP_DB_CONNECTION=true` to enable mock repositories.
- Aim for meaningful coverage on new/changed code; test happy paths, validation, and error cases.

## Commit & Pull Request Guidelines

- Commits: Clear, present-tense messages (optionally scope, e.g., `users:`). Group related changes.
- PRs: Describe intent, key changes, and testing done; link issues. Include screenshots/logs for behavior changes. Keep diffs focused.

## Security & Configuration Tips

- Configuration is validated in `src/config/index.ts`. Prefer these envs: `JWT_SECRET` (≥32 chars), Postgres/Mongo/Redis vars, `CORS_ORIGIN`.
- Feature flags: `USE_PRISMA` selects Postgres path; `SKIP_DB_CONNECTION` for mock mode.
- Components default to `/api/v{version}/{name}`; extend `BaseComponent` and let auto-discovery mount routes.
