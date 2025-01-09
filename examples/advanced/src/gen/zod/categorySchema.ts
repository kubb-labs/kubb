import type { Category } from '../models/ts/Category.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const categorySchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
}) as unknown as ToZod<Category>

export type CategorySchema = Category
