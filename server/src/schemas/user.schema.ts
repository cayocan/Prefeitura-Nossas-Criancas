import { z } from 'zod';

export const UserSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    role: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
