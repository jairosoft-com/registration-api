import { z } from 'zod';

// Accept either the nested { body: {...} } shape (used by tests) or a flat body shape (used by API clients)
const FlatRegistration = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const UserRegistrationSchema = z.union([
  z.object({ body: FlatRegistration }), // nested shape
  FlatRegistration, // flat shape
]);

const FlatLogin = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UserLoginSchema = z.union([z.object({ body: FlatLogin }), FlatLogin]);
