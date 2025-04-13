import { z } from '../../zod.ts'
import { addressSchema } from './addressSchema.gen.ts'

export const customerSchema = z.interface({
  id: z.int().optional(),
  username: z.string().optional(),
  get address() {
    return z.array(addressSchema).optional()
  },
})

export type CustomerSchema = z.infer<typeof customerSchema>
