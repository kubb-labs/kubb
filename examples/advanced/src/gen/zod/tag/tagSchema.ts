import { z } from 'zod'
import type { TagTag } from '../../models/ts/tag/Tag'

export const tagTagSchema: z.ZodType<TagTag> = z.object({ 'id': z.number().optional(), 'name': z.string().optional() })
