import { Router } from 'express';
import {
  createRegistration,
  validateRegistration,
  getRegistrationById,
} from './registration.controller';
import { apiKeyMiddleware } from '../../middleware/apikey.middleware';

const router = Router();

// Apply API key authentication to all registration routes
router.use(apiKeyMiddleware);

// Registration endpoints
router.post('/', createRegistration);
router.post('/validate', validateRegistration);
router.get('/:registrationId', getRegistrationById);

export default router;
