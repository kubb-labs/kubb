import { addressSchema } from './addressSchema.ts'
import { z } from 'zod/v4'

export const customerSchema = z.object({
  id: z.int().optional(),
  username: z.string().optional(),
  get address() {
    return z.array(addressSchema).optional()
  },
})

export type CustomerSchema = z.infer<typeof customerSchema>
