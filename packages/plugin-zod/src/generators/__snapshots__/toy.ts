import { z } from 'zod'

export const toy = z
  .object({
    id: z.string().uuid(),
    name: z.string().optional(),
    description: z.string().nullable().nullish(),
  })
  .nullable()
