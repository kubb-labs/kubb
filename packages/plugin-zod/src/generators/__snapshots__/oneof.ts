import { z } from 'zod'

export const test = z.union([
  z.object({
    propertyA: z.string().optional(),
  }),
  z.object({
    propertyA: z.string().optional(),
  }),
])
