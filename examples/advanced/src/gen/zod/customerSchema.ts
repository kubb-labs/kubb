import type { Customer } from '../models/ts/Customer.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { addressSchema } from './addressSchema.ts'
import { z } from 'zod'

export const customerSchema = z.object({
  id: z.number().int().optional(),
  username: z.string().optional(),
  address: z.array(z.lazy(() => addressSchema)).optional(),
}) as unknown as ToZod<Customer>

export type CustomerSchema = Customer
