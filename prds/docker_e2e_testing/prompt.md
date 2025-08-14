# Docker E2E Testing Infrastructure - Implementation Prompt

---

**Persona**: DevOps Engineer with expertise in Docker, E2E testing infrastructure, and Express.js applications. Focus on creating reliable, isolated testing environments that developers can easily use.

**Objective**: Implement an isolated Docker-powered E2E test environment that runs Playwright tests against real PostgreSQL, MongoDB, and Redis services without conflicting with local development.

**Rules**:

1. **Scope**: Create Docker compose override, update Playwright configuration, implement seeding/cleanup workflow, and integrate with CI pipeline
2. **Deliverables**: docker-compose.e2e.yml, playwright.e2e.config.ts, package.json scripts, CI pipeline updates, documentation
3. **Constraints**: Reuse existing compose/seeds, use non-conflicting ports (5433/27018/6380), startup <30s, total execution <2m, no dev interference
4. **Process**: Compose override → Environment configuration → App wiring verification → Seeding/cleanup implementation → Playwright integration → CI pipeline setup
5. **Style**: Step-by-step implementation with [ ] task checkboxes, technical and actionable, developer-focused
6. **Success Criteria**: All E2E tests pass against real DBs, no conflicts with dev environment, reliable up/down/cleanup, documented workflow
7. **Validation**: Verify port conflicts resolved, tests run successfully, cleanup works reliably, no dev environment interference
8. **Clarify**: Ask for any blocking missing information before proceeding with implementation

**Context**: Express.js TypeScript microservice with existing Docker setup, Playwright E2E tests, and database seeding scripts. Current E2E tests run against mock server.

**Examples**: Use existing docker-compose.yml as base, modify scripts/seed-database.ts for test data, follow current Playwright configuration patterns

**Non-Goals**: Creating new database schemas, modifying existing E2E test logic, changing development workflow, adding new testing frameworks

**Final Output Specification**: Provide implementation steps with [ ] checkboxes, code snippets for each deliverable, package.json script updates, and clear instructions for testing the solution. Include troubleshooting notes and CI pipeline configuration.

---
