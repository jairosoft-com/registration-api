# E2E Troubleshooting (Docker)

## Common Issues

- Port conflicts: Stop local DBs or change host ports in `docker-compose.e2e.yml` (5433, 27018, 6380). Check with `lsof -i :5433`.
- Connection refused: Ensure the app is up before tests. Logs: `docker compose -f docker-compose.yml -f docker-compose.e2e.yml logs -f app`.
- Seeding fails: Verify `SKIP_DB_CONNECTION=false` and env points to service names (`postgres`, `mongo`, `redis`). Re-run `npm run e2e:seed`.
- Slow startup: Pre-pull images (`docker compose pull`). Wait for health endpoints to respond before running tests.
- Data persists: Use `npm run e2e:down` (removes volumes) or `npm run e2e:cleanup` to reset schemas/databases.
- Prisma migrations: If `USE_PRISMA=true`, run `npm run prisma:migrate:prod` in the `app` container before seeding.

## Useful Commands

- Start stack: `npm run e2e:up`
- Seed data: `npm run e2e:seed`
- Run tests: `npm run e2e:test`
- Tear down: `npm run e2e:down`
- Reset DBs: `npm run e2e:cleanup`
- Inspect services: `docker ps`, `docker logs <container>`
- DB shells: `docker exec -it <pg-container> psql -U postgres`, `mongo`, `redis-cli`

## Environment Notes

- The app reads env from `.env.e2e` when using the override compose.
- Inside containers, default ports are used (5432/27017/6379); host ports are remapped to avoid conflicts.
- Tests use `BASE_URL` (default `http://localhost:4010`). Override per run: `BASE_URL=http://localhost:4010 npm run e2e:test`.
