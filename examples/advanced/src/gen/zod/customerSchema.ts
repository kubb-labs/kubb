import type { Customer } from '../models/ts/Customer'
import { addressSchema } from './addressSchema'
import { z } from 'zod'

export const customerSchema = z.object({
  id: z.number().optional(),
  username: z.string().optional(),
  address: z.array(z.lazy(() => addressSchema)).optional(),
}) as z.ZodType<Customer>
