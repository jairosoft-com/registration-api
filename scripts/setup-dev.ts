import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import logger from '../src/utils/logger';

interface SetupOptions {
  installDeps?: boolean;
  setupEnv?: boolean;
  setupDocker?: boolean;
  runTests?: boolean;
  seedDatabase?: boolean;
}

const checkNodeVersion = () => {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 18) {
    logger.error(
      `Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`
    );
    process.exit(1);
  }

  logger.info(`Node.js version ${nodeVersion} is supported`);
};

const checkPackageManager = () => {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logger.info(`npm version: ${npmVersion}`);
    return 'npm';
  } catch (error) {
    try {
      const yarnVersion = execSync('yarn --version', { encoding: 'utf8' }).trim();
      logger.info(`yarn version: ${yarnVersion}`);
      return 'yarn';
    } catch (error) {
      logger.error('Neither npm nor yarn is installed. Please install one of them.');
      process.exit(1);
    }
  }
};

const installDependencies = (packageManager: string) => {
  logger.info('Installing dependencies...');

  try {
    if (packageManager === 'yarn') {
      execSync('yarn install', { stdio: 'inherit' });
    } else {
      execSync('npm install', { stdio: 'inherit' });
    }
    logger.info('Dependencies installed successfully');
  } catch (error) {
    logger.error('Failed to install dependencies:', error);
    process.exit(1);
  }
};

const setupEnvironment = () => {
  logger.info('Setting up environment variables...');

  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envExamplePath)) {
    logger.warn('.env.example file not found. Creating basic .env file...');

    const basicEnvContent = `# Server Configuration
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
`;

    fs.writeFileSync(envPath, basicEnvContent);
    logger.info('Created .env file with basic configuration');
  } else if (!fs.existsSync(envPath)) {
    logger.info('Copying .env.example to .env...');
    fs.copyFileSync(envExamplePath, envPath);
    logger.info('Environment file created. Please update the values as needed.');
  } else {
    logger.info('.env file already exists');
  }
};

const setupDocker = () => {
  logger.info('Setting up Docker environment...');

  try {
    // Check if Docker is running
    execSync('docker --version', { stdio: 'pipe' });
    logger.info('Docker is available');

    // Check if docker-compose is available
    try {
      execSync('docker-compose --version', { stdio: 'pipe' });
      logger.info('docker-compose is available');
    } catch (error) {
      logger.warn(
        'docker-compose not found. Please install it if you want to use Docker services.'
      );
    }
  } catch (error) {
    logger.warn(
      'Docker not found. Please install Docker if you want to use containerized services.'
    );
  }
};

const runTests = () => {
  logger.info('Running tests...');

  try {
    execSync('npm test', { stdio: 'inherit' });
    logger.info('All tests passed');
  } catch (error) {
    logger.error('Some tests failed. Please check the test output above.');
    process.exit(1);
  }
};

const seedDatabase = () => {
  logger.info('Seeding database...');

  try {
    // Import and run the seed function
    const { seedDatabase: seedDb } = require('./seed-database');
    seedDb();
    logger.info('Database seeded successfully');
  } catch (error) {
    logger.error('Failed to seed database:', error);
    logger.warn('You can run the seeding manually later with: npm run seed');
  }
};

const createGitHooks = () => {
  logger.info('Setting up Git hooks...');

  const hooksDir = path.join(process.cwd(), '.git', 'hooks');
  const preCommitHook = path.join(hooksDir, 'pre-commit');

  if (!fs.existsSync(hooksDir)) {
    logger.warn('.git directory not found. Skipping Git hooks setup.');
    return;
  }

  const preCommitContent = `#!/bin/sh
# Pre-commit hook to run linting and tests

echo "Running pre-commit checks..."

# Run linting
npm run lint
if [ $? -ne 0 ]; then
  echo "Linting failed. Please fix the issues before committing."
  exit 1
fi

# Run type checking
npm run type-check
if [ $? -ne 0 ]; then
  echo "Type checking failed. Please fix the issues before committing."
  exit 1
fi

echo "Pre-commit checks passed!"
`;

  fs.writeFileSync(preCommitHook, preCommitContent);
  fs.chmodSync(preCommitHook, '755');
  logger.info('Git hooks configured');
};

const setupDev = async (options: SetupOptions = {}) => {
  const {
    installDeps = true,
    setupEnv = true,
    setupDocker = true,
    runTests = true,
    seedDatabase: shouldSeed = false,
  } = options;

  logger.info('Setting up development environment...');

  // Check prerequisites
  checkNodeVersion();
  const packageManager = checkPackageManager();

  // Install dependencies
  if (installDeps) {
    installDependencies(packageManager);
  }

  // Setup environment
  if (setupEnv) {
    setupEnvironment();
  }

  // Setup Docker
  if (setupDocker) {
    setupDocker();
  }

  // Create Git hooks
  createGitHooks();

  // Run tests
  if (runTests) {
    runTests();
  }

  // Seed database
  if (shouldSeed) {
    seedDatabase();
  }

  logger.info('Development environment setup completed!');
  logger.info('');
  logger.info('Next steps:');
  logger.info('1. Update the .env file with your configuration');
  logger.info('2. Start the development server: npm run dev');
  logger.info('3. View API documentation: http://localhost:4010/api-docs');
  logger.info('4. Run tests: npm test');
  logger.info('5. Seed database: npm run seed');
};

// Run setup if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: SetupOptions = {
    installDeps: !args.includes('--no-deps'),
    setupEnv: !args.includes('--no-env'),
    setupDocker: !args.includes('--no-docker'),
    runTests: !args.includes('--no-tests'),
    seedDatabase: args.includes('--seed'),
  };

  setupDev(options);
}

export { setupDev };
