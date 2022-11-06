import { z } from 'zod';

export const AuthenticatedUserValidationSchema = z.object({
	token: z.string(),
	username: z.string().min(6),
	email: z.string().email(),
});

export type AuthenticatedUser = z.infer<typeof AuthenticatedUserValidationSchema>;
