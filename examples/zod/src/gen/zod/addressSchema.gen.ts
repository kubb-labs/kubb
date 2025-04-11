import type { AddressType } from '../ts/AddressType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
}) as unknown as ToZod<AddressType>

export type AddressSchema = AddressType