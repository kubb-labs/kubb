import * as z from 'zod'
import { catSchema } from './catSchema.ts'
import { dogSchema } from './dogSchema.ts'

export const animalSchema = z
  .union([
    catSchema.and(
      z.object({
        type: z.enum(['cat']),
      }),
    ),
    dogSchema.and(
      z.object({
        type: z.enum(['dog']),
      }),
    ),
  ])
  .and(
    z
      .object({
        type: z.enum(['cat', 'dog']),
      })
      .strict(),
  )

export type AnimalSchema = z.infer<typeof animalSchema>
