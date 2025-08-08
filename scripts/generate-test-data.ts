import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import logger from '../src/utils/logger';

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface TestData {
  users: TestUser[];
  apiRequests: any[];
  errorLogs: any[];
}

const generateTestUsers = (count: number): TestUser[] => {
  const users: TestUser[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    users.push({
      email: faker.internet.email({ firstName, lastName }),
      password: faker.internet.password({ length: 12 }),
      firstName,
      lastName,
    });
  }

  return users;
};

const generateApiRequests = (count: number) => {
  const requests = [];
  const endpoints = [
    { method: 'POST', path: '/api/v1/users/register' },
    { method: 'POST', path: '/api/v1/users/login' },
    { method: 'GET', path: '/' },
  ];

  for (let i = 0; i < count; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const timestamp = faker.date.recent({ days: 7 });

    requests.push({
      id: faker.string.uuid(),
      method: endpoint.method,
      path: endpoint.path,
      statusCode: faker.helpers.arrayElement([200, 201, 400, 401, 500]),
      responseTime: faker.number.int({ min: 10, max: 2000 }),
      timestamp: timestamp.toISOString(),
      userAgent: faker.internet.userAgent(),
      ip: faker.internet.ip(),
    });
  }

  return requests;
};

const generateErrorLogs = (count: number) => {
  const errors = [];
  const errorTypes = [
    'ValidationError',
    'AuthenticationError',
    'DatabaseError',
    'NetworkError',
    'InternalServerError',
  ];

  for (let i = 0; i < count; i++) {
    const timestamp = faker.date.recent({ days: 7 });

    errors.push({
      id: faker.string.uuid(),
      type: faker.helpers.arrayElement(errorTypes),
      message: faker.lorem.sentence(),
      stack: faker.lorem.paragraphs(2),
      timestamp: timestamp.toISOString(),
      level: faker.helpers.arrayElement(['error', 'warn', 'info']),
      userId: faker.helpers.arrayElement([null, faker.string.uuid()]),
    });
  }

  return errors;
};

const generateTestData = (options: {
  usersCount?: number;
  requestsCount?: number;
  errorsCount?: number;
  outputDir?: string;
}) => {
  const {
    usersCount = 50,
    requestsCount = 100,
    errorsCount = 20,
    outputDir = './test-data',
  } = options;

  logger.info('Generating test data...');

  const testData: TestData = {
    users: generateTestUsers(usersCount),
    apiRequests: generateApiRequests(requestsCount),
    errorLogs: generateErrorLogs(errorsCount),
  };

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write test data to files
  const files = [
    { name: 'users.json', data: testData.users },
    { name: 'api-requests.json', data: testData.apiRequests },
    { name: 'error-logs.json', data: testData.errorLogs },
  ];

  files.forEach(({ name, data }) => {
    const filePath = path.join(outputDir, name);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    logger.info(`Generated ${name} with ${data.length} records`);
  });

  // Generate a summary file
  const summary = {
    generatedAt: new Date().toISOString(),
    summary: {
      users: testData.users.length,
      apiRequests: testData.apiRequests.length,
      errorLogs: testData.errorLogs.length,
    },
    sampleData: {
      users: testData.users.slice(0, 3),
      apiRequests: testData.apiRequests.slice(0, 3),
      errorLogs: testData.errorLogs.slice(0, 3),
    },
  };

  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  logger.info(`Test data generation completed! Files saved to ${outputDir}`);
  logger.info(
    `Summary: ${testData.users.length} users, ${testData.apiRequests.length} requests, ${testData.errorLogs.length} errors`
  );

  return testData;
};

// Run generation if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    usersCount: parseInt(args[0]) || 50,
    requestsCount: parseInt(args[1]) || 100,
    errorsCount: parseInt(args[2]) || 20,
    outputDir: args[3] || './test-data',
  };

  generateTestData(options);
}

export { generateTestData, generateTestUsers, generateApiRequests, generateErrorLogs };
