import { z } from '../../zod.ts'
import { categorySchema } from './categorySchema.gen.ts'
import { tagSchema } from './tagSchema.gen.ts'

export const petSchema = z.interface({
  id: z.number().int().optional(),
  internalId: z
    .string()
    .regex(/^[0-9]{1,19}$/)
    .optional(),
  name: z.string().uuid(),
  get category() {
    return categorySchema.optional()
  },
  photoUrls: z.array(z.string()),
  tags: z.array(tagSchema).optional(),
  status: z.enum(['available', 'pending', 'sold']).describe('pet status in the store').optional(),
})

export type PetSchema = z.infer<typeof petSchema>
