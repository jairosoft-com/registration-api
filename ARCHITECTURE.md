# Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Component Architecture](#component-architecture)
4. [Data Architecture](#data-architecture)
5. [Security Architecture](#security-architecture)
6. [Infrastructure](#infrastructure)
7. [Development Workflow](#development-workflow)
8. [Deployment Architecture](#deployment-architecture)

## System Overview

This Express.js microservice template implements a modern, scalable architecture designed for enterprise applications. The system follows domain-driven design principles with a component-based architecture that promotes modularity, testability, and maintainability.

### High-Level Architecture

```mermaid
graph TB
    Client[Client Applications]
    Gateway[API Gateway]
    Auth[Auth Service]
    Core[Core API]
    WS[WebSocket Server]
    Cache[Redis Cache]
    PG[(PostgreSQL)]
    Mongo[(MongoDB)]
    EventBus[Event Bus]
    
    Client --> Gateway
    Gateway --> Auth
    Gateway --> Core
    Client -.->|WebSocket| WS
    Core --> Cache
    Core --> PG
    Core --> Mongo
    Core --> EventBus
    WS --> EventBus
    Auth --> PG
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Node.js 18+ | JavaScript runtime with ES2022 support |
| Framework | Express.js 5.1 | Web application framework |
| Language | TypeScript 5.8+ | Type-safe JavaScript |
| ORM | Prisma | Type-safe database access |
| Validation | Zod | Runtime type validation |
| Authentication | JWT + Passport | Token-based auth with OAuth |
| Logging | Pino | High-performance structured logging |
| Testing | Jest + Playwright | Unit, integration, and E2E testing |
| Documentation | Swagger/OpenAPI | API documentation |
| Containerization | Docker | Application containerization |

## Architecture Principles

### 1. Component-Based Design
- Self-contained feature modules
- Clear separation of concerns
- Auto-discovery mechanism
- Standardized file structure

### 2. Layered Architecture
```
┌─────────────────────────────────────┐
│         Presentation Layer          │ ← Controllers, Routes
├─────────────────────────────────────┤
│         Business Logic Layer        │ ← Services, Domain Logic
├─────────────────────────────────────┤
│         Data Access Layer           │ ← Repositories, Prisma
├─────────────────────────────────────┤
│         Infrastructure Layer        │ ← Database, Cache, External Services
└─────────────────────────────────────┘
```

### 3. SOLID Principles
- **Single Responsibility**: Each class/module has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes substitutable for base classes
- **Interface Segregation**: Many specific interfaces over general ones
- **Dependency Inversion**: Depend on abstractions, not concretions

### 4. Domain-Driven Design
- Bounded contexts for different domains
- Rich domain models with business logic
- Repository pattern for data access
- Value objects for domain concepts

## Component Architecture

### Component Structure

Each component follows a standardized structure:

```
src/components/<component-name>/
├── index.ts                 # Component exports and metadata
├── <name>.controller.ts     # HTTP request handlers
├── <name>.service.ts        # Business logic
├── <name>.routes.ts         # Route definitions
├── <name>.validation.ts     # Zod schemas
├── <name>.types.ts          # TypeScript types
├── <name>.repository.ts     # Data access (if needed)
└── <name>.spec.ts           # Unit tests
```

### Component Registry

Components are auto-discovered at startup:

```typescript
// Component metadata in index.ts
export const metadata: ComponentMetadata = {
  name: 'users',
  version: '1.0.0',
  dependencies: ['auth', 'database'],
  routes: userRoutes,
  migrations: ['001_create_users.sql'],
  events: ['user.created', 'user.updated']
};
```

### Inter-Component Communication

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant Repository
    participant Database
    participant EventBus
    
    Client->>Controller: HTTP Request
    Controller->>Service: Business Operation
    Service->>Repository: Data Operation
    Repository->>Database: SQL Query
    Database-->>Repository: Result
    Repository-->>Service: Domain Object
    Service->>EventBus: Emit Event
    Service-->>Controller: Response Data
    Controller-->>Client: HTTP Response
```

## Data Architecture

### Database Strategy

#### Primary Database (PostgreSQL)
- Relational data with ACID compliance
- Complex queries and transactions
- Managed through Prisma ORM
- Migration-based schema evolution

#### Cache Layer (Redis)
- Session storage
- Response caching
- Rate limiting counters
- Pub/Sub for real-time features

#### Document Store (MongoDB)
- Legacy support
- Unstructured data
- Audit logs and events

### Repository Pattern

```typescript
// Base repository with generic CRUD
abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
  protected abstract model: PrismaModelDelegate;
  
  async findById(id: string): Promise<T | null>
  async findMany(filter: FilterQuery): Promise<T[]>
  async create(data: CreateDTO): Promise<T>
  async update(id: string, data: UpdateDTO): Promise<T>
  async delete(id: string): Promise<void>
}

// Specific repository with domain logic
class UserRepository extends BaseRepository<User, CreateUserDTO, UpdateUserDTO> {
  async findByEmail(email: string): Promise<User | null>
  async verifyPassword(user: User, password: string): Promise<boolean>
  async incrementLoginAttempts(userId: string): Promise<void>
}
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name add_user_roles

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Data Models

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String?
  firstName         String
  lastName          String
  emailVerified     Boolean   @default(false)
  active            Boolean   @default(true)
  
  // Relations
  roles             UserRole[]
  sessions          Session[]
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Indexes
  @@index([email])
  @@index([createdAt])
}
```

## Security Architecture

### Authentication Flow

```mermaid
graph LR
    A[Client] -->|1. Login Request| B[Auth Controller]
    B -->|2. Validate Credentials| C[User Service]
    C -->|3. Query User| D[User Repository]
    D -->|4. User Data| C
    C -->|5. Generate JWT| E[JWT Service]
    E -->|6. Token| C
    C -->|7. Create Session| F[Session Service]
    F -->|8. Store in Redis| G[Redis]
    C -->|9. Return Token| B
    B -->|10. Response + Token| A
```

### Security Layers

1. **Network Security**
   - HTTPS enforcement
   - CORS configuration
   - Rate limiting per endpoint
   - IP allowlisting (optional)

2. **Application Security**
   - Input validation (Zod)
   - SQL injection prevention (Prisma)
   - XSS protection (Helmet)
   - CSRF protection

3. **Authentication & Authorization**
   - JWT with refresh tokens
   - OAuth 2.0 providers
   - Two-factor authentication
   - Role-based access control

4. **Data Security**
   - Password hashing (bcrypt)
   - Encryption at rest
   - Secure session management
   - Audit logging

### Security Constants

```typescript
export const SECURITY = {
  PASSWORD: {
    SALT_ROUNDS: 10,
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true
  },
  SESSION: {
    DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
    REFRESH_THRESHOLD_MS: 60 * 60 * 1000, // 1 hour
    MAX_SESSIONS_PER_USER: 5
  },
  LOGIN: {
    MAX_ATTEMPTS: 5,
    LOCK_DURATION_MS: 2 * 60 * 60 * 1000, // 2 hours
    ATTEMPT_WINDOW_MS: 15 * 60 * 1000 // 15 minutes
  }
};
```

## Infrastructure

### Service Architecture

```mermaid
graph TB
    subgraph "Container Orchestration"
        K8S[Kubernetes Cluster]
    end
    
    subgraph "Application Layer"
        API1[API Instance 1]
        API2[API Instance 2]
        API3[API Instance 3]
        WS1[WebSocket Server]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL Primary)]
        PGR[(PostgreSQL Replica)]
        REDIS[(Redis Cluster)]
        MONGO[(MongoDB Replica Set)]
    end
    
    subgraph "Supporting Services"
        METRICS[Prometheus]
        LOGS[ELK Stack]
        TRACE[Jaeger]
    end
    
    K8S --> API1
    K8S --> API2
    K8S --> API3
    K8S --> WS1
    
    API1 --> PG
    API2 --> PG
    API3 --> PG
    PG --> PGR
    
    API1 --> REDIS
    API2 --> REDIS
    API3 --> REDIS
    WS1 --> REDIS
    
    API1 --> METRICS
    API2 --> METRICS
    API3 --> METRICS
```

### Docker Configuration

#### Multi-Stage Build
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 4010
CMD ["node", "dist/server.js"]
```

### Environment Configuration

```yaml
# docker-compose.yml
services:
  app:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4010/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Development Workflow

### Code Generation

```bash
# Generate new component
npm run generate:component user-profile

# Creates:
# - src/components/user-profile/
#   ├── index.ts
#   ├── user-profile.controller.ts
#   ├── user-profile.service.ts
#   ├── user-profile.routes.ts
#   ├── user-profile.validation.ts
#   ├── user-profile.types.ts
#   └── user-profile.spec.ts

# Generate test for existing file
npm run generate:test src/services/email.service.ts
```

### Testing Strategy

```mermaid
graph TB
    UT[Unit Tests<br/>Jest + ts-jest]
    IT[Integration Tests<br/>Supertest]
    E2E[E2E Tests<br/>Playwright]
    
    UT -->|Fast Feedback| Dev[Development]
    IT -->|API Testing| CI[CI Pipeline]
    E2E -->|User Flows| Deploy[Deployment]
    
    Dev --> CI
    CI --> Deploy
```

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/JIRA-123-user-profile
npm run test
npm run lint:fix
git add .
git commit -m "feat: add user profile component"
git push origin feature/JIRA-123-user-profile

# Pre-commit hooks
# - Run linting
# - Run type checking
# - Run unit tests
# - Format code
```

## Deployment Architecture

### Production Deployment

```mermaid
graph TB
    subgraph "External"
        CDN[CloudFlare CDN]
        DNS[Route 53]
    end
    
    subgraph "Load Balancing"
        ALB[Application Load Balancer]
        NLB[Network Load Balancer]
    end
    
    subgraph "Application Tier"
        ECS[ECS Fargate]
        ASG[Auto Scaling Group]
    end
    
    subgraph "Data Tier"
        RDS[(RDS PostgreSQL)]
        ELASTICACHE[(ElastiCache Redis)]
        DOCDB[(DocumentDB)]
    end
    
    subgraph "Monitoring"
        CW[CloudWatch]
        XRAY[X-Ray]
    end
    
    DNS --> CDN
    CDN --> ALB
    ALB --> ECS
    NLB --> ECS
    ECS --> ASG
    ECS --> RDS
    ECS --> ELASTICACHE
    ECS --> DOCDB
    ECS --> CW
    ECS --> XRAY
```

### Scaling Strategy

#### Horizontal Scaling
- Auto-scaling based on CPU/memory
- Read replicas for databases
- Redis cluster for caching
- Load balancing across instances

#### Vertical Scaling
- Instance type optimization
- Database performance tuning
- Connection pooling
- Query optimization

### Monitoring & Observability

#### Metrics
- Request rate and latency
- Error rates and types
- Database query performance
- Cache hit/miss rates
- WebSocket connections

#### Logging
- Structured JSON logs
- Correlation IDs for tracing
- Log aggregation with ELK
- Log retention policies

#### Alerting
- Critical error thresholds
- Performance degradation
- Security incidents
- Resource utilization

### Disaster Recovery

#### Backup Strategy
- Daily automated backups
- Point-in-time recovery
- Cross-region replication
- Backup retention: 30 days

#### Recovery Procedures
1. Database restoration from snapshot
2. Redis cache warming
3. Service health verification
4. Traffic gradual migration

### Performance Optimization

#### API Performance
- Response caching
- Query optimization
- Pagination and filtering
- Compression (gzip/brotli)

#### Database Performance
- Indexing strategy
- Query optimization
- Connection pooling
- Read/write splitting

#### Caching Strategy
- Redis for session data
- CDN for static assets
- Application-level caching
- Database query caching

## Best Practices

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Pre-commit hooks
- Code review process
- Documentation requirements

### Security
- Regular dependency updates
- Security scanning (npm audit)
- OWASP compliance
- Penetration testing
- Security training

### Performance
- Performance budgets
- Load testing
- Profiling and optimization
- Monitoring and alerting
- Capacity planning

### Maintainability
- Component-based architecture
- Clear separation of concerns
- Comprehensive testing
- Documentation
- Code generation tools

## Conclusion

This architecture provides a robust, scalable foundation for building enterprise-grade microservices. The component-based design, combined with modern development practices and comprehensive tooling, ensures maintainability and developer productivity while meeting performance and security requirements.

For implementation details and specific code examples, refer to the source code and component documentation.