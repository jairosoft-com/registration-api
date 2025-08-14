# Docker deployment, test data, and testing plan

This plan explains how to deploy the service in Docker, seed test data, and run unit and E2E tests against the Dockerized instance.

---

## 1) Prerequisites

- Docker Desktop 4.x
- Node.js 18+ locally if you plan to run tests on the host
- A strong `JWT_SECRET` (≥ 32 chars)

---

## 2) Create a Docker env file

Create `.env.docker` in the project root with values that match the compose service names (`postgres`, `mongo`, `redis`) and the app’s config (`src/config/index.ts`).

```env
# Runtime
NODE_ENV=production
PORT=4010
LOG_LEVEL=info
CORS_ORIGIN=*
BASE_URL=http://localhost:4010

# Auth
JWT_SECRET=change-this-32+chars-secret-string-please
JWT_EXPIRES_IN=24h
TEST_API_KEY=test-api-key-123

# Databases
MONGODB_URI=mongodb://mongo:27017/express-template
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=express_template
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
REDIS_HOST=redis
REDIS_PORT=6379

# Prisma (used by migrations and prisma client)
DATABASE_URL=postgresql://postgres:password@postgres:5432/express_template?schema=public

# Feature flags
USE_PRISMA=false
```

Notes:

- `TEST_API_KEY` ensures E2E tests using `X-API-Key: test-api-key-123` pass when DB connections are enabled.
- `USE_PRISMA` toggles Prisma vs Mongoose in user flows. Registration E2E uses Mongo by design.

---

## 3) Adjust docker-compose (recommended)

Update `docker-compose.yml` to align ports and let the image’s default CMD run migrations + server. Also align the Postgres DB name with `DATABASE_URL`. Suggested edits:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '4010:4010' # Align with app PORT
    env_file: .env.docker
    depends_on:
      - postgres
      - mongo
      - redis
    # Remove the dev command; use image CMD (migrate deploy + start)
    # command: sh -c "npx prisma migrate dev && npm run dev"

  postgres:
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: express_template # match .env.docker and DATABASE_URL
```

Additional notes:

- The current compose maps `3001:3001` and runs `npm run dev` which requires dev deps that are not present in the production image. Use `4010:4010` and let the image CMD run.
- The Dockerfile already exposes `4010` and performs health checks on `/api/v1/health`.
- Keep `postgres`, `mongo`, and `redis` services as they are.

macOS networking note:

- If you intend to run tests inside a container, avoid `network_mode: host` (not supported on macOS). Prefer the default compose network and target the service name (e.g., `http://app:4010`).

---

## 4) Build and start the stack

```bash
# From project root
docker compose --env-file ./.env.docker build app

# Start databases first
docker compose --env-file ./.env.docker up -d postgres mongo redis

# Wait a few seconds for DBs to be ready, then start app
docker compose --env-file ./.env.docker up -d app

# Follow app logs
docker compose logs -f app

# Verify health
curl -s http://localhost:4010/api/v1/health | jq .
```

---

## 5) Seed test data (two options)

You can seed via Prisma (Postgres) and/or via the Node script (Mongo + Redis). Use at least one depending on what you will test.

### Option A — Seed Prisma (Postgres)

Run seeding from a dev-capable container (installs dev deps). The `playwright-tests` image works for this purpose.

```bash
docker compose run --rm \
  -e DATABASE_URL=postgresql://postgres:password@postgres:5432/express_template?schema=public \
  playwright-tests npx prisma migrate deploy

docker compose run --rm \
  -e DATABASE_URL=postgresql://postgres:password@postgres:5432/express_template?schema=public \
  playwright-tests npm run prisma:seed
```

### Option B — Seed via script (Mongo + Redis + Postgres ping)

This seeds Mongo users and does placeholder work for Postgres/Redis.

```bash
docker compose run --rm \
  -e NODE_ENV=development \
  -e MONGODB_URI=mongodb://mongo:27017/express-template \
  -e POSTGRES_HOST=postgres -e POSTGRES_PORT=5432 \
  -e POSTGRES_DB=express_template -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password \
  -e REDIS_HOST=redis -e REDIS_PORT=6379 \
  playwright-tests npm run seed
```

---

## 6) Run unit tests

You can run unit tests on the host or in a container.

### Host (fastest)

```bash
npm ci
npm test
```

### Container

```bash
docker compose run --rm playwright-tests npm ci
docker compose run --rm playwright-tests npm test
```

---

## 7) Run E2E tests against the Dockerized app

There are two recommended approaches. Choose one.

### Approach A — Run E2E on the host (recommended)

This will reuse the already-running Docker app at `http://localhost:4010` thanks to the Playwright `webServer.reuseExistingServer` setting.

```bash
# Ensure the app is up (Section 4)

# From host, run Playwright
npm ci
npx playwright test

# Show HTML report
npx playwright show-report
```

Requirements for this approach:

- Docker app is listening on `http://localhost:4010`.
- `.env.docker` includes `TEST_API_KEY=test-api-key-123`.

### Approach B — Run E2E in a container (no host Node required)

Because the default Playwright config attempts to start a local dev server, create a separate config that targets the running Docker app and does not start its own server.

1. Add a new file `playwright.docker.config.ts` (no `webServer` field), with `use.baseURL = 'http://app:4010'`.
2. Run tests with that config:

```bash
docker compose run --rm \
  -e TEST_API_KEY=test-api-key-123 \
  playwright-tests npx playwright test --config=playwright.docker.config.ts --base-url http://app:4010
```

macOS note: Do not rely on `network_mode: host`. Use the default compose network and the service DNS name `app`.

---

## 8) Useful administration commands

```bash
# Tail logs
docker compose logs -f app

# Restart app
docker compose restart app

# Rebuild and restart app
docker compose build app && docker compose up -d app

# Exec into app container
docker compose exec app sh

# Tear everything down (volumes included)
docker compose down -v
```

---

## 9) Troubleshooting

- Port mismatch: ensure `PORT=4010` in env and `4010:4010` mapping in compose.
- API key 401: set `TEST_API_KEY=test-api-key-123` in env (required when DB is connected).
- Prisma client not generated: run `npx prisma generate` (inside your test/container) or re-build images.
- Playwright tries to start its own server in-container: use the separate `playwright.docker.config.ts` without `webServer`.
- macOS networking: avoid `network_mode: host`; target `http://app:4010` inside containers.

---

## 10) CI/CD outline (optional)

- Build image with tags (e.g., `registration-api:<git-sha>`)
- Provision DBs with managed services or Docker-in-Docker
- Run `prisma migrate deploy` and seed data
- Start app and wait for `/api/v1/health/ready`
- Run unit tests (host or container)
- Run Playwright E2E against the running app (config without webServer)
