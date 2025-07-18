import { z } from 'zod/v4'

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
})

export type AddressSchema = z.infer<typeof addressSchema>
