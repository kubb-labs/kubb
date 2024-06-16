import { z } from 'zod'

export const addressSchema = z.object({
  street: z.coerce.string().optional(),
  city: z.coerce.string().optional(),
  state: z.coerce.string().optional(),
  zip: z.coerce.string().optional(),
})
