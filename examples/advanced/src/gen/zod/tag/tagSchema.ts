import type { TagTag } from '../../models/ts/tag/Tag'
import { z } from 'zod'

export const tagTagSchema = z.object({ id: z.number().int().optional(), name: z.string().optional() }) as z.ZodType<TagTag>
