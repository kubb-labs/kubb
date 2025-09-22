import { z } from 'zod/v4'

export const addressSchema = z.object({
  street: z.optional(z.string()),
  city: z.optional(z.string()),
  state: z.optional(z.string()),
  zip: z.optional(z.string()),
})

export type AddressSchema = z.infer<typeof addressSchema>
