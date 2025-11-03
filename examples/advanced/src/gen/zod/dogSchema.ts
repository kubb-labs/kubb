import { z } from 'zod/v4'

export const dogSchema = z.object({
  type: z.string().min(1),
  name: z.string(),
})

export type DogSchema = z.infer<typeof dogSchema>
