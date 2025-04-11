import type { CustomerType } from '../ts/CustomerType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { addressSchema } from './addressSchema.gen.ts'

export const customerSchema = z.object({
  id: z.number().int().optional(),
  username: z.string().optional(),
  address: z.array(z.lazy(() => addressSchema)).optional(),
}) as unknown as ToZod<CustomerType>

export type CustomerSchema = CustomerType