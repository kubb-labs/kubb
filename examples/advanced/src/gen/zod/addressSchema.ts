import type { Address } from '../models/ts/Address.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
}) as unknown as ToZod<Address>

export type AddressSchema = Address
