import { z } from '../../zod.ts'

export const categorySchema = z.object({ id: z.number().optional(), name: z.string().optional(), parent: z.lazy(() => categorySchema).optional() })

export type CategorySchema = z.infer<typeof categorySchema>
