import * as z from 'zod'
import type { Dog } from '../models/ts/Dog.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { imageSchema } from './imageSchema.ts'

export const dogSchema = z.object({
  type: z.string().min(1),
  name: z.string(),
  image: z.optional(z.lazy(() => imageSchema)),
}) as unknown as ToZod<Dog>

export type DogSchema = Dog
