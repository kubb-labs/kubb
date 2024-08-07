import { z } from '../../zod.ts'

export const tagSchema = z.object({ id: z.number().optional(), name: z.string().optional() })
export type TagSchema = z.infer<typeof tagSchema>
