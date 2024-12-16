import type { TagTag } from '../../models/ts/tag/Tag.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const tagTagSchema = z.object({
  id: z.number().int().min(5).max(7).default(1),
  name: z.string().optional(),
} satisfies ToZod<TagTag>)

export type TagTagSchema = TagTag
