import { z } from 'zod'

export const apiResponseSchema = z.object({ code: z.number().optional(), type: z.string().optional(), message: z.string().optional() })
