import { z } from '../../zod.ts'

export const apiResponseSchema = z.object({ code: z.number().optional(), type: z.string().optional(), message: z.string().optional() })

export type ApiResponseSchema = z.infer<typeof apiResponseSchema>
