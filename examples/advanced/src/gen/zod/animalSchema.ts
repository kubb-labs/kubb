import type { Animal } from '../models/ts/Animal.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { catSchema } from './catSchema.ts'
import { dogSchema } from './dogSchema.ts'
import { z } from 'zod'

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
]) as unknown as ToZod<Animal>

export type AnimalSchema = Animal
