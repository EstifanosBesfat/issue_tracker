import { z } from 'zod';

export const createIssueSchema = z.object({
  title:       z.string().min(1, 'Title is required.').max(255),
  description: z.string().min(1, 'Description is required.'),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  category:    z.enum(['MOBILE_NETWORK', 'FIBER_BROADBAND', 'TELEBIRR_BILLING', 'CORE_INFRASTRUCTURE', 'OTHER']).optional(),
  // References Division.id — issues are raised against a managed division
  divisionId:  z.string().optional().nullable(),
  // Accept any non-empty string for dueDate (the form gives YYYY-MM-DD, API converts to ISO)
  dueDate:     z.string().optional().nullable(),
  // Accept any string or null for assigneeId (empty string is coerced to null in the form)
  assigneeId:  z.string().optional().nullable(),
  imageUrls:   z.array(z.string().url()).max(5).optional(),
});

// Backward-compatible alias (used by existing POST route and new issue form)
export const issueSchema = createIssueSchema;

export const patchIssueSchema = createIssueSchema
  .partial()
  .extend({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(),
  });

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.').max(10000),
});

export const patchUserSchema = z.object({
  role:     z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

export const createDivisionSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(100),
});

export const patchDivisionSchema = z.object({
  name:     z.string().min(1, 'Name is required.').max(100).optional(),
  isActive: z.boolean().optional(),
});

export const bulkStatusSchema = z.object({
  ids:    z.array(z.string()).min(1),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']),
});
