# Development Tools and Scripts

This directory contains various development tools and scripts to help with development, testing, and deployment.

## Available Scripts

### Database Seeding

#### `seed-database.ts`
Seeds the database with initial test data.

**Usage:**
```bash
npm run seed
```

**Features:**
- Seeds MongoDB with test users
- Supports PostgreSQL and Redis seeding (ready for future models)
- Includes admin and regular user accounts
- Logs all seeding operations

**Test Users Created:**
- `admin@example.com` / `admin123` (Admin User)
- `john.doe@example.com` / `password123` (John Doe)
- `jane.smith@example.com` / `password123` (Jane Smith)
- `bob.wilson@example.com` / `password123` (Bob Wilson)
- `alice.johnson@example.com` / `password123` (Alice Johnson)

### Test Data Generation

#### `generate-test-data.ts`
Generates comprehensive test data for development and testing.

**Usage:**
```bash
# Generate default test data (50 users, 100 requests, 20 errors)
npm run generate:test-data

# Generate custom amounts
npx ts-node scripts/generate-test-data.ts 100 200 50 ./custom-test-data
```

**Parameters:**
1. `usersCount` (default: 50) - Number of test users to generate
2. `requestsCount` (default: 100) - Number of API requests to generate
3. `errorsCount` (default: 20) - Number of error logs to generate
4. `outputDir` (default: ./test-data) - Output directory for generated files

**Generated Files:**
- `users.json` - Test user data
- `api-requests.json` - Mock API request logs
- `error-logs.json` - Mock error logs
- `summary.json` - Summary of generated data

### Development Environment Setup

#### `setup-dev.ts`
Automatically sets up the development environment.

**Usage:**
```bash
# Full setup
npm run setup:dev

# Setup without certain steps
npx ts-node scripts/setup-dev.ts --no-tests --no-docker
```

**Options:**
- `--no-deps` - Skip dependency installation
- `--no-env` - Skip environment setup
- `--no-docker` - Skip Docker checks
- `--no-tests` - Skip running tests
- `--seed` - Include database seeding

**What it does:**
1. Checks Node.js version (requires 18+)
2. Detects package manager (npm/yarn)
3. Installs dependencies
4. Sets up environment variables
5. Checks Docker availability
6. Creates Git hooks
7. Runs tests
8. Seeds database (if requested)

## Package.json Scripts

### Development
```bash
npm run dev              # Start development server
npm run dev:safe         # Type check + dev server
npm run build            # Build for production
npm run build:safe       # Type check + build
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run end-to-end tests
npm run test:e2e:report  # Show e2e test report
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
npm run type-check:watch # TypeScript watch mode
```

### Database & Data
```bash
npm run seed             # Seed database with test data
npm run generate:test-data # Generate test data files
```

### Environment Setup
```bash
npm run setup:dev        # Setup development environment
npm run reset            # Clean + install + seed
```

### Monitoring
```bash
npm run health           # Check API health
npm run docs             # Show API docs URL
```

### Utilities
```bash
npm run clean            # Clean build artifacts
```

## Health Check Endpoints

### `/api/v1/health`
Comprehensive health check including:
- Database connections (MongoDB, PostgreSQL, Redis)
- System resources (memory, disk)
- Overall application status

### `/api/v1/health/ready`
Readiness probe for Kubernetes/container orchestration.

### `/api/v1/health/live`
Liveness probe for Kubernetes/container orchestration.

## API Documentation

### Swagger UI
- **URL:** `http://localhost:4010/api-docs`
- **Features:** Interactive API documentation
- **Authentication:** Bearer token support
- **Examples:** Request/response examples for all endpoints

### OpenAPI Spec
- **URL:** `http://localhost:4010/api-docs.json`
- **Format:** JSON OpenAPI 3.0 specification

## Logging and Monitoring

### Structured Logging
All requests and responses are logged with:
- Request ID for tracing
- User ID (if authenticated)
- Response time
- Status codes
- Sanitized request bodies

### Performance Monitoring
- Automatic detection of slow requests (>1s)
- Memory usage monitoring
- Request/response timing

### Error Tracking
- Comprehensive error logging
- Stack traces
- Request context
- User context

## Environment Variables

Create a `.env` file with:

```env
# Server Configuration
PORT=4010
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/express-template
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=express_template
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging Configuration
LOG_LEVEL=info
```

## Git Hooks

The setup script automatically creates Git hooks:

### Pre-commit Hook
- Runs ESLint
- Runs TypeScript type checking
- Prevents commits with linting errors

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure MongoDB, PostgreSQL, and Redis are running
   - Check connection strings in `.env`
   - Verify network connectivity

2. **TypeScript Errors**
   - Run `npm run type-check` to see detailed errors
   - Ensure all dependencies are installed
   - Check `tsconfig.json` configuration

3. **Test Failures**
   - Ensure databases are running
   - Check test environment variables
   - Run `npm run seed` to populate test data

4. **Build Errors**
   - Run `npm run clean` to clear build artifacts
   - Check TypeScript configuration
   - Ensure all dependencies are installed

### Getting Help

1. Check the logs for detailed error messages
2. Run health checks: `npm run health`
3. Verify environment setup: `npm run setup:dev`
4. Check API documentation: Visit `/api-docs`

## Contributing

When adding new features:

1. Update API documentation with Swagger comments
2. Add appropriate tests
3. Update this README if needed
4. Follow the existing code style
5. Run `npm run lint` and `npm test` before committing
