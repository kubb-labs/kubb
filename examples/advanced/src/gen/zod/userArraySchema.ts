import { z } from 'zod'
import type { UserArray } from '../models/ts/UserArray'
import { userSchema } from './userSchema'

export const userArraySchema = z.array(z.lazy(() => userSchema)) as z.ZodType<UserArray>
