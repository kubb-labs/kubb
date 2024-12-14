import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const pets = z.array(
  z.object({
    id: z.number().int(),
    name: z.string(),
    tag: z.string().optional(),
  } satisfies ToZod<Pets>),
)
