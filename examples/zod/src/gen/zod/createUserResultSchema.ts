import { z } from 'zod'

export const createUserResultSchema = z.object({ success: z.boolean() })
