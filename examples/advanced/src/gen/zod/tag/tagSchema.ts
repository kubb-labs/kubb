import { z } from 'zod/v4'

export const tagTagSchema = z.object({
  id: z.int().min(5).max(7).default(1),
  name: z.string().optional(),
})

export type TagTagSchema = z.infer<typeof tagTagSchema>
