import { categorySchema } from './categorySchema'
import { tagTagSchema } from './tag/tagSchema'
import { z } from 'zod'
import type { Pet } from '../models/ts/Pet'

export const petSchema = z.object({
  'id': z.number().optional(),
  'name': z.string(),
  'category': z.lazy(() => categorySchema).optional(),
  'photoUrls': z.array(z.string()),
  'tags': z.array(z.lazy(() => tagTagSchema)).optional(),
  'status': z.enum([`available`, `pending`, `sold`]).describe(`pet status in the store`).optional(),
}) as z.ZodType<Pet>
