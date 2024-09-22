import { z } from 'zod'
import type { TagTag } from '../../models/ts/tag/Tag'

export const tagTagSchema = z.object({ id: z.number().int().optional(), name: z.string().optional() }) as z.ZodType<TagTag>
