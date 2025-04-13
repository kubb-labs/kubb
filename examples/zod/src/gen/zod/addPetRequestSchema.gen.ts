import { z } from '../../zod.ts'
import { categorySchema } from './categorySchema.gen.ts'
import { tagSchema } from './tagSchema.gen.ts'

export const addPetRequestSchema = z.interface({
  id: z.number().int().optional(),
  name: z.string(),
  get category() {
    return categorySchema.optional()
  },
  photoUrls: z.array(z.string()),
  tags: z.array(tagSchema).optional(),
  status: z.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
})

export type AddPetRequestSchema = z.infer<typeof addPetRequestSchema>
