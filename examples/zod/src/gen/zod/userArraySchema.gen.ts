import { userSchema } from './userSchema.gen'
import { z } from '../../zod.ts'

export const userArraySchema = z.array(z.lazy(() => userSchema))
export type UserArraySchema = z.infer<typeof userArraySchema>
