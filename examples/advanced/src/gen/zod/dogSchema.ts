import * as z from 'zod'
import { imageSchema } from './imageSchema.ts'

export const dogSchema = z
  .object({
    type: z.string().min(1),
    name: z.string(),
    image: imageSchema.nullish(),
  })
  .strict()

export type DogSchema = z.infer<typeof dogSchema>
