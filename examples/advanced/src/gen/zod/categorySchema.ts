import type { Category } from '../models/ts/Category.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const categorySchema = z.object({
  id: z.int().optional(),
  name: z.string().optional(),
}) as unknown as ToZod<Category>

export type CategorySchema = Category
