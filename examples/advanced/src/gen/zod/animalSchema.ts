import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Animal } from '../models/ts/Animal.ts'
import { catSchema } from './catSchema.ts'
import { dogSchema } from './dogSchema.ts'

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
