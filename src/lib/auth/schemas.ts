import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type SignInInput = z.infer<typeof signInSchema>;
