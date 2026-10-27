import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createDocumentSchema = z.object({
  title: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().optional(),
  content: z.record(z.any()).optional(),
  baseVersion: z.number('baseVersion must be a number'),
});

export const shareDocumentSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['viewer', 'editor']),
});

export const revokeShareSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ShareDocumentInput = z.infer<typeof shareDocumentSchema>;
export type RevokeShareInput = z.infer<typeof revokeShareSchema>;
