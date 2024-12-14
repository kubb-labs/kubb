import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

export const userArraySchema = z.array(z.lazy(() => userSchema))

export type UserArraySchema = z.infer<typeof userArraySchema>
