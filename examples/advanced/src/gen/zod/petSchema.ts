import * as z from 'zod'
import { categorySchema } from './categorySchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'

export const petSchema = z.object({
  id: z.int().optional(),
  get parent() {
    return z.array(petSchema).optional()
  },
  signature: z
    .string()
    .regex(/^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/)
    .optional(),
  name: z.string(),
  url: z.url().max(255).optional(),
  category: categorySchema.optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(tagTagSchema).optional(),
  status: z.enum(['available', 'pending', 'sold']).optional().describe('pet status in the store'),
})

export type PetSchema = z.infer<typeof petSchema>
