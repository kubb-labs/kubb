import { addressSchema } from './addressSchema'
import { z } from 'zod'
import type { Customer } from '../models/ts/Customer'

export const customerSchema = z.object({
  id: z.coerce.number().optional(),
  username: z.coerce.string().optional(),
  address: z.array(z.lazy(() => addressSchema)).optional(),
}) as z.ZodType<Customer>
