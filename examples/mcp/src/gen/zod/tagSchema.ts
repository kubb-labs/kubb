import { z } from 'zod'

export const tagSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
})
