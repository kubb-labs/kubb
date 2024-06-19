import { categorySchema } from './categorySchema'
import { tagSchema } from './tagSchema'
import { z } from 'zod'

export const addPetRequestSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.coerce.string(),
  category: z.lazy(() => categorySchema).optional(),
  photoUrls: z.array(z.coerce.string()),
  tags: z.array(z.lazy(() => tagSchema)).optional(),
  status: z.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
})
