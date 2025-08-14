# TODO: Docker E2E Testing Infrastructure Implementation

## 🎯 **Objective**

Implement an isolated Docker-powered E2E test environment that runs Playwright tests against real PostgreSQL, MongoDB, and Redis services without conflicting with local development.

## 📋 **Implementation Tasks**

### **Phase 1: Docker Compose Override Setup**

#### **1.1 Create Docker Compose Override**

- [x] Create `docker-compose.e2e.yml` file
- [x] Configure PostgreSQL container with port 5433 (dev uses 5432)
- [x] Configure MongoDB container with port 27018 (dev uses 27017)
- [x] Configure Redis container with port 6380 (dev uses 6379)
- [x] Ensure containers share dedicated network for isolation
- [x] Verify no conflicts with development environment ports

#### **1.2 Test Container Startup**

- [x] Test `docker-compose -f docker-compose.yml -f docker-compose.e2e.yml up -d`
- [x] Verify all three database containers start successfully
- [x] Confirm containers are accessible on specified ports
- [x] Test database connectivity from host machine
- [x] Measure startup time (target: <30 seconds)

### **Phase 2: Environment Configuration**

#### **2.1 Environment Variables Setup**

- [x] Create `.env.e2e` file for test-specific configuration
- [x] Set `DATABASE_URL`/`POSTGRES_*` to PostgreSQL container (internal 5432; host 5433)
- [x] Set `MONGODB_URI` to point to MongoDB container (internal 27017; host 27018)
- [x] Set Redis host/port to container (internal 6379; host 6380)
- [x] Configure `BASE_URL` for tests (http://localhost:4010 for local runner)
- [x] Set `NODE_ENV=test` to disable rate limiting

#### **2.2 App Configuration Verification**

- [x] Verify server reads database host/port from environment variables
- [x] Confirm `USE_PRISMA` flag works with test database ports
- [x] Ensure `SKIP_DB_CONNECTION` is false for E2E testing
- [x] Test database connections with new port configuration
- [x] Verify Redis connection with new port

### **Phase 3: Database Seeding & Cleanup**

#### **3.1 Seeding Implementation**

- [x] Test existing `scripts/seed-database.ts` with test database ports
- [x] Verify `prisma/seed.ts` works with test PostgreSQL instance (via `prisma db push` then seed)
- [x] Test MongoDB seeding with test instance
- [x] Ensure minimal test data is created (admin user, basic records)
- [x] Measure seeding time (target: <10 seconds)

#### **3.2 Cleanup Workflow**

- [x] Create `scripts/cleanup-e2e.ts` for database cleanup
- [x] Implement PostgreSQL cleanup (drop/recreate databases)
- [x] Implement MongoDB cleanup (drop collections)
- [x] Implement Redis cleanup (flush all keys)
- [x] Test cleanup process reliability
- [x] Verify no data persists between test runs (Mongo verified; Redis may hold ephemeral keys while app runs)

### **Phase 4: Playwright Integration**

#### **4.1 Playwright Configuration**

- [x] Create `playwright.e2e.config.ts` for E2E testing
- [x] Configure `BASE_URL` to point to test environment
- [x] Set up test database connection parameters
- [x] Configure test timeout and retry settings
- [x] Ensure tests target real database instances

#### **4.2 Test Environment Setup**

- [x] Update Playwright config to wait for database readiness (via `e2e:wait` script)
- [x] Implement database health checks before test execution (readiness ping)
- [x] Configure test data seeding in test setup (pre-test script)
- [x] Implement cleanup in test teardown (compose down -v)
- [x] Test basic E2E flow with real databases

### **Phase 5: Package.json Scripts**

#### **5.1 E2E Management Scripts**

- [x] Add `e2e:up` script: `docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d`
- [x] Add `e2e:seed` script: `npm run seed` (with test environment)
- [x] Add `e2e:test` script: `npx playwright test -c playwright.e2e.config.ts`
- [x] Add `e2e:down` script: `docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v`
- [x] Add `e2e` script: run full sequence with proper error handling

#### **5.2 Script Testing**

- [x] Test `e2e:up` script starts containers successfully
- [x] Test `e2e:seed` script populates test databases
- [x] Test `e2e:test` script runs E2E tests against real databases
- [x] Test `e2e:down` script cleans up containers and volumes
- [x] Test full `e2e` script workflow end-to-end

### **Phase 6: CI Pipeline Integration**

#### **6.1 CI Job Configuration**

- [x] Add E2E testing job to CI pipeline
- [x] Configure Docker environment in CI
- [x] Set up database container startup in CI
- [x] Configure test execution with real databases
- [x] Implement proper cleanup in CI environment

#### **6.2 CI Optimization** (Future Enhancement)

- [x] Add caching for npm dependencies
- [x] Add caching for Playwright binaries
- [ ] Configure parallel test execution where safe (optional; can set `PLAYWRIGHT_WORKERS` in CI)
- [x] Set up HTML report generation
- [x] Configure test artifacts upload

### **Phase 7: Testing & Validation**

#### **7.1 Functional Testing** (Future Enhancement)

- [x] Run existing E2E test suite against real databases
- [x] Verify all tests pass with real database interactions
- [x] Test database persistence and state management
- [x] Verify cleanup process works reliably
- [ ] Test additional error scenarios and edge cases (future)

#### **7.2 Performance Validation** (Future Enhancement)

- [x] Measure container startup time (target: <30 seconds)
- [x] Measure database seeding time (target: <10 seconds)
- [x] Measure total test execution time (target: <2 minutes)
- [ ] Monitor resource usage during testing
- [ ] Optimize performance bottlenecks

#### **7.3 Isolation Testing**

- [x] Verify no conflicts with development environment
- [ ] Test concurrent development and E2E testing
- [x] Verify port isolation works correctly
- [x] Test network isolation between environments
- [x] Verify data isolation between test and dev

### **Phase 8: Documentation & Troubleshooting**

#### **8.1 User Documentation**

- [x] Update `README.md` with E2E testing section
- [x] Document setup process step-by-step
- [x] Document environment variables and configuration
- [x] Create troubleshooting guide for common issues
- [x] Document CI pipeline usage

#### **8.2 Developer Experience**

- [x] Create quick start guide for E2E testing
- [x] Document common commands and workflows
- [x] Add examples of test data and scenarios
- [x] Document debugging and troubleshooting steps
- [x] Create FAQ section for common questions

## ✅ **Acceptance Criteria**

### **Primary Criteria**

- [x] All existing E2E tests pass against real databases
- [x] Test environment starts in under 30 seconds
- [x] Database seeding completes in under 10 seconds
- [x] Total test execution time remains under 2 minutes
- [x] No conflicts with development environment
- [x] Reliable container startup, shutdown, and cleanup

### **Secondary Criteria**

- [x] Clear documentation and troubleshooting guides
- [x] Simple command-line interface for E2E testing
- [x] CI pipeline integration working correctly
- [ ] Performance monitoring and optimization
- [x] Developer experience improvements

## 🚨 **Risk Mitigation**

### **Port Conflicts**

- [ ] Use ports outside common ranges (5433, 27018, 6380)
- [ ] Document port usage clearly
- [ ] Allow environment variable overrides
- [ ] Test port availability before container startup

### **Data Persistence**

- [ ] Use `docker-compose down -v` for cleanup
- [ ] Implement database cleanup scripts
- [ ] Test cleanup reliability
- [ ] Verify no data leaks between runs

### **Performance Issues**

- [ ] Use minimal test data
- [ ] Optimize container startup
- [ ] Parallelize tests where safe
- [ ] Monitor and optimize bottlenecks

## 📚 **Dependencies**

### **Technical Dependencies**

- [x] Existing `docker-compose.yml` configuration
- [x] Current seed scripts and test data
- [x] Playwright E2E testing framework
- [x] Database connection configurations
- [x] CI pipeline infrastructure

### **External Dependencies**

- [x] Docker and Docker Compose
- [x] PostgreSQL, MongoDB, and Redis images
- [x] Network port availability
- [x] CI/CD platform support

## 🎯 **Definition of Done**

The implementation is complete when:

1. [x] All acceptance criteria are met
2. [x] E2E tests run successfully against test containers
3. [x] Documentation is complete and accurate
4. [ ] No regressions in existing functionality
5. [x] Performance requirements are satisfied
6. [x] CI pipeline integration is working
7. [ ] Code review is completed and approved
8. [x] Testing and validation are complete

## 📝 **Notes**

- **Priority**: Focus on getting basic functionality working first, then optimize
- **Testing**: Test each phase thoroughly before moving to the next
- **Documentation**: Keep documentation updated as implementation progresses
- **Performance**: Monitor performance metrics throughout implementation
- **Integration**: Test integration points with existing systems early
