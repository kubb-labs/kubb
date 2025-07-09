import { z } from 'zod/v4'

export const catSchema = z.object({
  type: z.string().min(1),
  name: z.string().optional(),
  indoor: z.boolean(),
})

export type CatSchema = z.infer<typeof catSchema>
