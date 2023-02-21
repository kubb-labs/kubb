import zod from 'zod'

import { categorySchema } from './categorySchema'
import { tagSchema } from './tagSchema'

export const petSchema = zod.object({
  id: zod.number().optional(),
  name: zod.string(),
  category: categorySchema.optional(),
  photoUrls: zod.array(zod.string()),
  tags: zod.array(tagSchema).optional(),
  status: zod.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
})
