import { z } from 'zod'
import type { Tag } from '../models/ts/Tag'

export const tagSchema: z.ZodType<Tag> = z.object({ 'id': z.number().optional(), 'name': z.string().optional() })
