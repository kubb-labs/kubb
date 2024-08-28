import type { UserArray } from '../models/ts/UserArray'
import { userSchema } from './userSchema.ts'
import { z } from 'zod'

export const userArraySchema = z.array(z.lazy(() => userSchema)) as z.ZodType<UserArray>
