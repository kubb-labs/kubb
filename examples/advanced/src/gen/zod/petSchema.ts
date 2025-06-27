import { categorySchema } from './categorySchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'
import { z } from 'zod/v4'

export const petSchema = z.object({
  id: z.int().optional(),
  name: z.string(),
  get category() {
    return categorySchema.optional()
  },
  photoUrls: z.array(z.string()),
  get tags() {
    return z.array(tagTagSchema).optional()
  },
  status: z.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
})

export type PetSchema = z.infer<typeof petSchema>
