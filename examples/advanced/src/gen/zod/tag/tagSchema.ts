import type { TagTag } from '../../models/ts/tag/Tag.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const tagTagSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
} satisfies ToZod<TagTag>)

export type TagTagSchema = TagTag
