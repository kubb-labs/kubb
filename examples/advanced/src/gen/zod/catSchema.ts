import type { Cat } from '../models/ts/Cat.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const catSchema = z.object({
  type: z.string().min(1),
  name: z.optional(z.string()),
  indoor: z.boolean(),
}) as unknown as ToZod<Cat>

export type CatSchema = Cat
