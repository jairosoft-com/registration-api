/**
 * Test Helper Functions
 * Common utilities for testing Express.js applications
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '@/config';

/**
 * Create a mock Express request object
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    cookies: {},
    method: 'GET',
    url: '/',
    baseUrl: '',
    originalUrl: '/',
    path: '/',
    ...overrides,
  };
}

/**
 * Create a mock Express response object
 */
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    locals: {},
  };
  return res;
}

/**
 * Create a mock next function
 */
export function createMockNext(): NextFunction {
  return jest.fn();
}

/**
 * Create an authenticated request with JWT token
 */
export function createAuthenticatedRequest(
  userId: string,
  overrides: Partial<Request> = {}
): Partial<Request> {
  const token = jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: '1h',
  });

  return createMockRequest({
    headers: {
      authorization: `Bearer ${token}`,
    },
    user: { id: userId },
    ...overrides,
  });
}

/**
 * Expect an API error response
 */
export function expectApiError(res: Partial<Response>, statusCode: number, message?: string): void {
  expect(res.status).toHaveBeenCalledWith(statusCode);

  if (message) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message,
        }),
      })
    );
  }
}

/**
 * Expect a successful API response
 */
export function expectApiSuccess(
  res: Partial<Response>,
  statusCode: number = 200,
  data?: any
): void {
  expect(res.status).toHaveBeenCalledWith(statusCode);

  if (data !== undefined) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data,
      })
    );
  }
}

/**
 * Create mock pagination query
 */
export function createPaginationQuery(
  page: number = 1,
  limit: number = 10
): Record<string, string> {
  return {
    page: page.toString(),
    limit: limit.toString(),
    skip: ((page - 1) * limit).toString(),
  };
}

/**
 * Wait for async operations to complete
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Create a delay for testing async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock date for consistent testing
 */
export function mockDate(date: Date | string = '2024-01-01'): void {
  const mockedDate = new Date(date);
  jest.useFakeTimers();
  jest.setSystemTime(mockedDate);
}

/**
 * Restore original date
 */
export function restoreDate(): void {
  jest.useRealTimers();
}

/**
 * Extract error message from response
 */
export function getErrorMessage(res: Partial<Response>): string | undefined {
  const jsonCall = (res.json as jest.Mock).mock.calls[0];
  return jsonCall?.[0]?.error?.message;
}

/**
 * Extract data from successful response
 */
export function getResponseData(res: Partial<Response>): any {
  const jsonCall = (res.json as jest.Mock).mock.calls[0];
  return jsonCall?.[0]?.data;
}
