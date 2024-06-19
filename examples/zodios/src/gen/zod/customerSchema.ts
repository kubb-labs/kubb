import { addressSchema } from './addressSchema'
import { z } from 'zod'

export const customerSchema = z.object({
  id: z.coerce.number().optional(),
  username: z.coerce.string().optional(),
  address: z.array(z.lazy(() => addressSchema)).optional(),
})
