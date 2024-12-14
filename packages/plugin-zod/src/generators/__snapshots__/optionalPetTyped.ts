import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const optionalPet = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
  tag: z.string().optional(),
} satisfies ToZod<OptionalPet>)
