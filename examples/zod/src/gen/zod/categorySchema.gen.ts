import { z } from '../../zod.ts'

export const categorySchema = z.interface({
  id: z.number().int().optional(),
  name: z.string().optional(),
  get parent() {
    return categorySchema.optional()
  },
})

export type CategorySchema = z.infer<typeof categorySchema>
