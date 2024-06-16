import { z } from 'zod'
import type { TagTag } from '../../models/ts/tag/Tag'

export const tagTagSchema = z.object({ id: z.coerce.number().optional(), name: z.coerce.string().optional() }) as z.ZodType<TagTag>
