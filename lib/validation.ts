import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const formSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  isPublished: z.boolean().default(false)
});

export const fieldSchema = z.object({
  keyName: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1),
  sortOrder: z.number().int(),
  isRequired: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  configJson: z.any().optional(),
  conditional: z.any().optional()
});

export const submissionSchema = z.object({
  formId: z.string().min(1),
  submissionId: z.string().optional(),
  values: z.record(z.any())
});
