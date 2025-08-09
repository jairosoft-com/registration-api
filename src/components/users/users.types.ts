import { z } from 'zod';
import { UserRegistrationSchema, UserLoginSchema } from './users.validation';

// Infer types from Zod schemas for type safety
// Accept both nested and flat shapes; normalize elsewhere
export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;

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
