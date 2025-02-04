import type { AddPetRequestType } from '../ts/AddPetRequestType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { categorySchema } from './categorySchema.gen.ts'
import { tagSchema } from './tagSchema.gen.ts'

export const addPetRequestSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  category: z.lazy(() => categorySchema).optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(z.lazy(() => tagSchema)).optional(),
  status: z.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
}) as unknown as ToZod<AddPetRequestType>

export type AddPetRequestSchema = AddPetRequestType
