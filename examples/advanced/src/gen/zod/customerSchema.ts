import * as z from 'zod'
import { addressSchema } from './addressSchema.ts'

export const customerSchema = z.object({
  id: z.int().optional(),
  username: z.string().optional(),
  params: z
    .object({
      status: z.enum(['placed', 'approved', 'delivered']).describe('Order Status'),
      type: z.string(),
    })
    .optional(),
  address: z.array(addressSchema).optional(),
})

export type CustomerSchema = z.infer<typeof customerSchema>
