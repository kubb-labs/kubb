import { z } from 'zod'

import { addressSchema as addressSchema4 } from './addressSchema'

export const customerSchema = z.object({
  id: z.number().optional(),
  username: z.string().optional(),
  address: z.array(z.lazy(() => addressSchema4)).optional(),
})
