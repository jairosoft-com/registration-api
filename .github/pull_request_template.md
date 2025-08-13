## Summary

- What does this PR change and why?
- Link related issues (e.g., Fixes #123).

## Changes

- Config/Infra: describe env, Docker, CI, or build changes
- App/API: list endpoints or behaviors modified/added
- Tests: outline unit/E2E coverage added

## Screenshots/Logs (if applicable)

- Paste brief logs or screenshots for API responses, failing cases, or dashboards

## How To Test

- Dev: `npm run dev` then hit `http://localhost:4010/api/v1/health`
- Docker:
  - `docker compose --env-file .env.docker up -d postgres mongo redis app`
  - `make seed` (optional) and `make e2e-docker`

## Risks & Rollback

- Risks: describe potential impact (rate-limits, auth, DB)
- Rollback: revert this PR and redeploy

## Checklist

- [ ] Tests pass locally (`npm test`) and E2E (`make e2e-docker`)
- [ ] Swagger docs updated if endpoints changed
- [ ] .env variables documented/added to `.env.example` if needed
- [ ] No unrelated changes
