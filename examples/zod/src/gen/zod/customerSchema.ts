import { z } from 'zod'

import { addressSchema as addressSchema1 } from './addressSchema'

export const customerSchema = z.object({
  id: z.number().optional(),
  username: z.string().optional(),
  address: z.array(z.lazy(() => addressSchema1)).optional(),
})
