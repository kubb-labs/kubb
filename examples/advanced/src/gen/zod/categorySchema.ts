import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Category } from '../models/ts/Category.ts'

export const categorySchema = z.object({
  id: z.optional(z.number().int()),
  name: z.optional(z.string()),
}) as unknown as ToZod<Category>

export type CategorySchema = Category
