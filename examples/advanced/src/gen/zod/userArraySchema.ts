import { z } from 'zod/v4'
import { userSchema } from './userSchema.ts'

export const userArraySchema = z.array(userSchema)

export type UserArraySchema = z.infer<typeof userArraySchema>
