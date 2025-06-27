import { z } from 'zod'

export const dogSchema = z.object({
  type: z.string().min(1),
  name: z.string(),
})

export type DogSchema = z.infer<typeof dogSchema>
