import { z } from '../../zod.ts'

export const categorySchema = z.object({
  id: z.coerce.number().optional(),
  name: z.coerce.string().optional(),
  parent: z.lazy(() => categorySchema).optional(),
})
