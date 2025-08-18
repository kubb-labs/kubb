import type { Customer } from '../models/ts/Customer.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { addressSchema } from './addressSchema.ts'
import { z } from 'zod/v4'

export const customerSchema = z.object({
  id: z.optional(z.int()),
  username: z.optional(z.string()),
  get address() {
    return z.optional(z.array(addressSchema))
  },
}) as unknown as ToZod<Customer>

export type CustomerSchema = Customer
