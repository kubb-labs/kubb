import { z } from 'zod/v4'
import { categorySchema } from './categorySchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'

export const petSchema = z.object({
  id: z.optional(z.int()),
  signature: z.optional(z.string().regex(/^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/)),
  name: z.string(),
  url: z.optional(z.url().max(255)),
  get category() {
    return z.optional(categorySchema)
  },
  photoUrls: z.array(z.string()),
  get tags() {
    return z.optional(z.array(tagTagSchema))
  },
  status: z.optional(z.enum(['available', 'pending', 'sold']).describe('pet status in the store')),
})

export type PetSchema = z.infer<typeof petSchema>
