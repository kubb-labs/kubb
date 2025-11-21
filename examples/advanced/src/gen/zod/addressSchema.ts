import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Address } from '../models/ts/Address.ts'

export const addressSchema = z.object({
  street: z.optional(z.string()),
  city: z.optional(z.string()),
  state: z.optional(z.string()),
  zip: z.optional(z.string()),
}) as unknown as ToZod<Address>

export type AddressSchema = Address
