import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

export const userArraySchema = z.array(userSchema)

export type UserArraySchema = z.infer<typeof userArraySchema>
