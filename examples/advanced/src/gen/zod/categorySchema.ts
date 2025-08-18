import type { Category } from '../models/ts/Category.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const categorySchema = z.object({
  id: z.optional(z.int()),
  name: z.optional(z.string()),
}) as unknown as ToZod<Category>

export type CategorySchema = Category
