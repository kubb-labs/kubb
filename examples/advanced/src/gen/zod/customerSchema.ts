import zod from 'zod'

import { addressSchema } from './addressSchema'

export const customerSchema = zod.object({
  id: zod.number().optional(),
  username: zod.string().optional(),
  address: zod.array(addressSchema).optional(),
})
