import { categorySchema } from './categorySchema'
import { tagTagSchema } from './tag/tagSchema'
import { z } from 'zod'
import type { AddPetRequest } from '../models/ts/AddPetRequest'

export const addPetRequestSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.coerce.string(),
  category: z.lazy(() => categorySchema).optional(),
  photoUrls: z.array(z.coerce.string()),
  tags: z.array(z.lazy(() => tagTagSchema)).optional(),
  status: z.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
}) as z.ZodType<AddPetRequest>
