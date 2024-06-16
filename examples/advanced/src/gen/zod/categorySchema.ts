import { z } from 'zod'
import type { Category } from '../models/ts/Category'

export const categorySchema = z.object({ id: z.coerce.number().optional(), name: z.coerce.string().optional() }) as z.ZodType<Category>
