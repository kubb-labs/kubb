import type { CategoryType } from '../ts/CategoryType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const categorySchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
  parent: z.lazy(() => categorySchema).optional(),
}) as unknown as ToZod<CategoryType>

export type CategorySchema = CategoryType
