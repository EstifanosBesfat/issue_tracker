// app/validationSchemas.ts
import { z } from 'zod';

export const issueSchema = z.object({
  title: z.string().min(1, "Title is required.").max(255),
  description: z.string().min(1, "Description is required."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  category: z.enum(["MOBILE_NETWORK", "FIBER_BROADBAND", "TELEBIRR_BILLING", "CORE_INFRASTRUCTURE", "OTHER"]).optional(),
});

export const patchIssueSchema = z.object({
  title: z.string().min(1, "Title is required.").max(255).optional(),
  description: z.string().min(1, "Description is required.").optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  category: z.enum(["MOBILE_NETWORK", "FIBER_BROADBAND", "TELEBIRR_BILLING", "CORE_INFRASTRUCTURE", "OTHER"]).optional(),
});