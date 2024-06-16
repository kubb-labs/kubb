import { z } from 'zod'
import type { Address } from '../models/ts/Address'

export const addressSchema = z.object({
  street: z.coerce.string().optional(),
  city: z.coerce.string().optional(),
  state: z.coerce.string().optional(),
  zip: z.coerce.string().optional(),
}) as z.ZodType<Address>
