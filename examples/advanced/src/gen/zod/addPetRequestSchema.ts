import * as z from 'zod'
import { categorySchema } from './categorySchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'

export const addPetRequestSchema = z.object({
  id: z.int().optional(),
  name: z.string(),
  category: categorySchema.optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(tagTagSchema).optional(),
  status: z.enum(['available', 'pending', 'sold']).optional().describe('pet status in the store'),
})

export type AddPetRequestSchema = z.infer<typeof addPetRequestSchema>
