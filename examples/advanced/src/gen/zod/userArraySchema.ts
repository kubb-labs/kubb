import { userSchema } from './userSchema'
import { z } from 'zod'
import type { UserArray } from '../models/ts/UserArray'

export const userArraySchema: z.ZodType<UserArray> = z.array(z.lazy(() => userSchema))
