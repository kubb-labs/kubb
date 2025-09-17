import type { Customer } from '../models/ts/Customer.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { addressSchema } from './addressSchema.ts'
import { z } from 'zod/v4'

export const customerSchema = z.object({
  id: z.int().optional(),
  username: z.string().optional(),
  get address() {
    return z.array(addressSchema).optional()
  },
}) as unknown as ToZod<Customer>

export type CustomerSchema = Customer
