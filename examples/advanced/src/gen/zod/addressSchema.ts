import { z } from 'zod'
import type { Address } from '../models/ts/Address'

export const addressSchema: z.ZodType<Address> = z.object({
  'street': z.string().optional(),
  'city': z.string().optional(),
  'state': z.string().optional(),
  'zip': z.string().optional(),
})
