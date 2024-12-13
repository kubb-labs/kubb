import { z } from 'zod'

export const tagTagSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
})

export type TagTagSchema = z.infer<typeof tagTagSchema>
