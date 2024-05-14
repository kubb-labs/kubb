import { z } from 'zod'

export const categorySchema = z.object({ id: z.number().optional(), name: z.string().optional(), parent: z.lazy(() => categorySchema).optional() })
