import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Dog } from '../models/ts/Dog.ts'

export const dogSchema = z.object({
  type: z.string().min(1),
  name: z.string(),
}) as unknown as ToZod<Dog>

export type DogSchema = Dog
