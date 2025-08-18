import type { Address } from '../models/ts/Address.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const addressSchema = z.object({
  street: z.optional(z.string()),
  city: z.optional(z.string()),
  state: z.optional(z.string()),
  zip: z.optional(z.string()),
}) as unknown as ToZod<Address>

export type AddressSchema = Address
