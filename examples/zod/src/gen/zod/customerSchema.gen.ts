import { addressSchema } from './addressSchema.gen'
import { z } from 'zod'

export const customerSchema = z.object({ id: z.number().optional(), username: z.string().optional(), address: z.array(z.lazy(() => addressSchema)).optional() })
