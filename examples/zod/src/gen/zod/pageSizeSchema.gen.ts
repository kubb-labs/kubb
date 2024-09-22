import { z } from '../../zod.ts'

export const pageSizeSchema = z.number().int().min(1).max(10).default(20)
export type PageSizeSchema = z.infer<typeof pageSizeSchema>
