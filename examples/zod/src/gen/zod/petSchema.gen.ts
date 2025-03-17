import type { PetType } from '../ts/PetType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { categorySchema } from './categorySchema.gen.ts'
import { tagSchema } from './tagSchema.gen.ts'

export const petSchema = z.object({
  id: z.number().int().optional(),
  internalId: z
    .string()
    .regex(/^[0-9]{1,19}$/)
    .optional(),
  name: z.string().uuid(),
  category: z.lazy(() => categorySchema).optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(z.lazy(() => tagSchema)).optional(),
  status: z.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
}) as unknown as ToZod<PetType>

export type PetSchema = PetType
