import { z } from 'zod/v4'
import { categorySchema } from './categorySchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'

export const addPetRequestSchema = z.object({
  id: z.optional(z.int()),
  name: z.string(),
  get category() {
    return z.optional(categorySchema)
  },
  photoUrls: z.array(z.string()),
  get tags() {
    return z.optional(z.array(tagTagSchema))
  },
  status: z.optional(z.enum(['available', 'pending', 'sold']).describe('pet status in the store')),
})

export type AddPetRequestSchema = z.infer<typeof addPetRequestSchema>
