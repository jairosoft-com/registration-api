SHELL := /bin/bash

# Defaults (override via env: e.g., `JWT_SECRET=... make seed`)
JWT_SECRET ?= please-change-this-to-a-very-long-32char-secret-123456
TEST_API_KEY ?= test-api-key-123
ENV_FILE ?= .env.docker

.PHONY: build up down logs health seed e2e-docker e2e-docker-list ps

build:
	@docker compose --env-file $(ENV_FILE) build app

up:
	@docker compose --env-file $(ENV_FILE) up -d postgres mongo redis app

down:
	@docker compose down

ps:
	@docker compose --env-file $(ENV_FILE) ps

logs:
	@docker compose --env-file $(ENV_FILE) logs -f app

health:
	@curl -s http://localhost:4010/api/v1/health | jq .

# Seed databases using the playwright-tests container (Mongo + Redis + Postgres ping)
seed:
	@docker compose run --rm \
	  -e TS_NODE_TRANSPILE_ONLY=1 \
	  -e TS_NODE_PROJECT=tsconfig.json \
	  -e JWT_SECRET=$(JWT_SECRET) \
	  -e JWT_EXPIRES_IN=24h \
	  -e CORS_ORIGIN=* \
	  -e NODE_ENV=development \
	  -e MONGODB_URI=mongodb://mongo:27017/express-template \
	  -e POSTGRES_HOST=postgres \
	  -e POSTGRES_PORT=5432 \
	  -e POSTGRES_DB=express_template \
	  -e POSTGRES_USER=postgres \
	  -e POSTGRES_PASSWORD=password \
	  -e REDIS_HOST=redis \
	  -e REDIS_PORT=6379 \
	  playwright-tests \
	  node -r tsconfig-paths/register -r ts-node/register scripts/seed-database.ts

# Run Playwright E2E against running Docker app (chromium only)
e2e-docker:
	@docker compose build playwright-tests && \
	docker compose run --rm \
	  -e BASE_URL=http://app:4010 \
	  -e TEST_API_KEY=$(TEST_API_KEY) \
	  playwright-tests \
	  npx playwright test -c playwright.docker.config.ts --workers=1

e2e-docker-list:
	@docker compose run --rm \
	  -e BASE_URL=http://app:4010 \
	  -e TEST_API_KEY=$(TEST_API_KEY) \
	  playwright-tests \
	  npx playwright test -c playwright.docker.config.ts --list

