# TODO: Docker-Based E2E Testing Infrastructure

## Objective

Implement an isolated Docker-powered E2E test environment that runs Playwright tests against real PostgreSQL, MongoDB, and Redis services without conflicting with local dev. Reuse existing compose, seeds, and test data.

## Deliverables

- docker-compose override for E2E with non-conflicting ports (5433/27018/6380).
- Playwright config and scripts to target the E2E stack.
- Seed + cleanup workflow for deterministic test data.
- Short docs: how to run locally and in CI.

## Tasks

- Compose override
  - Create `docker-compose.e2e.yml` overriding DB ports: Postgres 5433, Mongo 27018, Redis 6380.
  - Ensure services share a dedicated network and do not clash with dev.
- Env configuration
  - Add `.env.e2e` (or reuse `.env.docker`) with DB hosts pointing to service names and ports as above.
  - Expose `BASE_URL` for tests (inside Docker: `http://app:4010`; local runner: `http://localhost:4010`).
- App wiring
  - Confirm server reads DB/Redis host/port from env and supports non-default ports.
  - Verify `USE_PRISMA`/`SKIP_DB_CONNECTION` flags; ensure E2E runs with real DBs.
- Seeding and cleanup
  - Reuse `scripts/seed-database.ts` (and `prisma/seed.ts`) to seed minimal data.
  - Add `scripts/cleanup-e2e.ts` (optional) to drop/flush DBs after runs.
- Playwright integration
  - Add `playwright.e2e.config.ts` that reads `BASE_URL` and points to the app in Docker.
  - Update `package.json` scripts:
    - `e2e:up`: `docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d`
    - `e2e:seed`: `npm run seed`
    - `e2e:test`: `npx playwright test -c playwright.e2e.config.ts`
    - `e2e:down`: `docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v`
    - `e2e`: run `e2e:up && e2e:seed && e2e:test && e2e:down` with proper error handling.
- CI pipeline
  - Add a CI job that runs the above sequence with caching for npm and Playwright binaries.
  - Ensure HTML report is uploaded as an artifact.

## Acceptance Criteria

- E2E runs succeed against real DBs; all existing tests pass.
- Port overrides: Postgres 5433, Mongo 27018, Redis 6380.
- Startup < 30s; seed < 10s; total < 2m (on developer machine and CI baseline).
- No interference with dev environment; reliable up/down and cleanup.
- Clear docs in `README.md` (E2E section) + troubleshooting.

## Notes/Risks

- Port conflicts: allow env overrides; document ports used.
- Data persistence: ensure volumes are removed on `e2e:down` or use throwaway volumes.
- Performance: prefer minimal seed data; parallelize tests where safe.
