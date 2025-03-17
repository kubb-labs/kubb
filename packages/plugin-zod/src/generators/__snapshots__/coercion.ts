import { z } from 'zod'

export const pet = z.object({
  id: z.coerce.number().int(),
  name: z.coerce.string(),
  date: z.coerce.date().optional(),
  uuid: z.coerce.string().uuid().optional(),
  email: z.coerce.string().email().optional(),
  pattern: z.coerce
    .string()
    .regex(/^[a-zA-Z0-9]{3}$/)
    .optional(),
  tag: z.coerce.string().min(5).max(100).optional(),
})
