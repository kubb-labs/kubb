import { z } from 'zod/v4'

export const categorySchema = z.object({
  id: z.int().optional(),
  name: z.string().optional(),
})

export type CategorySchema = z.infer<typeof categorySchema>
