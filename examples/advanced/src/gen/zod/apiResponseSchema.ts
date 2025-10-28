import { z } from 'zod/v4'

export const apiResponseSchema = z.object({
  code: z.optional(z.int()),
  type: z.optional(z.string()),
  message: z.optional(z.string()),
})

export type ApiResponseSchema = z.infer<typeof apiResponseSchema>
