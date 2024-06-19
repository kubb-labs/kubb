import { z } from 'zod'

export const petNotFoundSchema = z.object({ code: z.coerce.number().optional(), message: z.coerce.string().optional() })
