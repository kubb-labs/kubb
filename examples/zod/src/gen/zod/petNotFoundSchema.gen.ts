import { z } from '../../zod.ts'

export const petNotFoundSchema = z.object({ code: z.number().optional(), message: z.string().optional() })
