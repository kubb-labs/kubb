import { addressSchema } from './addressSchema'
import { z } from 'zod'
import type { Customer } from '../models/ts/Customer'

export const customerSchema: z.ZodType<Customer> = z.object({
  'id': z.number().optional(),
  'username': z.string().optional(),
  'address': z.array(z.lazy(() => addressSchema)).optional(),
})
