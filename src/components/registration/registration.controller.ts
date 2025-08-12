import { Request, Response, NextFunction } from 'express';
import { registrationService } from './registration.service';
import { RegistrationRequestSchema } from './registration.validation';
import { ApiError } from '../../common/utils/ApiError';

/**
 * @swagger
 * /v1/registration:
 *   post:
 *     summary: Submit class registration
 *     description: Submit a new class registration. The API will validate the data, check for duplicates, store the registration, and send confirmation emails.
 *     tags: [Registration]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistrationRequest'
 *     responses:
 *       201:
 *         description: Registration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegistrationResponse'
 *       400:
 *         description: Bad request - validation errors
 *       409:
 *         description: Conflict - duplicate registration
 *       500:
 *         description: Internal server error
 */
export const createRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = RegistrationRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      const error = new ApiError(400, 'Validation failed');
      (error as any).errors = errors;
      throw error;
    }

    // Create registration
    const result = await registrationService.createRegistration(validationResult.data);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /v1/registration/validate:
 *   post:
 *     summary: Validate registration data
 *     description: Validate registration data without submitting. This endpoint can be used for real-time validation as users fill out the form.
 *     tags: [Validation]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistrationRequest'
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationResponse'
 *       400:
 *         description: Bad request - validation errors
 */
export const validateRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await registrationService.validateRegistration(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /v1/registration/{registrationId}:
 *   get:
 *     summary: Get registration details
 *     description: Retrieve details of a specific registration by ID
 *     tags: [Registration]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: registrationId
 *         in: path
 *         required: true
 *         description: Unique identifier for the registration
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegistrationDetails'
 *       404:
 *         description: Registration not found
 */
export const getRegistrationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      throw new ApiError(400, 'Registration ID is required');
    }

    const registration = await registrationService.getRegistrationById(registrationId);
    res.status(200).json(registration);
  } catch (error) {
    next(error);
  }
};
