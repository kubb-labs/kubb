import { z } from 'zod'
import type { Customer } from '../models/ts/Customer'
import { addressSchema } from './addressSchema'

export const customerSchema = z.object({
  id: z.number().optional(),
  username: z.string().optional(),
  address: z.array(z.lazy(() => addressSchema).schema).optional(),
}) as z.ZodType<Customer>
