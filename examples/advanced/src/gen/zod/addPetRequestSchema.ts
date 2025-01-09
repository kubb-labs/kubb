import type { AddPetRequest } from '../models/ts/AddPetRequest.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { categorySchema } from './categorySchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'
import { z } from 'zod'

export const addPetRequestSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  category: z.lazy(() => categorySchema).optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(z.lazy(() => tagTagSchema)).optional(),
  status: z.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
}) as unknown as ToZod<AddPetRequest>

export type AddPetRequestSchema = AddPetRequest
