import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { TagTag } from '../../models/ts/tag/Tag.ts'

export const tagTagSchema = z.object({
  id: z.optional(z.number().int().min(5).max(7).default(1)),
  name: z.optional(z.string()),
}) as unknown as ToZod<TagTag>

export type TagTagSchema = TagTag
