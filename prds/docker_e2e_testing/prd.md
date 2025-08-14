# Product Requirements Document: Docker E2E Testing Setup

## 📋 **Document Information**

- **Document Type**: Product Requirements Document (PRD)
- **Project**: Express.js TypeScript Microservice Template
- **Feature**: Docker E2E Testing Infrastructure
- **Version**: 1.0
- **Date**: December 2024
- **Status**: Draft

## 🎯 **Executive Summary**

This PRD outlines the requirements for implementing a Docker-based E2E testing infrastructure that provides PostgreSQL, MongoDB, and Redis as backend services for end-to-end testing. The solution will reuse existing project infrastructure while providing isolated testing environments.

## 🎯 **Problem Statement**

Currently, E2E tests run against a mock server (`SKIP_DB_CONNECTION=true`) which limits the ability to test real database interactions, data persistence, and complex database scenarios. This creates a gap between test environment and production reality.

## 🎯 **Solution Overview**

Implement a simple Docker container setup for E2E testing that:

- Reuses existing `docker-compose.yml` with port modifications
- Provides real PostgreSQL, MongoDB, and Redis instances
- Uses existing seed scripts and test data
- Maintains isolation from development environment
- Enables comprehensive database testing

## 🎯 **Success Metrics**

- [ ] E2E tests run against real databases successfully
- [ ] Test execution time remains under 2 minutes
- [ ] No conflicts with development environment
- [ ] Easy to start/stop for testing sessions
- [ ] Minimal changes to existing project setup

## 🏗️ **Technical Requirements**

### **Functional Requirements**

#### **FR-001: Database Container Setup**

- **Description**: Provide PostgreSQL, MongoDB, and Redis containers for E2E testing
- **Acceptance Criteria**:
  - All three database containers start successfully
  - Containers use different ports to avoid conflicts with development
  - Containers are accessible from the E2E test environment
- **Priority**: High

#### **FR-002: Port Configuration**

- **Description**: Configure containers to use non-conflicting ports
- **Acceptance Criteria**:
  - PostgreSQL: Port 5433 (dev uses 5432)
  - MongoDB: Port 27018 (dev uses 27017)
  - Redis: Port 6380 (dev uses 6379)
- **Priority**: High

#### **FR-003: Test Data Seeding**

- **Description**: Populate test databases with minimal required data
- **Acceptance Criteria**:
  - Use existing seed scripts without modification
  - Create minimal data to satisfy current E2E tests
  - Data is consistent and predictable for testing
- **Priority**: High

#### **FR-004: Environment Isolation**

- **Description**: Ensure E2E testing environment is isolated from development
- **Acceptance Criteria**:
  - No data conflicts between test and development databases
  - Tests can run independently without affecting development
  - Clean state for each test run
- **Priority**: High

#### **FR-005: Playwright Integration**

- **Description**: Update Playwright configuration to use test containers
- **Acceptance Criteria**:
  - E2E tests connect to test database containers
  - Tests run successfully against real databases
  - Configuration is simple and maintainable
- **Priority**: High

### **Non-Functional Requirements**

#### **NFR-001: Performance**

- **Description**: E2E test execution time should remain reasonable
- **Acceptance Criteria**:
  - Container startup time: < 30 seconds
  - Total test execution time: < 2 minutes
  - Database seeding time: < 10 seconds
- **Priority**: Medium

#### **NFR-002: Reliability**

- **Description**: Test environment should be stable and consistent
- **Acceptance Criteria**:
  - Containers start successfully 95% of the time
  - Tests produce consistent results across runs
  - Cleanup process is reliable
- **Priority**: Medium

#### **NFR-003: Maintainability**

- **Description**: Solution should be easy to maintain and modify
- **Acceptance Criteria**:
  - Minimal changes to existing project files
  - Clear documentation of setup process
  - Easy to troubleshoot common issues
- **Priority**: Medium

## 🏗️ **Technical Architecture**

### **Current Architecture**

```
E2E Tests → Mock Server (SKIP_DB_CONNECTION=true)
```

### **Target Architecture**

```
E2E Tests → Real API Server → Test Database Containers
                                    ├── PostgreSQL (5433)
                                    ├── MongoDB (27018)
                                    └── Redis (6380)
```

### **Implementation Approach**

1. **Modify existing `docker-compose.yml`** - Change ports for E2E testing
2. **Update environment configuration** - Point to test container ports
3. **Integrate with Playwright** - Configure tests to use real databases
4. **Maintain existing workflows** - Keep current seed and test scripts

## 📋 **User Stories**

### **US-001: Developer Testing Experience**

- **As a** developer
- **I want to** run E2E tests against real databases
- **So that** I can verify database interactions work correctly
- **Acceptance Criteria**:
  - Simple command to start test environment
  - Tests run against real databases
  - Clear feedback on test results

### **US-002: CI/CD Integration**

- **As a** CI/CD pipeline
- **I want to** run E2E tests in isolated containers
- **So that** I can validate database functionality automatically
- **Acceptance Criteria**:
  - Containers start in CI environment
  - Tests complete successfully
  - Cleanup happens automatically

## 🚀 **Implementation Plan**

### **Phase 1: Basic Container Setup (Week 1)**

- [ ] Modify `docker-compose.yml` with test ports
- [ ] Test container startup and connectivity
- [ ] Verify database connections work

### **Phase 2: Test Integration (Week 1)**

- [ ] Update Playwright configuration
- [ ] Test basic E2E flow with real databases
- [ ] Verify existing seed scripts work

### **Phase 3: Validation & Documentation (Week 2)**

- [ ] Run full E2E test suite
- [ ] Document setup and usage
- [ ] Create troubleshooting guide

## 🧪 **Testing Strategy**

### **Unit Testing**

- Test container startup scripts
- Validate port configuration
- Verify environment variable handling

### **Integration Testing**

- Test database connectivity
- Verify seed script execution
- Test cleanup processes

### **E2E Testing**

- Run existing E2E test suite
- Verify all tests pass with real databases
- Test edge cases and error scenarios

## 🚨 **Risks & Mitigation**

### **Risk 1: Port Conflicts**

- **Description**: Test ports might conflict with other services
- **Mitigation**: Use ports outside common ranges, document port usage

### **Risk 2: Performance Degradation**

- **Description**: Real databases might slow down test execution
- **Mitigation**: Optimize container startup, use minimal test data

### **Risk 3: Data Persistence Issues**

- **Description**: Test data might persist between runs
- **Mitigation**: Implement reliable cleanup, use volume management

### **Risk 4: Environment Dependencies**

- **Description**: Tests might fail due to environment differences
- **Mitigation**: Use Docker for consistent environments, document requirements

## 📚 **Dependencies**

### **Technical Dependencies**

- Existing `docker-compose.yml` configuration
- Current seed scripts and test data
- Playwright E2E testing framework
- Database connection configurations

### **External Dependencies**

- Docker and Docker Compose
- PostgreSQL, MongoDB, and Redis images
- Network port availability

## 📋 **Acceptance Criteria**

### **Primary Acceptance Criteria**

- [ ] E2E tests run successfully against real databases
- [ ] Test environment starts in under 30 seconds
- [ ] No conflicts with development environment
- [ ] All existing E2E tests pass

### **Secondary Acceptance Criteria**

- [ ] Documentation is clear and complete
- [ ] Setup process is simple and automated
- [ ] Cleanup process is reliable
- [ ] Performance impact is minimal

## 📝 **Definition of Done**

The feature is considered complete when:

1. All acceptance criteria are met
2. E2E tests run successfully against test containers
3. Documentation is complete and accurate
4. No regressions in existing functionality
5. Performance requirements are satisfied
6. Code review is completed and approved

## 🔄 **Future Enhancements**

### **Phase 2 Features (Future)**

- Automated test data generation
- Performance benchmarking
- Advanced health checks
- Monitoring and alerting

### **Phase 3 Features (Future)**

- Multi-environment testing
- Load testing capabilities
- Advanced data scenarios
- Integration with monitoring tools

## 📚 **References**

- [Project README](../README.md)
- [Architecture Documentation](../ARCHITECTURE.md)
- [Docker Compose Configuration](../docker-compose.yml)
- [E2E Testing Setup](../e2e/)
- [Database Seeding Scripts](../scripts/seed-database.ts)
