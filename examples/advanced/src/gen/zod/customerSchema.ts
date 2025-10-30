import { z } from 'zod/v4'
import { addressSchema } from './addressSchema.ts'

export const customerSchema = z.object({
  id: z.optional(z.int()),
  username: z.optional(z.string()),
  get address() {
    return z.optional(z.array(addressSchema))
  },
})

export type CustomerSchema = z.infer<typeof customerSchema>
