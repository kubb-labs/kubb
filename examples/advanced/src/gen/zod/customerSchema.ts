import * as z from 'zod'
import type { Customer } from '../models/ts/Customer.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { addressSchema } from './addressSchema.ts'

export const customerSchema = z.object({
  id: z.optional(z.number().int()),
  username: z.optional(z.string()),
  params: z.optional(
    z.object({
      status: z.enum(['placed', 'approved', 'delivered']).describe('Order Status'),
      type: z.string(),
    }),
  ),
  address: z.optional(z.array(z.lazy(() => addressSchema))),
}) as unknown as ToZod<Customer>

export type CustomerSchema = Customer
