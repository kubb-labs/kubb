import * as z from 'zod'
import type { TagTag } from '../../models/ts/tag/Tag.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'

export const tagTagSchema = z.object({
  id: z.optional(z.bigint().default(BigInt(1))),
  name: z.optional(z.string()),
}) as unknown as ToZod<TagTag>

export type TagTagSchema = TagTag
