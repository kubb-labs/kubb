import type { Dog } from '../models/ts/Dog.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const dogSchema = z.object({
  type: z.string().min(1),
  name: z.string(),
}) as unknown as ToZod<Dog>

export type DogSchema = Dog
