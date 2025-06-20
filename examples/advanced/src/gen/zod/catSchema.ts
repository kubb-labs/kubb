import { z } from 'zod'

export const catSchema = z.object({
  type: z.string().min(1),
  name: z.string().optional(),
  indoor: z.boolean(),
})

export type CatSchema = z.infer<typeof catSchema>
