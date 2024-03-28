import { z } from 'zod'
import type { Category } from '../models/ts/Category'

export const categorySchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
}) as z.ZodType<Category>
