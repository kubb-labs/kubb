import { z } from '../../zod.ts'
import { addressSchema } from './addressSchema.gen.ts'

export const customerSchema = z.object({
  id: z.number().int().optional(),
  username: z.string().optional(),
  address: z.array(z.lazy(() => addressSchema)).optional(),
})

export type CustomerSchema = z.infer<typeof customerSchema>