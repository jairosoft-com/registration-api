# E2E FAQ and Examples

## Example Test Data

- Mongo users seeded by `scripts/seed-database.ts`:
  - admin@example.com / admin123
  - john.doe@example.com / password123
  - jane.smith@example.com / password123
  - bob.wilson@example.com / password123
  - alice.johnson@example.com / password123
- Prisma users (Postgres) via `prisma/seed.ts` require migrations; see note below.

## Frequently Asked Questions

- How do I run E2E tests against real DBs?
  - `npm run e2e` (brings up stack, waits, seeds, installs browsers, runs tests, tears down)

- How do I check database state during E2E?
  - `npm run e2e:state` prints Mongo user count and Redis key count.

- Cleanup leaves Redis keys — is that expected?
  - The app may recreate ephemeral keys (e.g., service discovery). Use `npm run e2e:state:empty` to assert Mongo is empty and ignore Redis.

- Can I use Prisma with the E2E stack?
  - Connectivity: `npm run e2e:prisma:check` validates Prisma can reach Postgres on port 5433.
  - Seeding: `prisma/seed.ts` requires tables/migrations; run `npx prisma migrate deploy` once migrations exist.

- How do I speed up CI runs?
  - Playwright binaries are cached; ensure browsers are reused across runs. Parallel workers can be set via `PLAYWRIGHT_WORKERS` if tests are parallel-safe.
