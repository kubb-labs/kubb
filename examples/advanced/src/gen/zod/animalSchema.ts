import { catSchema } from './catSchema.ts'
import { dogSchema } from './dogSchema.ts'
import { z } from 'zod/v4'

export const animalSchema = z.union([
  catSchema.and(
    z.object({
      type: z.literal('cat'),
    }),
  ),
  dogSchema.and(
    z.object({
      type: z.literal('dog'),
    }),
  ),
])

export type AnimalSchema = z.infer<typeof animalSchema>
