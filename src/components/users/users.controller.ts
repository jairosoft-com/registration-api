import { Request, Response, NextFunction } from 'express';
import * as service from './users.service';
import { UserRegistrationSchema, UserLoginSchema } from './users.validation';

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with the provided information
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *           examples:
 *             valid_user:
 *               summary: Valid user registration
 *               value:
 *                 email: "john.doe@example.com"
 *                 password: "securePassword123"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *             invalid_email:
 *               summary: Invalid email format
 *               value:
 *                 email: "invalid-email"
 *                 password: "password123"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success_response:
 *                 summary: Successful registration
 *                 value:
 *                   message: "User registered successfully"
 *                   data:
 *                     user:
 *                       id: "507f1f77bcf86cd799439011"
 *                       email: "john.doe@example.com"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       createdAt: "2025-01-15T10:30:00Z"
 *                       updatedAt: "2025-01-15T10:30:00Z"
 *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE2NzM4NzQ4MDAsImV4cCI6MTY3Mzk2MTIwMH0.example"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   status: "error"
 *                   statusCode: 400
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "email"
 *                       message: "Invalid email format"
 *                     - field: "password"
 *                       message: "Password must be at least 8 characters long"
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   status: "error"
 *                   statusCode: 400
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "firstName"
 *                       message: "First name is required"
 *                     - field: "lastName"
 *                       message: "Last name is required"
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "error"
 *               statusCode: 409
 *               message: "User with this email already exists"
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "error"
 *               statusCode: 429
 *               message: "Too many authentication attempts, please try again later"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "error"
 *               statusCode: 500
 *               message: "Internal server error"
 */
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body using Zod schema
    const validatedBody = UserRegistrationSchema.parse(req.body);
    const { user, token } = await service.registerNewUser(validatedBody.body);
    res.status(201).json({
      message: 'User registered successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: Authenticate user
 *     description: Authenticates a user with email and password, returns JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *           examples:
 *             valid_login:
 *               summary: Valid login credentials
 *               value:
 *                 email: "john.doe@example.com"
 *                 password: "securePassword123"
 *             invalid_credentials:
 *               summary: Invalid credentials
 *               value:
 *                 email: "john.doe@example.com"
 *                 password: "wrongpassword"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success_response:
 *                 summary: Successful login
 *                 value:
 *                   message: "Login successful"
 *                   data:
 *                     user:
 *                       id: "507f1f77bcf86cd799439011"
 *                       email: "john.doe@example.com"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       createdAt: "2025-01-15T10:30:00Z"
 *                       updatedAt: "2025-01-15T10:30:00Z"
 *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE2NzM4NzQ4MDAsImV4cCI6MTY3Mzk2MTIwMH0.example"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   status: "error"
 *                   statusCode: 400
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "email"
 *                       message: "Invalid email format"
 *                     - field: "password"
 *                       message: "Password is required"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "error"
 *               statusCode: 401
 *               message: "Invalid email or password"
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "error"
 *               statusCode: 429
 *               message: "Too many authentication attempts, please try again later"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "error"
 *               statusCode: 500
 *               message: "Internal server error"
 */
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body using Zod schema
    const validatedBody = UserLoginSchema.parse(req.body);
    const { user, token } = await service.loginUser(
      validatedBody.body.email,
      validatedBody.body.password
    );
    res.status(200).json({
      message: 'Login successful',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};
