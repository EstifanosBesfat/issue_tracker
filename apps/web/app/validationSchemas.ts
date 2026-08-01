import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(255),
  description: z.string().min(1, 'Description is required.'),
  divisionId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const patchProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(255),
  description: z.string().min(1, 'Description is required.'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  category: z
    .enum([
      'MOBILE_NETWORK',
      'FIBER_BROADBAND',
      'TELEBIRR_BILLING',
      'CORE_INFRASTRUCTURE',
      'OTHER',
    ])
    .optional(),
  divisionId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  imageUrls: z.array(z.string().url()).max(5).optional(),
});

export const patchTaskSchema = createTaskSchema.partial();

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.').max(10000),
});

export const patchUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

export const createDivisionSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(100),
});

export const patchDivisionSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(100).optional(),
  isActive: z.boolean().optional(),
});
