import { Router } from 'express';
import { getAvailableSchedules } from './schedule.controller';
import { apiKeyMiddleware } from '../../middleware/apikey.middleware';

const router = Router();

// Apply API key authentication to all schedule routes
router.use(apiKeyMiddleware);

// Schedule endpoints
router.get('/available', getAvailableSchedules);

export default router;
