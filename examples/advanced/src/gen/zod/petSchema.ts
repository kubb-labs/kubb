import { categorySchema } from './categorySchema'
import { tagSchema } from './tagSchema'
import { z } from 'zod'
import type { Pet } from '../models/ts/Pet'

export const petSchema: z.ZodType<Pet> = z.object({
  'id': z.number().readonly().optional(),
  'name': z.string(),
  'category': z.lazy(() => categorySchema).optional(),
  'photoUrls': z.array(z.string()),
  'tags': z.array(z.lazy(() => tagSchema)).optional(),
  'status': z.enum([`available`, `pending`, `sold`]).describe(`pet status in the store`).optional(),
})
