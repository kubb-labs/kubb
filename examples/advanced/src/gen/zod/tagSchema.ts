import { z } from 'zod'

export const tagSchema = z.object({ 'id': z.number().optional(), 'name': z.string().optional() }).optional()
