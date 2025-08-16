import type { Dog } from '../models/ts/Dog.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const dogSchema = z.object({
  type: z.string().min(1),
  name: z.string(),
}) as unknown as ToZod<Dog>

export type DogSchema = Dog
