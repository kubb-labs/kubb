import type { TagType } from '../ts/TagType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const tagSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
}) as unknown as ToZod<TagType>

export type TagSchema = TagType