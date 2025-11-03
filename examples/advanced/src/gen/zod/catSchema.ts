import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Cat } from '../models/ts/Cat.ts'

export const catSchema = z.object({
  type: z.string().min(1),
  name: z.optional(z.string()),
  indoor: z.boolean(),
}) as unknown as ToZod<Cat>

export type CatSchema = Cat
