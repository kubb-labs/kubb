import * as z from 'zod'
import { userSchema } from './userSchema.ts'

export const userArraySchema = z.array(userSchema)

export type UserArraySchema = z.infer<typeof userArraySchema>
