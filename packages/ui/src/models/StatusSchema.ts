import { z } from '@hono/zod-openapi'

export const statusSchema = z
  .object({
    name: z.string().optional(),
    percentages: z.record(z.string(), z.number()),
    executed: z.array(z.any()),
  })
  .openapi('Status')

export type StatusSchema = z.infer<typeof statusSchema>
