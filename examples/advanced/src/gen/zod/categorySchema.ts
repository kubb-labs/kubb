import type { Category } from '../models/ts/Category'
import { z } from 'zod'

export const categorySchema = z.object({ id: z.number().int().optional(), name: z.string().optional() }) as z.ZodType<Category>
