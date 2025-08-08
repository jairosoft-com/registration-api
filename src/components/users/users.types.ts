import { z } from 'zod';
import { UserRegistrationSchema, UserLoginSchema } from './users.validation';

// Infer types from Zod schemas for type safety
export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>['body'];
export type UserLoginInput = z.infer<typeof UserLoginSchema>['body'];

export interface UserPublicData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  emailVerified?: boolean;
  // Legacy field for backward compatibility
  name?: string;
}
