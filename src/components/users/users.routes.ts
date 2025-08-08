import { Router } from 'express';
import * as controller from './users.controller';
import { validate } from '@common/middleware/validation.middleware';
import { UserRegistrationSchema, UserLoginSchema } from './users.validation';

const router = Router();

router.post('/register', validate(UserRegistrationSchema), controller.registerUser);
router.post('/login', validate(UserLoginSchema), controller.loginUser);

export default router;
