import { categorySchema } from './categorySchema.gen'
import { tagSchema } from './tagSchema.gen'
import { z } from '../../zod.ts'

export const addPetRequestSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  category: z.lazy(() => categorySchema).optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(z.lazy(() => tagSchema)).optional(),
  status: z.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
})
export type AddPetRequestSchema = z.infer<typeof addPetRequestSchema>
