import { userSchema } from './userSchema.ts'
import { z } from 'zod'

export const userArraySchema = z.array(z.lazy(() => userSchema))

export type UserArraySchema = z.infer<typeof userArraySchema>
