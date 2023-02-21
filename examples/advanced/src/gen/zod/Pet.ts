import zod from 'zod'

import { Category } from './Category'
import { Tag } from './Tag'

export const Pet = zod.object({
  id: zod.number().optional(),
  name: zod.string(),
  category: Category.optional(),
  photoUrls: zod.array(zod.string()),
  tags: zod.array(Tag).optional(),
  status: zod.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
})
