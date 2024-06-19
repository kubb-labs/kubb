import { z } from 'zod'

export const categorySchema = z.object({ id: z.coerce.number().optional(), name: z.coerce.string().optional() })
