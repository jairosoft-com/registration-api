import { Request, Response, NextFunction } from 'express';
import { scheduleService } from './schedule.service';
import { ScheduleQuerySchema } from '../registration/registration.validation';
import { ApiError } from '../../common/utils/ApiError';

/**
 * @swagger
 * /v1/schedule/available:
 *   get:
 *     summary: Get available time slots
 *     description: Retrieve available time slots for class registration. This endpoint provides the schedule options for the dropdown.
 *     tags: [Schedule]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: date
 *         in: query
 *         description: Filter schedules by date (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: limit
 *         in: query
 *         description: Maximum number of schedules to return
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Available schedules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleResponse'
 *       400:
 *         description: Bad request - invalid parameters
 *       500:
 *         description: Internal server error
 */
export const getAvailableSchedules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate query parameters
    const validationResult = ScheduleQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      const error = new ApiError(400, 'Invalid query parameters');
      (error as any).errors = errors;
      throw error;
    }

    const { date, limit } = validationResult.data;

    // Get available schedules
    const result = await scheduleService.getAvailableSchedules(date, limit);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
